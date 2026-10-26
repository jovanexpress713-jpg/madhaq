# Monthly Backup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact monthly full-system backup that keeps one full snapshot per month without overwriting prior monthly snapshots.

**Architecture:** Store compressed JSON snapshots in IndexedDB rather than creating many files. The snapshot is the complete MADHAQ database at backup time, including master data and financial/operational transactions. A month key prevents duplicate backups for the same month; retention keeps a bounded number of monthly snapshots. Manual export/import remains available for moving a backup outside the device.

**Tech Stack:** React/TypeScript, browser IndexedDB, gzip via CompressionStream with a JSON fallback, existing MADHAQ local database.

**Spec:** `docs/superpowers/specs/2026-10-26-madhaq-clean-production-start.md` plus the user-approved monthly-backup requirement from 2026-10-26.

## Global Constraints

- One full backup per calendar month; never overwrite a previous month's snapshot.
- Each snapshot includes the complete application database, not only changed records.
- Backups are compressed and stored in IndexedDB to avoid a large number of filesystem files.
- Default retention is 12 monthly snapshots; oldest snapshots may be pruned only after the retention limit is exceeded.
- Current live data is never deleted by backup creation.
- Restore must require explicit confirmation before replacing live data.
- No fabricated business/customer/supplier/financial data.

## Review Focus

- Same-month repeated backup: must keep the existing monthly snapshot unless the user explicitly replaces it.
- Cross-month backup: must create a new snapshot without modifying older months.
- Large database: compression and IndexedDB must avoid one file per record.
- Restore: invalid/corrupt data must be rejected without changing live data.
- Retention: pruning must be bounded and deterministic.

### Task 1: Backup storage and snapshot service

**Files:**
- Create: `src/services/monthlyBackupService.ts`
- Test: `scripts/monthly-backup-smoke.mjs`
- Modify: `package.json`

**Interfaces:**
- `createMonthlyBackup(db, now): Promise<BackupMetadata>`
- `listMonthlyBackups(): Promise<BackupMetadata[]>`
- `restoreMonthlyBackup(id): Promise<void>`
- `exportMonthlyBackup(id): Promise<Blob>`
- `importMonthlyBackup(file): Promise<void>`

- [ ] Write smoke tests for first backup, duplicate month, next month, retention, and restore validation.
- [ ] Implement IndexedDB storage with compressed full JSON snapshots.
- [ ] Implement bounded retention and safe restore validation.
- [ ] Run the smoke test and TypeScript validation.

### Task 2: Wire backup lifecycle into the existing app

**Files:**
- Modify: existing database/storage integration point and application startup.

**Interfaces:**
- Trigger backup check after a successful application data load/start, creating the current month's snapshot when absent.

- [ ] Locate the existing storage write/read boundary.
- [ ] Call the backup service without blocking normal application startup.
- [ ] Ensure a backup failure never prevents the app from opening.
- [ ] Verify that user-created data is included in the snapshot.

### Task 3: Backup/restore UI

**Files:**
- Modify: existing settings/system screen selected from current project structure.

- [ ] Add monthly backup status and last backup date.
- [ ] Add list of available months and restore action with confirmation.
- [ ] Add export/import controls for off-device copies.
- [ ] Verify Arabic RTL labels and empty state.

### Task 4: Verification and build

- [ ] Run all relevant smoke tests.
- [ ] Run `npm run lint` and `npm run build`.
- [ ] Push to `main`.
- [ ] Wait for CI and Android workflow success for the new commit.
- [ ] Download the newly built APK artifact and provide it to the user only after verifying the artifact belongs to the new commit.
