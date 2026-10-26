export type AuthRole = 'MANAGER';

export interface LocalUser {
  id: string;
  displayName: string;
  username: string;
  role: AuthRole;
  createdAt: number;
}

interface StoredAccount extends LocalUser {
  salt: string;
  passwordDigest: string;
}

export interface AuthState {
  hasAccount: boolean;
  currentUser: LocalUser | null;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  user?: LocalUser;
}

const ACCOUNT_KEY = 'madhaq_local_manager_v1';
const SESSION_KEY = 'madhaq_local_session_v1';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function digestPassword(password: string, salt: Uint8Array): Promise<string> {
  const data = new TextEncoder().encode(`${bytesToBase64(salt)}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64(new Uint8Array(digest));
}

function readAccount(): StoredAccount | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount) : null;
  } catch {
    return null;
  }
}

function readSession(): LocalUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

export function getAuthState(): AuthState {
  const account = readAccount();
  const session = readSession();
  return { hasAccount: Boolean(account), currentUser: account && session ? session : null };
}

export async function createManager(input: {
  displayName: string;
  username: string;
  password: string;
}): Promise<AuthResult> {
  const displayName = input.displayName.trim();
  const username = input.username.trim().toLowerCase();

  if (readAccount()) return { ok: false, error: 'يوجد مدير نظام مُسجل بالفعل على هذا الجهاز.' };
  if (displayName.length < 2) return { ok: false, error: 'اكتب اسم مدير النظام.' };
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return { ok: false, error: 'اسم المستخدم يجب أن يكون 3–32 حرفًا إنجليزيًا أو رقمًا.' };
  }
  if (input.password.length < 6) return { ok: false, error: 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل.' };

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const user: LocalUser = {
    id: `manager-${Date.now()}`,
    displayName,
    username,
    role: 'MANAGER',
    createdAt: Date.now(),
  };
  const account: StoredAccount = {
    ...user,
    salt: bytesToBase64(salt),
    passwordDigest: await digestPassword(input.password, salt),
  };

  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  return { ok: true, user };
}

export async function login(username: string, password: string): Promise<AuthResult> {
  const account = readAccount();
  if (!account) return { ok: false, error: 'لم يتم إنشاء مدير النظام بعد.' };

  const normalized = username.trim().toLowerCase();
  const digest = await digestPassword(password, base64ToBytes(account.salt));
  if (normalized !== account.username || digest !== account.passwordDigest) {
    return { ok: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  }

  const user: LocalUser = {
    id: account.id,
    displayName: account.displayName,
    username: account.username,
    role: account.role,
    createdAt: account.createdAt,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return { ok: true, user };
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): LocalUser | null {
  const state = getAuthState();
  return state.currentUser;
}
