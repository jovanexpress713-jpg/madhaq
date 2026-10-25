import assert from 'node:assert/strict';

const memory = new Map<string, string>();
const listeners = new Set<(event: Event) => void>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)); },
    removeItem: (key: string) => { memory.delete(key); },
    clear: () => memory.clear(),
  },
});

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    setInterval: () => 1,
    clearInterval: () => undefined,
    addEventListener: (_type: string, listener: (event: Event) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: Event) => void) => listeners.delete(listener),
    dispatchEvent: (event: Event) => {
      listeners.forEach(listener => listener(event));
      return true;
    },
  },
});

const { installRecoveryBackup, getRecoverySnapshotCount } = await import('../src/services/recoveryBackup');

localStorage.setItem('madhaq_factory_db_v1', JSON.stringify({ version: 3, marker: 'before' }));
const cleanup = installRecoveryBackup();
assert.equal(getRecoverySnapshotCount(), 1, 'Startup must create an initial recovery snapshot');

localStorage.setItem('madhaq_factory_db_v1', JSON.stringify({ version: 3, marker: 'after' }));
window.dispatchEvent(new Event('madhaq:database-committed'));

assert.equal(getRecoverySnapshotCount(), 2, 'A same-tab database commit must create a recovery snapshot');
cleanup();

console.log('Same-tab recovery backup validation passed.');
