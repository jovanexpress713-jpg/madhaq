const DATABASE_KEY = 'madhaq_factory_db_v1';
const RECOVERY_KEY = 'madhaq_recovery_snapshots_v1';
const MAX_SNAPSHOTS = 8;
const SNAPSHOT_INTERVAL_MS = 6 * 60 * 60 * 1000;
const RETENTION_MS = 2 * 24 * 60 * 60 * 1000;

interface RecoverySnapshot {
  createdAt: number;
  reason: 'startup' | 'change';
  database: string;
}

function readSnapshots(): RecoverySnapshot[] {
  try {
    const raw = localStorage.getItem(RECOVERY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is RecoverySnapshot =>
      item && typeof item.createdAt === 'number' &&
      (item.reason === 'startup' || item.reason === 'change') &&
      typeof item.database === 'string'
    );
  } catch {
    return [];
  }
}

function writeSnapshots(snapshots: RecoverySnapshot[]): void {
  try {
    localStorage.setItem(RECOVERY_KEY, JSON.stringify(snapshots));
  } catch (error) {
    // Recovery must never interrupt normal accounting operations.
    console.warn('MADHAQ recovery snapshot skipped:', error);
  }
}

function createSnapshot(reason: RecoverySnapshot['reason']): void {
  const database = localStorage.getItem(DATABASE_KEY);
  if (!database) return;

  const now = Date.now();
  const snapshots = readSnapshots()
    .filter(snapshot => now - snapshot.createdAt <= RETENTION_MS);

  const latest = snapshots[0];
  if (latest && now - latest.createdAt < SNAPSHOT_INTERVAL_MS) return;

  snapshots.unshift({ createdAt: now, reason, database });
  writeSnapshots(snapshots.slice(0, MAX_SNAPSHOTS));
}

/**
 * Keeps a small rolling recovery history on the same device.
 * It is intentionally independent from the main database so it cannot
 * block normal writes. Snapshots are retained for two days and capped.
 */
export function installRecoveryBackup(): () => void {
  createSnapshot('startup');

  const interval = window.setInterval(() => createSnapshot('change'), SNAPSHOT_INTERVAL_MS);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === DATABASE_KEY) createSnapshot('change');
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    window.clearInterval(interval);
    window.removeEventListener('storage', handleStorage);
  };
}

export function getRecoverySnapshotCount(): number {
  return readSnapshots().filter(snapshot => Date.now() - snapshot.createdAt <= RETENTION_MS).length;
}
