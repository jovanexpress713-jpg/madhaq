# MADHAQ Local Recovery Snapshots

MADHAQ keeps a small rolling recovery history in browser/device storage in addition to the main database key.

- Retention: 2 days.
- Maximum snapshots: 8.
- Snapshot interval: 6 hours.
- Snapshots contain the current MADHAQ database JSON only.
- Snapshot failures never block normal accounting writes.
- This is a local recovery layer, not a substitute for exporting a backup file or future server synchronization.
