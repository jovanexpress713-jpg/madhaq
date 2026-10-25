import { storage } from './storage';
import {
  getCloudMembership,
  getCloudSession,
  isCloudConfigured,
  pullRemoteDatabase,
  pushRemoteDatabase,
  type CloudMembership
} from './cloudSync';

const META_KEY = 'madhaq_cloud_sync_meta_v1';
const POLL_MS = 10_000;

type SyncStatus = 'LOCAL_ONLY' | 'SYNCING' | 'SYNCED' | 'OFFLINE' | 'CONFLICT' | 'ERROR';

interface Meta {
  remoteVersion: number;
  pendingBaseVersion?: number;
}

let status: SyncStatus = 'LOCAL_ONLY';
let errorMessage = '';
let membership: CloudMembership | null = null;
let timer: number | undefined;
let unsubscribeStorage: (() => void) | undefined;
let listeners = new Set<() => void>();
let applyingRemote = false;
let syncQueued = false;

function readMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      remoteVersion: Number(parsed.remoteVersion || 0),
      pendingBaseVersion: parsed.pendingBaseVersion === undefined ? undefined : Number(parsed.pendingBaseVersion)
    };
  } catch {
    return { remoteVersion: 0 };
  }
}

function writeMeta(meta: Meta): void {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function emit(): void {
  listeners.forEach(listener => {
    try { listener(); } catch (error) { console.error(error); }
  });
}

function setStatus(next: SyncStatus, message = ''): void {
  status = next;
  errorMessage = message;
  emit();
}

function hasOperationalData(): boolean {
  const db = storage.getDatabase();
  return [
    db.distributors, db.products, db.distributions, db.collections, db.returns,
    db.suppliers, db.rawMaterials, db.purchases, db.supplierPayments,
    db.recipes, db.productionBatches, db.expenses, db.customers,
    db.customerSales, db.customerPayments, db.supplyRequests, db.customerReturns
  ].some(items => items.length > 0);
}

function isEmptyDatabase(payload: ReturnType<typeof storage.getDatabase>): boolean {
  return ![
    payload.distributors, payload.products, payload.distributions, payload.collections, payload.returns,
    payload.suppliers, payload.rawMaterials, payload.purchases, payload.supplierPayments,
    payload.recipes, payload.productionBatches, payload.expenses, payload.customers,
    payload.customerSales, payload.customerPayments, payload.supplyRequests, payload.customerReturns
  ].some(items => items.length > 0);
}

async function pullAndApply(): Promise<void> {
  const remote = await pullRemoteDatabase();
  if (!remote) throw new Error('لا توجد قاعدة بيانات سحابية لمساحة العمل');
  const meta = readMeta();

  if (remote.version === meta.remoteVersion) {
    setStatus('SYNCED');
    return;
  }

  if (meta.pendingBaseVersion !== undefined && remote.version !== meta.pendingBaseVersion) {
    setStatus('CONFLICT', 'تم تعديل البيانات من جهاز آخر أثناء وجود تعديلات محلية غير مرفوعة.');
    return;
  }

  applyingRemote = true;
  try {
    storage.importBackupJSON(JSON.stringify(remote.payload));
    writeMeta({ remoteVersion: remote.version });
    setStatus('SYNCED');
  } finally {
    applyingRemote = false;
  }
}

async function pushLocal(): Promise<void> {
  if (syncQueued) return;
  syncQueued = true;
  try {
    const session = await getCloudSession();
    if (!session) {
      setStatus('LOCAL_ONLY');
      return;
    }
    const meta = readMeta();
    const baseVersion = meta.pendingBaseVersion ?? meta.remoteVersion;
    setStatus('SYNCING');
    const remote = await pushRemoteDatabase(storage.getDatabase(), baseVersion);
    writeMeta({ remoteVersion: remote.version });
    setStatus('SYNCED');
  } catch (error) {
    if (error instanceof Error && error.message === 'SYNC_CONFLICT') {
      setStatus('CONFLICT', 'حدث تعارض: جهاز آخر حفظ بيانات أحدث. لم يتم الكتابة فوق بياناتك المحلية.');
    } else if (!navigator.onLine) {
      setStatus('OFFLINE', 'لا يوجد اتصال بالإنترنت؛ التعديلات محفوظة محلياً.');
    } else {
      setStatus('ERROR', error instanceof Error ? error.message : 'فشل رفع البيانات');
    }
  } finally {
    syncQueued = false;
  }
}

function handleLocalCommit(): void {
  if (applyingRemote || !isCloudConfigured()) return;
  const meta = readMeta();
  if (meta.pendingBaseVersion === undefined) {
    writeMeta({ ...meta, pendingBaseVersion: meta.remoteVersion });
  }
  window.setTimeout(() => { void pushLocal(); }, 250);
}

async function tick(): Promise<void> {
  if (!isCloudConfigured()) return;
  if (!navigator.onLine) {
    setStatus('OFFLINE', 'لا يوجد اتصال بالإنترنت؛ التعديلات الجديدة ستبقى محلياً حتى يعود الاتصال.');
    return;
  }
  try {
    const meta = readMeta();
    const remote = await pullRemoteDatabase();
    if (!remote) return;
    if (meta.pendingBaseVersion !== undefined) {
      if (remote.version !== meta.pendingBaseVersion) {
        setStatus('CONFLICT', 'حدث تعديل على جهاز آخر قبل رفع التعديلات المحلية.');
      }
      return;
    }
    if (remote.version > meta.remoteVersion) await pullAndApply();
    else if (remote.version < meta.remoteVersion) setStatus('CONFLICT', 'نسخة الخادم أقدم من النسخة المحلية؛ يلزم مراجعة التزامن.');
  } catch (error) {
    setStatus(navigator.onLine ? 'ERROR' : 'OFFLINE', error instanceof Error ? error.message : 'فشل مزامنة البيانات');
  }
}

export async function startCloudSync(): Promise<void> {
  stopCloudSync();
  if (!isCloudConfigured()) {
    setStatus('LOCAL_ONLY');
    return;
  }

  const session = await getCloudSession();
  if (!session) {
    setStatus('LOCAL_ONLY');
    return;
  }

  setStatus('SYNCING');
  membership = await getCloudMembership();
  const remote = await pullRemoteDatabase();
  const meta = readMeta();

  if (!remote) throw new Error('قاعدة البيانات السحابية غير مهيأة');

  if (isEmptyDatabase(remote.payload) && hasOperationalData()) {
    const uploaded = await pushRemoteDatabase(storage.getDatabase(), remote.version);
    writeMeta({ remoteVersion: uploaded.version });
  } else if (meta.pendingBaseVersion === undefined || remote.version !== meta.remoteVersion) {
    applyingRemote = true;
    try {
      storage.importBackupJSON(JSON.stringify(remote.payload));
      writeMeta({ remoteVersion: remote.version });
    } finally {
      applyingRemote = false;
    }
  }

  unsubscribeStorage = storage.subscribe(handleLocalCommit);
  timer = window.setInterval(() => { void tick(); }, POLL_MS);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  setStatus('SYNCED');
}

function handleOnline(): void { void tick(); }
function handleOffline(): void { setStatus('OFFLINE', 'لا يوجد اتصال بالإنترنت؛ البيانات محفوظة محلياً.'); }

export function stopCloudSync(): void {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
  unsubscribeStorage?.();
  unsubscribeStorage = undefined;
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  membership = null;
}

export function subscribeCloudSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCloudSyncSnapshot(): { status: SyncStatus; errorMessage: string; membership: CloudMembership | null } {
  return { status, errorMessage, membership };
}

export async function forceCloudSync(): Promise<void> {
  await pushLocal();
  await tick();
}
