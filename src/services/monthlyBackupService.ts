import type { DatabaseSchema } from '../types';

const DB_NAME = 'madhaq_monthly_backups_v1';
const STORE_NAME = 'snapshots';
const DB_VERSION = 1;
const RETENTION_MONTHS = 12;

export type MonthlyBackupMetadata = {
  id: string;
  monthKey: string;
  createdAt: number;
  sizeBytes: number;
  compressed: boolean;
};

type StoredSnapshot = MonthlyBackupMetadata & {
  payload: Blob;
};

function monthKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('monthKey', 'monthKey', { unique: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open backup storage'));
  });
}

async function compress(text: string): Promise<{ blob: Blob; compressed: boolean }> {
  if ('CompressionStream' in window) {
    const stream = new CompressionStream('gzip');
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    const promise = new Response(stream.readable).blob();
    await writer.write(encoder.encode(text));
    await writer.close();
    return { blob: await promise, compressed: true };
  }
  return { blob: new Blob([text], { type: 'application/json' }), compressed: false };
}

async function decompress(blob: Blob, compressed: boolean): Promise<string> {
  if (compressed && 'DecompressionStream' in window) {
    const stream = new DecompressionStream('gzip');
    return await new Response(blob.stream().pipeThrough(stream)).text();
  }
  return await blob.text();
}

function putSnapshot(snapshot: StoredSnapshot): Promise<void> {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(snapshot);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Unable to save monthly backup'));
    };
  }));
}

export async function listMonthlyBackups(): Promise<MonthlyBackupMetadata[]> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result as StoredSnapshot[])
        .map(({ id, monthKey: key, createdAt, sizeBytes, compressed }) => ({
          id,
          monthKey: key,
          createdAt,
          sizeBytes,
          compressed
        }))
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error('Unable to list backups'));
    };
  });
}

async function pruneOldBackups(): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const snapshots = (request.result as StoredSnapshot[]).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      snapshots.slice(RETENTION_MONTHS).forEach((snapshot) => store.delete(snapshot.id));
    };
    request.onerror = () => reject(request.error ?? new Error('Unable to inspect backup retention'));
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error('Unable to prune old backups'));
    };
  });
}

export async function createMonthlyBackup(dbData: DatabaseSchema, now = new Date()): Promise<MonthlyBackupMetadata> {
  const key = monthKey(now);
  const existing = (await listMonthlyBackups()).find((backup) => backup.monthKey === key);
  if (existing) return existing;

  const serialized = JSON.stringify({
    format: 'MADHAQ_MONTHLY_BACKUP_V1',
    exportedAt: now.toISOString(),
    database: dbData
  });
  const packed = await compress(serialized);
  const snapshot: StoredSnapshot = {
    id: `monthly-${key}`,
    monthKey: key,
    createdAt: now.getTime(),
    sizeBytes: packed.blob.size,
    compressed: packed.compressed,
    payload: packed.blob
  };

  await putSnapshot(snapshot);
  await pruneOldBackups();
  return {
    id: snapshot.id,
    monthKey: snapshot.monthKey,
    createdAt: snapshot.createdAt,
    sizeBytes: snapshot.sizeBytes,
    compressed: snapshot.compressed
  };
}

export async function ensureCurrentMonthlyBackup(dbData: DatabaseSchema): Promise<MonthlyBackupMetadata | null> {
  if (typeof indexedDB === 'undefined') return null;
  try {
    return await createMonthlyBackup(dbData);
  } catch (error) {
    console.warn('Monthly backup was skipped:', error);
    return null;
  }
}

async function getSnapshot(id: string): Promise<StoredSnapshot> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => {
      db.close();
      if (!request.result) reject(new Error('Backup not found'));
      else resolve(request.result as StoredSnapshot);
    };
    request.onerror = () => {
      db.close();
      reject(request.error ?? new Error('Unable to read backup'));
    };
  });
}

function validateDatabase(value: unknown): value is DatabaseSchema {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  const collections = [
    'areas', 'customers', 'customerSales', 'customerPayments', 'supplyRequests',
    'customerReturns', 'customerWeeklyCloses', 'distributors', 'products',
    'distributions', 'collections', 'returns', 'suppliers', 'rawMaterials',
    'purchases', 'supplierPayments', 'recipes', 'productionBatches', 'expenses'
  ];
  return candidate.version !== undefined && collections.every((key) => Array.isArray(candidate[key]));
}

export async function restoreMonthlyBackup(id: string): Promise<DatabaseSchema> {
  const snapshot = await getSnapshot(id);
  const raw = await decompress(snapshot.payload, snapshot.compressed);
  const envelope = JSON.parse(raw) as { format?: string; database?: unknown };
  if (envelope.format !== 'MADHAQ_MONTHLY_BACKUP_V1' || !validateDatabase(envelope.database)) {
    throw new Error('نسخة الاحتياطية غير صالحة أو غير متوافقة مع مذاق');
  }
  return envelope.database;
}

export async function exportMonthlyBackup(id: string): Promise<Blob> {
  const snapshot = await getSnapshot(id);
  return snapshot.payload;
}

export async function importMonthlyBackup(file: Blob): Promise<DatabaseSchema> {
  const raw = await decompress(file, file.type === 'application/gzip' || file.type === 'application/x-gzip');
  const envelope = JSON.parse(raw) as { format?: string; database?: unknown };
  if (envelope.format !== 'MADHAQ_MONTHLY_BACKUP_V1' || !validateDatabase(envelope.database)) {
    throw new Error('ملف النسخة الاحتياطية غير صالح أو غير متوافق مع مذاق');
  }
  return envelope.database;
}
