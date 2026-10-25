import assert from 'node:assert/strict';

const { resolveCloudSyncAction, CLOUD_SYNC_SCHEMA_VERSION } = await import('../src/services/cloudSync');

assert.equal(CLOUD_SYNC_SCHEMA_VERSION, 1);
assert.deepEqual(
  resolveCloudSyncAction({ localVersion: 4, remoteVersion: 4 }),
  { kind: 'noop' }
);
assert.deepEqual(
  resolveCloudSyncAction({ localVersion: 4, remoteVersion: 5 }),
  { kind: 'pull', remoteVersion: 5 }
);
assert.deepEqual(
  resolveCloudSyncAction({ localVersion: 5, remoteVersion: 4 }),
  { kind: 'push', expectedRemoteVersion: 4, nextVersion: 5 }
);
assert.deepEqual(
  resolveCloudSyncAction({ localVersion: 5, remoteVersion: 3, pendingLocalBaseVersion: 3 }),
  { kind: 'push', expectedRemoteVersion: 3, nextVersion: 5 }
);
assert.deepEqual(
  resolveCloudSyncAction({ localVersion: 5, remoteVersion: 4, pendingLocalBaseVersion: 3 }),
  { kind: 'conflict', localVersion: 5, remoteVersion: 4 }
);

console.log('Cloud sync contract validation passed.');
