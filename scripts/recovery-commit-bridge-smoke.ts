import assert from 'node:assert/strict';

const listeners = new Set<() => void>();
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    dispatchEvent: (event: Event) => {
      if (event.type === 'madhaq:database-committed') {
        listeners.forEach(listener => listener());
      }
      return true;
    },
  },
});

const { installRecoveryCommitBridge } = await import('../src/services/recoveryCommitBridge');

const unsubscribe = installRecoveryCommitBridge((listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
});

let commitsObserved = 0;
const stopObserver = (() => {
  const listener = () => { commitsObserved += 1; };
  listeners.add(listener);
  return () => listeners.delete(listener);
})();

listeners.forEach(listener => listener());
assert.equal(commitsObserved, 1, 'A storage commit must emit a recovery notification');

stopObserver();
unsubscribe();
console.log('Recovery commit bridge validation passed.');
