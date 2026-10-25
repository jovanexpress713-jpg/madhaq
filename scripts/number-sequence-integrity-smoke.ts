import assert from 'node:assert/strict';

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)); },
    removeItem: (key: string) => { memory.delete(key); },
    clear: () => memory.clear(),
  },
});

const { storage } = await import('../src/services/storage');
storage.resetToDefault();

const db = storage.getDatabase();
const distributor = db.distributors.find(item => item.active);
const product = db.products.find(item => item.active);
assert(distributor, 'Seed data must include an active distributor');
assert(product, 'Seed data must include an active product');

db.distributions = [];
db.collections = [];
db.returns = [];
db.purchases = [];
db.supplierPayments = [];
db.productionBatches = [];
db.expenses = [];
distributor.openingDebtYER = 0;

const first = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-25',
  items: [{ productId: product.id, quantity: 1, unitPriceYER: 100 }],
  cashPaidYER: 100,
});
assert.equal(first.success, true);

// Simulate deletion of the latest record from an admin cleanup/import workflow.
db.distributions = [];
product.stockQty += 1;

const second = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-25',
  items: [{ productId: product.id, quantity: 1, unitPriceYER: 100 }],
  cashPaidYER: 100,
});
assert.equal(second.success, true);
assert.notEqual(second.distribution?.displayNumber, first.distribution?.displayNumber, 'Invoice numbers must remain unique after deletion');

console.log('Number sequence integrity validation passed.');
