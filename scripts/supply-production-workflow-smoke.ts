import { storage } from '../src/services/storage';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

storage.resetToDefault();
const db = storage.getDatabase();
const distributor = db.distributors.find(x => x.active);
const product = db.products.find(x => x.active);
assert(distributor && product, 'Seed data must include an active distributor and product');

const raw = storage.saveRawMaterial({
  name: 'خام اختبار طلب إنتاج',
  unit: 'كيلو',
  stockQty: 100,
  minimumQty: 1,
  averageCostPerUnitYER: 20,
  active: true
});
const recipe = storage.saveRecipe({
  productId: product.id,
  productName: product.name,
  name: 'وصفة اختبار طلب موزع',
  outputQty: 10,
  items: [{ rawMaterialId: raw.id, rawMaterialName: raw.name, quantity: 1, unit: raw.unit }],
  active: true,
  notes: 'اختبار تكامل طلب الإنتاج'
});

const requestResult = storage.createSupplyRequest({
  distributorId: distributor.id,
  governorate: 'البيضاء',
  district: 'مدينة البيضاء',
  locality: 'عزة',
  requestedDate: '2026-10-24',
  items: [{ productId: product.id, quantity: 8 }],
  note: 'اختبار تحويل الطلب إلى الإنتاج'
});
assert(requestResult.success && requestResult.request, 'Distributor supply request should be created');
const request = requestResult.request;
assert(storage.updateSupplyRequestStatus(request.id, 'APPROVED').success, 'Manager should approve the request');
assert(storage.updateSupplyRequestStatus(request.id, 'IN_PRODUCTION').success, 'Manager should send approved request to production');

const stockBefore = product.stockQty;
const rawBefore = raw.stockQty;
const batchResult = storage.executeProductionBatch({
  recipeId: recipe.id,
  date: '2026-10-24',
  multiplier: 1,
  producedQty: 8,
  damagedQty: 0,
  supplyRequestId: request.id,
  note: 'دفعة مرتبطة بطلب اختبار'
});
assert(batchResult.success && batchResult.batch, 'Linked production batch should succeed');
assert(batchResult.batch.supplyRequestId === request.id, 'Production batch must reference its supply request');
assert(raw.stockQty === rawBefore - 1, 'Production should deduct recipe materials');
assert(product.stockQty === stockBefore + 8, 'Production should add actual good output to finished stock');
const refreshed = storage.getSupplyRequests().find(r => r.id === request.id);
assert(refreshed?.status === 'READY', 'Request should become ready when every requested product quantity is produced');
assert(refreshed.items[0].producedQty === 8, 'Request item should store actual produced quantity');
assert(refreshed.items[0].batchIds?.includes(batchResult.batch.id), 'Request item should link the production batch');

const duplicate = storage.executeProductionBatch({
  recipeId: recipe.id, date: '2026-10-24', multiplier: 1, producedQty: 8, damagedQty: 0,
  supplyRequestId: request.id, note: 'محاولة تكرار غير مسموحة'
});
assert(!duplicate.success, 'A completed request must not be produced twice through its request link');

console.log('Distributor supply request to production workflow validation passed.');
