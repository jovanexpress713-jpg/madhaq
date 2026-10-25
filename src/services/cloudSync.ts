import type { DatabaseSchema } from '../types';

export const CLOUD_SYNC_SCHEMA_VERSION = 1;
const SESSION_KEY = 'madhaq_cloud_session_v1';

export interface CloudSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email?: string;
}

export interface CloudMembership {
  workspaceId: string;
  role: 'OWNER' | 'ADMIN' | 'ACCOUNTANT' | 'OPERATOR' | 'VIEWER';
}

export interface RemoteDatabaseState {
  version: number;
  payload: DatabaseSchema;
  updatedAt: string;
  updatedBy?: string;
}

export type CloudSyncAction =
  | { kind: 'noop' }
  | { kind: 'pull'; remoteVersion: number }
  | { kind: 'push'; expectedRemoteVersion: number; nextVersion: number }
  | { kind: 'conflict'; localVersion: number; remoteVersion: number };

export function resolveCloudSyncAction(input: {
  localVersion: number;
  remoteVersion: number;
  pendingLocalBaseVersion?: number;
}): CloudSyncAction {
  const { localVersion, remoteVersion, pendingLocalBaseVersion } = input;
  if (localVersion === remoteVersion) return { kind: 'noop' };
  if (pendingLocalBaseVersion !== undefined && pendingLocalBaseVersion !== remoteVersion) {
    return { kind: 'conflict', localVersion, remoteVersion };
  }
  if (remoteVersion > localVersion) return { kind: 'pull', remoteVersion };
  return { kind: 'push', expectedRemoteVersion: remoteVersion, nextVersion: localVersion };
}

function config() {
  const url = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
  const key = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  const workspaceId = String(import.meta.env.VITE_MADHAQ_WORKSPACE_ID || '');
  return { url, key, workspaceId };
}

export function isCloudConfigured(): boolean {
  const { url, key, workspaceId } = config();
  return Boolean(url && key && workspaceId);
}

function requireConfig() {
  const value = config();
  if (!value.url || !value.key) throw new Error('إعداد Supabase غير مكتمل: أضف VITE_SUPABASE_URL و VITE_SUPABASE_PUBLISHABLE_KEY');
  if (!value.workspaceId) throw new Error('معرّف مساحة مذاق غير مضبوط: أضف VITE_MADHAQ_WORKSPACE_ID');
  return value;
}

function readSession(): CloudSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as CloudSession;
    if (!value?.accessToken || !value?.refreshToken || !value?.userId) return null;
    return value;
  } catch {
    return null;
  }
}

function writeSession(session: CloudSession | null): void {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

async function authRequest(path: string, init: RequestInit = {}) {
  const { url, key } = requireConfig();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    ...init,
    headers: { apikey: key, 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.msg || body.message || body.error_description || 'فشل طلب المصادقة');
  return body;
}

function sessionFromAuthBody(body: any, fallback?: CloudSession): CloudSession {
  const session: CloudSession = {
    accessToken: body.access_token,
    refreshToken: body.refresh_token || fallback?.refreshToken,
    expiresAt: Date.now() + Number(body.expires_in || 3600) * 1000,
    userId: body.user?.id || fallback?.userId,
    email: body.user?.email || fallback?.email
  };
  if (!session.accessToken || !session.refreshToken || !session.userId) throw new Error('جلسة المصادقة غير مكتملة');
  return session;
}

export async function signInWithPassword(email: string, password: string): Promise<CloudSession> {
  const body = await authRequest('token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  const session = sessionFromAuthBody(body);
  writeSession(session);
  return session;
}

export async function signUpWithPassword(email: string, password: string): Promise<{ session: CloudSession | null; message?: string }> {
  const body = await authRequest('signup', { method: 'POST', body: JSON.stringify({ email: email.trim(), password }) });
  if (!body.access_token) return { session: null, message: 'تم إنشاء الحساب. تحقق من البريد الإلكتروني قبل تسجيل الدخول.' };
  const session = sessionFromAuthBody(body);
  writeSession(session);
  return { session };
}

export async function refreshCloudSession(): Promise<CloudSession | null> {
  const current = readSession();
  if (!current?.refreshToken) return null;
  try {
    const body = await authRequest('token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: current.refreshToken }) });
    const session = sessionFromAuthBody(body, current);
    writeSession(session);
    return session;
  } catch {
    writeSession(null);
    return null;
  }
}

export async function getCloudSession(): Promise<CloudSession | null> {
  const session = readSession();
  if (!session) return null;
  if (session.expiresAt - Date.now() > 60_000) return session;
  return refreshCloudSession();
}

export async function signOutCloud(): Promise<void> {
  const session = readSession();
  try {
    if (session) {
      const { url, key } = requireConfig();
      await fetch(`${url}/auth/v1/logout`, { method: 'POST', headers: { apikey: key, Authorization: `Bearer ${session.accessToken}` } });
    }
  } finally {
    writeSession(null);
  }
}

async function dataRequest(path: string, init: RequestInit = {}) {
  const { url, key } = requireConfig();
  const session = await getCloudSession();
  if (!session) throw new Error('يجب تسجيل الدخول أولاً');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json', ...(init.headers || {}) }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.hint || body?.details || 'فشل الاتصال بقاعدة البيانات السحابية');
  return body;
}

export async function getCloudMembership(): Promise<CloudMembership> {
  const { workspaceId } = requireConfig();
  const session = await getCloudSession();
  if (!session) throw new Error('يجب تسجيل الدخول أولاً');
  const rows = await dataRequest(`madhaq_workspace_members?select=workspace_id,role&workspace_id=eq.${encodeURIComponent(workspaceId)}&user_id=eq.${encodeURIComponent(session.userId)}&limit=1`);
  const row = rows?.[0];
  if (!row) throw new Error('الحساب مسجل لكنه غير مرتبط بمساحة مذاق هذه');
  return { workspaceId: row.workspace_id, role: row.role };
}

export async function pullRemoteDatabase(): Promise<RemoteDatabaseState | null> {
  const { workspaceId } = requireConfig();
  const rows = await dataRequest(`madhaq_workspace_state?select=version,payload,updated_at,updated_by&workspace_id=eq.${encodeURIComponent(workspaceId)}&limit=1`);
  const row = rows?.[0];
  if (!row) return null;
  return { version: Number(row.version), payload: row.payload as DatabaseSchema, updatedAt: String(row.updated_at), updatedBy: row.updated_by || undefined };
}

export async function pushRemoteDatabase(payload: DatabaseSchema, expectedRemoteVersion: number): Promise<RemoteDatabaseState> {
  const { workspaceId } = requireConfig();
  const session = await getCloudSession();
  if (!session) throw new Error('يجب تسجيل الدخول أولاً');
  const nextVersion = expectedRemoteVersion + 1;
  const rows = await dataRequest(`madhaq_workspace_state?workspace_id=eq.${encodeURIComponent(workspaceId)}&version=eq.${expectedRemoteVersion}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ payload, version: nextVersion, updated_at: new Date().toISOString(), updated_by: session.userId })
  });
  const row = rows?.[0];
  if (!row) throw new Error('SYNC_CONFLICT');
  return { version: Number(row.version), payload: row.payload as DatabaseSchema, updatedAt: String(row.updated_at), updatedBy: row.updated_by || undefined };
}

export async function createRemoteWorkspace(name: string): Promise<string> {
  const rows = await dataRequest('rpc/create_madhaq_workspace', { method: 'POST', body: JSON.stringify({ workspace_name: name.trim() }) });
  const id = Array.isArray(rows) ? rows[0] : rows;
  if (!id) throw new Error('تعذر إنشاء مساحة العمل');
  return String(id);
}
