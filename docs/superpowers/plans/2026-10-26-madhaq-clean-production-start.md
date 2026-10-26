# MADHAQ Clean Production Start Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove bundled demo business data from fresh MADHAQ installations and provide a clean, real-data-first startup experience.

**Architecture:** Keep local authentication independent. Add a deterministic clean-data bootstrap/migration at the storage boundary so fresh installs and known demo installs resolve to an empty operational database. Preserve the existing CRUD screens and make empty states actionable rather than seeding fake records.

**Tech Stack:** React 19, TypeScript, Vite, localStorage, existing MADHAQ storage service, Bun/tsx validation, Capacitor Android build.

**Spec:** `docs/superpowers/specs/2026-10-26-madhaq-clean-production-start.md`

## Global Constraints

- No fabricated supplier names, phone numbers, distributors, shops, customers, prices, balances, stock, or transactions.
- Authentication remains separate from business data.
- User-created records must survive restart.
- Empty collections are valid production states.
- Existing operational modules and calculations remain available.

## Review Focus

- Fresh local storage: must contain zero demo business records.
- Existing demo installation: bundled demo records must be removed once, without touching manager authentication.
- Real records after initialization: must persist and not be mistaken for demo data.
- Empty dashboard/module states: must not show misleading financial values.
- Supplier directory: no invented contacts may enter the application.

### Task 1: Clean bootstrap contract

**Files:**
- Create: `src/services/cleanProductionStart.ts`
- Test: `scripts/clean-production-start-smoke.ts`

**Interfaces:**
- Produces a deterministic `createCleanProductionDatabase()` function and `isBundledDemoDatabase()` predicate for the storage boundary.

- [ ] **Step 1:** Write the smoke test proving a clean database has empty business collections and zero financial/stock totals.
- [ ] **Step 2:** Run the smoke test and confirm it fails before implementation.
- [ ] **Step 3:** Implement the clean database factory and positive demo-dataset detector.
- [ ] **Step 4:** Run the smoke test and confirm it passes.

### Task 2: Storage migration

**Files:**
- Modify: `src/services/storage.ts`
- Test: `scripts/clean-production-start-smoke.ts`

**Interfaces:**
- Storage initialization must use the clean factory for fresh installs and replace only positively identified bundled demo data.

- [ ] **Step 1:** Add a one-time migration marker/version for the clean-production transition.
- [ ] **Step 2:** Write the migration assertion for the known demo identifiers and balances.
- [ ] **Step 3:** Implement the migration at the storage boundary.
- [ ] **Step 4:** Verify that non-demo records remain untouched.

### Task 3: Empty-state readiness

**Files:**
- Modify only the affected master-data views after inspection.
- Test: existing validation scripts plus targeted smoke checks where needed.

**Interfaces:**
- Empty distributors, shops, suppliers, products, and raw-material lists show clear add actions.

- [ ] **Step 1:** Inspect current empty-state behavior.
- [ ] **Step 2:** Add only missing actionable empty states.
- [ ] **Step 3:** Run TypeScript validation.

### Task 4: Supplier directory policy

**Files:**
- Create: `docs/SUPPLIER_DIRECTORY_POLICY.md`

**Interfaces:**
- Documents that supplier contacts are user-entered or externally verified; no generated phone numbers are permitted.

- [ ] **Step 1:** Document the rule.
- [ ] **Step 2:** Confirm no fabricated supplier contacts are added by this change.

### Task 5: Full verification and Android artifact

**Files:**
- No additional source changes unless verification exposes a defect.

- [ ] **Step 1:** Run `bun run lint`.
- [ ] **Step 2:** Run all production/business validation scripts.
- [ ] **Step 3:** Run `bun run build`.
- [ ] **Step 4:** Trigger/verify Android APK workflow.
- [ ] **Step 5:** Verify APK artifact exists and is based on the final commit.
