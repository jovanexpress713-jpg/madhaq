(() => {
  'use strict';

  const LIVE_DB_KEY = 'madhaq_factory_db_v1';
  const BACKUP_DB = 'madhaq_monthly_backups_v1';
  const BACKUP_STORE = 'snapshots';
  const RETENTION = 12;
  const FORMAT = 'MADHAQ_MONTHLY_BACKUP_V1';

  const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

  const open = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(BACKUP_DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BACKUP_STORE)) {
        const store = db.createObjectStore(BACKUP_STORE, { keyPath: 'id' });
        store.createIndex('monthKey', 'monthKey', { unique: true });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('backup storage unavailable'));
  });

  const all = async () => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BACKUP_STORE, 'readonly');
      const request = tx.objectStore(BACKUP_STORE).getAll();
      request.onsuccess = () => { db.close(); resolve(request.result || []); };
      request.onerror = () => { db.close(); reject(request.error || new Error('cannot list backups')); };
    });
  };

  const pack = async (text) => {
    if ('CompressionStream' in window) {
      const compression = new CompressionStream('gzip');
      const result = new Response(compression.readable).blob();
      const writer = compression.writable.getWriter();
      await writer.write(new TextEncoder().encode(text));
      await writer.close();
      return { blob: await result, compressed: true };
    }
    return { blob: new Blob([text], { type: 'application/json' }), compressed: false };
  };

  const unpack = async (blob, compressed) => {
    if (compressed && 'DecompressionStream' in window) {
      const decompression = new DecompressionStream('gzip');
      return new Response(blob.stream().pipeThrough(decompression)).text();
    }
    return blob.text();
  };

  const prune = async () => {
    const snapshots = (await all()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    const remove = snapshots.slice(RETENTION);
    if (!remove.length) return;
    const db = await open();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(BACKUP_STORE, 'readwrite');
      const store = tx.objectStore(BACKUP_STORE);
      remove.forEach((item) => store.delete(item.id));
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error || new Error('backup cleanup failed')); };
    });
  };

  const createOrRefreshCurrentMonth = async () => {
    const raw = localStorage.getItem(LIVE_DB_KEY);
    if (!raw) return null;
    let database;
    try { database = JSON.parse(raw); } catch { return null; }
    if (!database || typeof database !== 'object' || !database.version) return null;

    const key = monthKey();
    const exportedAt = new Date().toISOString();
    const payload = JSON.stringify({ format: FORMAT, exportedAt, database });
    const packed = await pack(payload);
    const snapshot = {
      id: `monthly-${key}`,
      monthKey: key,
      createdAt: Date.now(),
      sizeBytes: packed.blob.size,
      compressed: packed.compressed,
      payload: packed.blob
    };

    const db = await open();
    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction(BACKUP_STORE, 'readwrite');
        tx.objectStore(BACKUP_STORE).put(snapshot);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('backup write failed'));
      });
    } finally {
      db.close();
    }
    await prune();
    return snapshot;
  };

  const get = async (id) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BACKUP_STORE, 'readonly');
      const request = tx.objectStore(BACKUP_STORE).get(id);
      request.onsuccess = () => {
        db.close();
        if (!request.result) reject(new Error('Backup not found'));
        else resolve(request.result);
      };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  };

  const validate = (database) => {
    const required = ['areas', 'customers', 'customerSales', 'customerPayments', 'supplyRequests', 'customerReturns', 'customerWeeklyCloses', 'distributors', 'products', 'distributions', 'collections', 'returns', 'suppliers', 'rawMaterials', 'purchases', 'supplierPayments', 'recipes', 'productionBatches', 'expenses'];
    return !!database && typeof database === 'object' && !!database.version && required.every((key) => Array.isArray(database[key]));
  };

  const restore = async (id) => {
    const snapshot = await get(id);
    const raw = await unpack(snapshot.payload, snapshot.compressed);
    const envelope = JSON.parse(raw);
    if (envelope.format !== FORMAT || !validate(envelope.database)) throw new Error('النسخة الاحتياطية غير صالحة');
    if (!window.confirm(`سيتم استبدال البيانات الحالية بنسخة ${snapshot.monthKey}. هل تريد المتابعة؟`)) return false;
    localStorage.setItem(LIVE_DB_KEY, JSON.stringify(envelope.database));
    location.reload();
    return true;
  };

  const download = async (id) => {
    const snapshot = await get(id);
    const url = URL.createObjectURL(snapshot.payload);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `MADHAQ-Backup-${snapshot.monthKey}.gz`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  window.MadhaqBackup = {
    ensureCurrentMonth: createOrRefreshCurrentMonth,
    list: async () => (await all()).sort((a, b) => b.monthKey.localeCompare(a.monthKey)).map(({ id, monthKey: key, createdAt, sizeBytes, compressed }) => ({ id, monthKey: key, createdAt, sizeBytes, compressed })),
    restore,
    download
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      createOrRefreshCurrentMonth().catch((error) => console.warn('Monthly backup skipped:', error));
    }, 1500);
  };

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    const result = originalSetItem.call(this, key, value);
    if (this === localStorage && key === LIVE_DB_KEY) schedule();
    return result;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedule, { once: true });
  } else {
    schedule();
  }
})();
