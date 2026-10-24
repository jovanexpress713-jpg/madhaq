import assert from 'node:assert/strict';

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, String(value)),
    removeItem: (key: string) => memory.delete(key),
    clear: () => memory.clear(),
  },
});

const { storage } = await import('../src/services/storage');

function ok(condition: unknown, message: string): asserts condition {
  assert.ok(condition, message);
}

storage.resetToDefault();
const db = storage.getDatabase();
const distributor = db.distributors.find(x => x.active);
const product = db.products.find(x => x.active);
const supplier = db.suppliers.find(x => x.active);
const raw = db.rawMaterials.find(x => x.active);
ok(distributor && product && supplier && raw, 'Seed data must contain the core operational records');

// 1) الموزع: تحميل بضاعة + آجل + عمولة + تحصيل + مرتجع.
db.distributions = [];
db.collections = [];
db.returns = [];
distributor.openingDebtYER = 0;
const stockBefore = product.stockQty;
const distribution = storage.createDistribution({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 4, unitPriceYER: 1000 }],
  cashPaidYER: 1000,
  note: 'اختبار دورة الموزع الكاملة'
});
ok(distribution.success && distribution.distribution, 'Distributor should be able to issue a valid invoice');
ok(distribution.distribution.creditYER === 3000, 'Distributor credit must equal gross minus cash');
ok(distribution.distribution.totalCommissionYER > 0, 'Distributor commission must be recorded');
ok(product.stockQty === stockBefore - 4, 'Distribution must reduce finished stock');
ok(storage.getDistributorFinancials(distributor.id).currentDebt === 3000, 'Distributor debt must increase by credit only');

const collection = storage.createCollection({
  distributorId: distributor.id,
  amountYER: 1000,
  method: 'CASH',
  date: '2026-10-24',
  reference: 'TEST-REC'
});
ok(collection.success, 'Accountant should be able to record a cash collection');
ok(storage.getDistributorFinancials(distributor.id).currentDebt === 2000, 'Collection must reduce distributor debt');

const returnDebt = storage.createReturn({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 1, restock: false }],
  settlementType: 'REDUCE_DEBT',
  reason: 'اختبار مرتجع يخصم من الدين'
});
ok(returnDebt.success && returnDebt.returnEntry?.totalValueYER === 1000, 'Distributor return must use the historical invoice price');
ok(storage.getDistributorFinancials(distributor.id).currentDebt === 1000, 'Debt-reducing return must reduce distributor debt');

const cashBeforeRefund = storage.getCashboxSummary().netCashBalance;
const returnCash = storage.createReturn({
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 1, restock: false }],
  settlementType: 'CASH_REFUND',
  reason: 'اختبار مرتجع برد نقدي'
});
ok(returnCash.success, 'Accountant should be able to record a cash refund');
ok(storage.getCashboxSummary().netCashBalance === cashBeforeRefund - 1000, 'Cash refund must reduce the cashbox');

// 2) المورد والمحاسب: شراء خامات + سداد + رصيد المورد + الصندوق.
const rawBefore = raw.stockQty;
const supplierBalanceBefore = storage.getSupplierFinancials(supplier.id).currentBalance;
const purchase = storage.createPurchase({
  supplierId: supplier.id,
  date: '2026-10-24',
  items: [{ rawMaterialId: raw.id, quantity: 2, unitCostYER: 1000 }],
  cashPaidYER: 500,
  note: 'اختبار شراء خامات'
});
ok(purchase.success && purchase.purchase, 'Accountant should be able to record a purchase');
ok(purchase.purchase.totalYER === 2000 && purchase.purchase.creditYER === 1500, 'Purchase cash/credit split must be correct');
ok(raw.stockQty === rawBefore + 2, 'Purchase must increase raw-material stock');
ok(storage.getSupplierFinancials(supplier.id).currentBalance === supplierBalanceBefore + 1500, 'Supplier balance must increase only by credit');

const supplierPayment = storage.createSupplierPayment({
  supplierId: supplier.id,
  date: '2026-10-24',
  amountYER: 500,
  method: 'CASH',
  reference: 'TEST-PAY'
});
ok(supplierPayment.success, 'Accountant should be able to pay a supplier');
ok(storage.getSupplierFinancials(supplier.id).currentBalance === supplierBalanceBefore + 1000, 'Supplier payment must reduce supplier balance');

// 3) المعلم: وصفة + إنتاج + تكلفة + خصم الخام + إضافة المنتج + التالف.
const productionRaw = storage.saveRawMaterial({
  name: 'خام اختبار المعلم',
  unit: 'كيلو',
  stockQty: 20,
  minimumQty: 1,
  averageCostPerUnitYER: 50,
  active: true
});
const productionProduct = storage.saveProduct({
  name: 'منتج اختبار المعلم',
  category: 'اختبار',
  unit: 'حبة',
  factoryPriceYER: 100,
  distributorPriceYER: 150,
  stockQty: 0,
  minimumQty: 0,
  active: true
});
const recipe = storage.saveRecipe({
  productId: productionProduct.id,
  productName: productionProduct.name,
  name: 'وصفة اختبار المعلم',
  outputQty: 10,
  items: [{ rawMaterialId: productionRaw.id, rawMaterialName: productionRaw.name, quantity: 2, unit: productionRaw.unit }],
  active: true,
  notes: 'اختبار دورة الإنتاج'
});
const batch = storage.executeProductionBatch({
  recipeId: recipe.id,
  date: '2026-10-24',
  multiplier: 1,
  producedQty: 9,
  damagedQty: 1,
  note: 'دفعة اختبار المعلم'
});
ok(batch.success && batch.batch, 'Teacher/production operator should be able to execute a valid batch');
ok(productionRaw.stockQty === 18, 'Production must consume recipe raw material');
ok(productionProduct.stockQty === 9, 'Production must add only good output to finished stock');
ok(batch.batch.damagedQty === 1 && batch.batch.unitCostYER === Math.round(100 / 9), 'Production must preserve actual good output, waste and unit cost');

// 4) البقالة: مبيعات موزع + تحصيل جزئي + مرتجع معتمد + رصيد نهائي.
const customerResult = storage.saveCustomer({
  name: 'بقالة اختبار التشغيل الشامل',
  governorate: 'البيضاء',
  district: 'مدينة البيضاء',
  locality: 'عزة',
  address: 'اختبار',
  assignedDistributorId: distributor.id,
  openingDebtYER: 0,
  active: true
});
ok(customerResult.success && customerResult.customer, 'Manager should be able to create a shop customer');
const customer = customerResult.customer;
const sale = storage.createCustomerSale({
  customerId: customer.id,
  distributorId: distributor.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 2, unitPriceYER: 1000 }],
  paidYER: 500
});
ok(sale.success && sale.sale?.creditYER === 1500, 'Shop sale credit must be calculated correctly');
const customerPayment = storage.createCustomerPayment({
  customerId: customer.id,
  distributorId: distributor.id,
  date: '2026-10-24',
  amountYER: 500,
  method: 'CASH'
});
ok(customerPayment.success, 'Distributor should be able to collect from an assigned shop');
ok(storage.getCustomerBalance(customer.id) === 1000, 'Customer balance must match sale credit minus payment');
const customerReturn = storage.createCustomerReturn({
  customerId: customer.id,
  distributorId: distributor.id,
  saleId: sale.sale!.id,
  date: '2026-10-24',
  items: [{ productId: product.id, quantity: 1, disposition: 'DAMAGED' }],
  reason: 'اختبار تالف'
});
ok(customerReturn.success && storage.reviewCustomerReturn(customerReturn.customerReturn!.id, 'APPROVED').success, 'Customer return should be reviewable by the manager');
ok(storage.getCustomerBalance(customer.id) === 0, 'Approved customer return must reduce the remaining customer debt');

// 5) كشف الحساب والتقرير الأسبوعي والنسخ الاحتياطي.
const ledger = storage.getDistributorLedger(distributor.id);
ok(ledger.length >= 3, 'Distributor ledger must expose transaction history');
const thursdayRows = storage.getThursdayReport('2026-10-19', '2026-10-25');
const distributorThursday = thursdayRows.find(x => x.distributorId === distributor.id);
ok(distributorThursday && distributorThursday.closingDebtYER === storage.getDistributorFinancials(distributor.id).currentDebt, 'Thursday report closing debt must match the live distributor ledger');

const backup = storage.exportBackupJSON();
ok(backup.includes('distributors') && backup.includes('productionBatches') && backup.includes('customerReturns'), 'Backup must contain operational modules');
storage.resetToDefault();
ok(storage.importBackupJSON(backup).success, 'A valid backup must restore successfully');
ok(storage.getCustomers().some(c => c.id === customer.id), 'Restored backup must preserve customer data');
ok(storage.getProductionBatches().some(b => b.id === batch.batch.id), 'Restored backup must preserve production data');

console.log('MADHAQ role workflow smoke test passed: distributor, accountant, teacher/production, shop/customer, reports and backup.');
