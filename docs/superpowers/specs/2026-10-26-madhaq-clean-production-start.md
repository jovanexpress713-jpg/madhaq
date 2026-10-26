# MADHAQ Clean Production Start Design

**Goal:** Make a fresh MADHAQ installation start with zero fabricated business, customer, inventory, supplier, distributor, shop, or financial records while keeping every operational module ready for real entry.

## Decisions

- Fresh-install business data is empty: distributors, shop customers, areas, products, raw materials, suppliers, purchases, supplier payments, recipes, production batches, distributions, collections, returns, expenses, and weekly closes start empty/zero.
- No demo balances, debts, sales, purchases, stock quantities, commissions, or cash movements are seeded.
- The manager account remains separate from business data and is not affected by business-data initialization.
- The first-run flow becomes: branded splash → welcome → manager setup/login → **تهيئة المعمل** → operating system.
- Initial setup provides clear entry points for the factory profile, products, raw materials, suppliers, distributors, and shop customers. Empty lists are valid states and must show useful next actions rather than fake records.
- No supplier names or phone numbers are invented. A verified supplier directory may be added later only from trustworthy sources; unverified contacts must never be inserted as real suppliers.
- Existing user-created local data must not be erased automatically. A one-time migration only removes records that are positively identified as the bundled demo dataset.

## Clean Data Contract

The clean database must have zero records in all transactional collections and zero opening balances. Stock and financial totals must calculate to zero. Master-data screens must show empty-state guidance.

## Acceptance Criteria

1. Fresh installation contains no demo distributor/shop/supplier/customer names.
2. Fresh installation contains no demo financial transactions or opening balances.
3. Fresh installation contains no demo stock quantities or prices.
4. Manager authentication still works independently.
5. Real records entered by the user persist across restart.
6. Dashboard totals are zero until the user records real operations.
7. Empty modules provide clear buttons/instructions to add the user's real data.
8. No supplier phone number is fabricated or presented as verified.
9. TypeScript, production validations, and web build pass.
10. Android APK build succeeds after the change.
