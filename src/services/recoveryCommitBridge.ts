const RECOVERY_CHANGE_EVENT = 'madhaq:database-committed';

type Subscribe = (listener: () => void) => () => void;

export function installRecoveryCommitBridge(subscribe: Subscribe): () => void {
  return subscribe(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(RECOVERY_CHANGE_EVENT));
  });
}
