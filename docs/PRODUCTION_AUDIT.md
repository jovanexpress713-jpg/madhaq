# MADHAQ — Production Audit & UX Roadmap

## Scope

This audit covers the current React/TypeScript/PWA application for the MADHAQ sweets factory. The goal is a reliable phone-first operational system, not a visual demo.

## Current architecture verified

- React + TypeScript + Vite application.
- RTL Arabic interface.
- Local/offline-first persistence through `localStorage`.
- Separate operational modules for dashboard, distributors, distribution invoices, collections, returns, products, raw materials, suppliers, purchases, production, expenses and the Thursday report.
- Backup/restore JSON workflow exists.
- Printing workflows exist for operational documents.
- Mobile navigation and PWA installation support exist.

## UX improvements applied

- Added accessible `:focus-visible` states for keyboard and switch/keyboard navigation.
- Added 44px minimum touch-target utility for compact controls.
- Added safe-area support for modern phones with gesture/navigation areas.
- Added reduced-motion support for users who request less animation.
- Improved mobile overscroll and touch behavior.
- Improved print page defaults.

## Reliability improvements applied

- Added GitHub Actions CI on `main` and pull requests.
- CI installs from the existing Bun lockfile, runs TypeScript checking, and performs a production build.
- The repository should not be considered production-ready until this CI workflow is green.

## Accounting/data checks that must remain invariant

1. A distribution may not consume more product stock than is available.
2. A distributor may not exceed the configured credit limit.
3. A distribution stores a commission snapshot so later commission-setting changes do not rewrite history.
4. Distributor debt is calculated from opening debt + credit distributions - collections - debt-reducing returns.
5. Supplier balances and distributor balances must remain separate.
6. Historical transactions must never be recalculated from today's prices.
7. Returns marked as cash refunds must not silently reduce distributor debt.
8. Destructive data reset must remain an explicit, confirmed operation.
9. Backup/restore must be treated as a critical business operation and tested before deployment.

## UX target state

### Daily command center

The first screen should answer, within a few seconds:

- How much cash is currently available?
- How much is owed by distributors?
- How much is owed to suppliers?
- What was distributed today?
- What was collected today?
- What was spent today?
- What needs immediate attention?

### Distributor account

Each distributor should have one clear financial timeline containing:

- opening balance
- distributions
- cash payments
- credit
- collections
- returns
- commission
- closing balance
- debt-limit status

### Fast operations

The most frequent actions should remain one-tap accessible on phones:

- new distribution
- new collection
- new production batch
- new purchase
- new expense
- Thursday report

### Data safety

The application is intentionally offline-first, but browser/localStorage data is device/browser scoped. Users must therefore be encouraged to create regular JSON backups. A future production version should consider IndexedDB for larger datasets and a second encrypted backup destination if cloud sync is introduced.

## Remaining production gate

Before calling the system fully complete, run the new CI workflow and manually test these scenarios on a real phone:

1. Create distributor → distribution → collection → return.
2. Verify distributor ledger after each operation.
3. Verify product stock after distribution and return.
4. Create raw-material purchase → production batch → finished-product stock.
5. Verify supplier balance after purchase and payment.
6. Verify expenses change cashbox correctly.
7. Verify Thursday report against the underlying ledger.
8. Export backup → clear/reload app → restore backup → compare totals.
9. Print an invoice, receipt and distributor ledger.
10. Test at 320px-wide mobile viewport and a desktop viewport.
11. Test offline after the application has been installed as a PWA.
12. Confirm CI typecheck and production build are green.

## Important distinction

The repository is structurally substantial and operationally advanced, but “complete” must mean verified behavior, not simply having all screens. The CI workflow and manual business-flow checklist above are the final production gate.
