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

const originalStock = product.stockQty;
const originalDistributionCount = db.distributions.length;

const negativeQuantity = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: -1, unitPriceYER: 100 }],
  cashPaidYER: 0,
});
assert.equal(negativeQuantity.success, false, 'Negative distribution quantity must be rejected');
assert.equal(product.stockQty, originalStock, 'Rejected distribution must not change stock');
assert.equal(db.distributions.length, originalDistributionCount, 'Rejected distribution must not create an invoice');

const duplicateOversellQty = Math.ceil(originalStock / 2);
const duplicateOversell = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [
    { productId: product.id, quantity: duplicateOversellQty, unitPriceYER: 100 },
    { productId: product.id, quantity: duplicateOversellQty, unitPriceYER: 100 },
  ],
  cashPaidYER: 0,
});
assert.equal(duplicateOversell.success, false, 'Duplicate invoice rows must be aggregated before stock validation');
assert.equal(product.stockQty, originalStock, 'Rejected duplicate-row invoice must not change stock');

const invalidPrice = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 1, unitPriceYER: -10 }],
  cashPaidYER: 0,
});
assert.equal(invalidPrice.success, false, 'Negative unit price must be rejected');

const overpayment = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 1, unitPriceYER: 100 }],
  cashPaidYER: 101,
});
assert.equal(overpayment.success, false, 'Cash payment above invoice total must be rejected');

const validDistribution = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 3, unitPriceYER: 100 }],
  cashPaidYER: 0,
});
assert.equal(validDistribution.success, true, 'Valid distribution should succeed');
assert.equal(product.stockQty, originalStock - 3, 'Valid distribution must deduct exactly the delivered quantity');

product.distributorPriceYER = 9999;
const validReturn = storage.createReturn({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 1, restock: false }],
  settlementType: 'REDUCE_DEBT',
  reason: 'اختبار السعر التاريخي',
});
assert.equal(validReturn.success, true, 'A return for previously distributed stock should succeed');
assert.equal(validReturn.returnEntry?.items[0].unitPriceYER, 100, 'Return must use historical invoice price, not today\'s price');
assert.equal(validReturn.returnEntry?.totalValueYER, 100, 'Saved return total must match the historical price shown in the UI');

const returnsBeforeOverReturn = db.returns.length;
const overReturn = storage.createReturn({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 3, restock: false }],
  settlementType: 'REDUCE_DEBT',
  reason: 'اختبار كمية مرتجع زائدة',
});
assert.equal(overReturn.success, false, 'Returns exceeding historical unreturned quantities must be rejected');
assert.equal(db.returns.length, returnsBeforeOverReturn, 'Rejected over-return must not create a return record');

const unknownProductReturn = storage.createReturn({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: 'missing-product', quantity: 1, restock: false }],
  settlementType: 'REDUCE_DEBT',
  reason: 'اختبار صنف غير موجود',
});
assert.equal(unknownProductReturn.success, false, 'Unknown product returns must be rejected');

console.log('Distribution and return workflow validation passed: quantity, price, stock, overpayment, historical return pricing and over-return guards.');
