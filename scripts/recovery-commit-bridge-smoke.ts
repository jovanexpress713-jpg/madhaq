import assert from 'node:assert/strict';

const commitListeners = new Set<() => void>();
let recoveryEvents = 0;

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    dispatchEvent: (event: Event) => {
      if (event.type === 'madhaq:database-committed') recoveryEvents += 1;
      return true;
    },
  },
});

const { installRecoveryCommitBridge } = await import('../src/services/recoveryCommitBridge');

const unsubscribe = installRecoveryCommitBridge((listener) => {
  commitListeners.add(listener);
  return () => commitListeners.delete(listener);
});

commitListeners.forEach(listener => listener());
assert.equal(recoveryEvents, 1, 'A storage commit must emit a recovery notification');

unsubscribe();
console.log('Recovery commit bridge validation passed.');
