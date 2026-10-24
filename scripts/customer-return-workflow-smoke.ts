import { storage } from '../src/services/storage';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

storage.resetToDefault();
const db = storage.getDatabase();
const distributor = db.distributors.find(x => x.active);
const product = db.products.find(x => x.active);
assert(distributor, 'Seed data must include an active distributor');
assert(product, 'Seed data must include an active product');

const invalidOpeningDebt = storage.saveCustomer({
  name: 'بقالة بدين افتتاحي سالب', governorate: 'البيضاء', district: 'مدينة البيضاء', locality: 'عزة',
  address: 'اختبار', assignedDistributorId: distributor.id, openingDebtYER: -1, active: true
});
assert(!invalidOpeningDebt.success, 'Negative opening debt must be rejected');

const saved = storage.saveCustomer({
  name: 'بقالة اختبار المرتجعات',
  governorate: 'البيضاء',
  district: 'مدينة البيضاء',
  locality: 'عزة',
  address: 'اختبار',
  assignedDistributorId: distributor.id,
  openingDebtYER: 0,
  active: true
});
assert(saved.success && saved.customer, 'Customer creation should succeed');
const customer = saved.customer;

const saleResult = storage.createCustomerSale({
  customerId: customer.id,
  distributorId: distributor.id,
  date: '2026-10-19',
  items: [{ productId: product.id, quantity: 5, unitPriceYER: 123 }],
  paidYER: 0
});
assert(saleResult.success && saleResult.sale, 'Sale creation should succeed');
const sale = saleResult.sale;
const originalStock = product.stockQty;
product.distributorPriceYER = 9999;

const exchange = storage.createCustomerReturn({
  customerId: customer.id,
  distributorId: distributor.id,
  date: '2026-10-20',
  saleId: sale.id,
  items: [{ productId: product.id, quantity: 2, disposition: 'EXCHANGE' }],
  reason: 'اختبار استبدال'
});
assert(exchange.success && exchange.customerReturn, 'Exchange request should be created');
assert(exchange.customerReturn.items[0].unitPriceYER === 123, 'Return must use original invoice price, not current price');
assert(exchange.customerReturn.creditYER === 0, 'Exchange must not also reduce customer debt');
assert(storage.reviewCustomerReturn(exchange.customerReturn.id, 'APPROVED').success, 'Exchange approval should succeed');
assert(storage.getCustomerBalance(customer.id) === sale.creditYER, 'Approved exchange must not reduce debt');
assert(product.stockQty === originalStock, 'Shop returns must not silently increase factory stock');

const overReturn = storage.createCustomerReturn({
  customerId: customer.id,
  distributorId: distributor.id,
  date: '2026-10-20',
  saleId: sale.id,
  items: [{ productId: product.id, quantity: 4, disposition: 'RETURNED' }],
  reason: 'كمية أكبر من المتبقي'
});
assert(!overReturn.success, 'Return quantity exceeding the original invoice remainder must be rejected');

const damaged = storage.createCustomerReturn({
  customerId: customer.id,
  distributorId: distributor.id,
  date: '2026-10-21',
  saleId: sale.id,
  items: [{ productId: product.id, quantity: 1, disposition: 'DAMAGED' }],
  reason: 'تالف'
});
assert(damaged.success && damaged.customerReturn, 'Valid damaged return should be created');
assert(storage.reviewCustomerReturn(damaged.customerReturn.id, 'APPROVED').success, 'Damaged return approval should succeed');
assert(storage.getCustomerBalance(customer.id) === sale.creditYER - 123, 'Approved damaged goods should credit the customer at original sale price');
assert(product.stockQty === originalStock, 'Damaged goods must not increase factory stock');

const payment = storage.createCustomerPayment({
  customerId: customer.id, distributorId: distributor.id, date: '2026-10-22',
  amountYER: 200, method: 'CASH'
});
assert(payment.success && payment.payment, 'Partial customer payment should be recorded');
assert(payment.payment.allocations?.some(a => a.saleId === sale.id && a.amountYER === 200), 'Payment should allocate to the oldest unpaid invoice');
assert(storage.getCustomerSaleBalance(sale.id) === sale.creditYER - 123 - 200, 'Invoice balance should reflect approved return and partial payment');
assert(storage.getCustomerBalance(customer.id) === sale.creditYER - 123 - 200, 'Customer ledger should match invoice ledger');

const close = storage.closeCustomerWeek('2026-10-19', 'اختبار');
assert(close.success && close.close, 'Weekly close should be created');
const snapshot = close.close.customerBalances.find(x => x.customerId === customer.id);
assert(snapshot, 'Weekly close should include the customer');
assert(snapshot.closingYER === storage.getCustomerBalance(customer.id), 'Weekly close balance must match the live customer ledger, including exchange neutrality');
assert(!storage.closeCustomerWeek('2026-10-19', 'اختبار').success, 'The same week must not be closed twice');
assert(!storage.closeCustomerWeek('2026-10-20', 'اختبار').success, 'Weekly close must reject a start date that is not Monday');

console.log('Customer return and weekly close workflow validation passed.');
