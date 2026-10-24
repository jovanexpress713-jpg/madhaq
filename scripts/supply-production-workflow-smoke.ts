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

const stockRequestResult = storage.createSupplyRequest({
  distributorId: distributor.id, governorate: 'البيضاء', district: 'مدينة البيضاء', locality: 'عزة',
  requestedDate: '2026-10-24', items: [{ productId: product.id, quantity: 3 }], note: 'اختبار صرف مخزون جاهز'
});
assert(stockRequestResult.success && stockRequestResult.request, 'Stock fulfillment request should be created');
assert(storage.updateSupplyRequestStatus(stockRequestResult.request.id, 'APPROVED').success, 'Stock request should be approved');
const finishedStockBefore = product.stockQty;
assert(storage.fulfillSupplyRequestFromStock(stockRequestResult.request.id).success, 'Approved request should be fulfilled from available finished stock');
assert(product.stockQty === finishedStockBefore - 3, 'Stock fulfillment must deduct finished goods');
const stockFulfilled = storage.getSupplyRequests().find(r => r.id === stockRequestResult.request?.id);
assert(stockFulfilled?.status === 'READY' && stockFulfilled.fulfillmentSource === 'STOCK', 'Stock fulfillment should mark request ready with source');
assert(stockFulfilled.items[0].fulfilledQty === 3, 'Stock fulfillment should record fulfilled quantity');

const insufficientResult = storage.createSupplyRequest({
  distributorId: distributor.id, governorate: 'البيضاء', district: 'مدينة البيضاء', locality: 'عزة',
  requestedDate: '2026-10-24', items: [{ productId: product.id, quantity: 999999 }], note: 'اختبار منع المخزون السالب'
});
assert(insufficientResult.success && insufficientResult.request, 'Insufficient-stock test request should be created');
assert(storage.updateSupplyRequestStatus(insufficientResult.request.id, 'APPROVED').success, 'Insufficient-stock test request should be approved');
const beforeInsufficient = product.stockQty;
const failedStockFulfillment = storage.fulfillSupplyRequestFromStock(insufficientResult.request.id);
assert(!failedStockFulfillment.success, 'System must reject fulfillment when finished stock is insufficient');
assert(product.stockQty === beforeInsufficient, 'Failed stock fulfillment must not mutate inventory');
assert(storage.getSupplyRequests().find(r => r.id === insufficientResult.request?.id)?.status === 'APPROVED', 'Failed stock fulfillment must leave the request awaiting action');

storage.resetToDefault();
const duplicateDb = storage.getDatabase();
const duplicateProduct = duplicateDb.products.find(x => x.active);
assert(duplicateProduct, 'Seed data must include a product for duplicate-material test');
const duplicateRaw = storage.saveRawMaterial({
  name: 'خام مكرر اختبار',
  unit: 'كيلو',
  stockQty: 10,
  minimumQty: 1,
  averageCostPerUnitYER: 15,
  active: true
});
const duplicateRecipe = storage.saveRecipe({
  productId: duplicateProduct.id,
  productName: duplicateProduct.name,
  name: 'وصفة تكرر نفس الخام',
  outputQty: 10,
  items: [
    { rawMaterialId: duplicateRaw.id, rawMaterialName: duplicateRaw.name, quantity: 6, unit: duplicateRaw.unit },
    { rawMaterialId: duplicateRaw.id, rawMaterialName: duplicateRaw.name, quantity: 6, unit: duplicateRaw.unit }
  ],
  active: true,
  notes: 'اختبار تجميع احتياج الخام المكرر'
});
const duplicateStockBefore = duplicateProduct.stockQty;
const duplicateRawBefore = duplicateRaw.stockQty;
const rejectedBatch = storage.executeProductionBatch({
  recipeId: duplicateRecipe.id, date: '2026-10-24', multiplier: 1, producedQty: 10, damagedQty: 0
});
assert(!rejectedBatch.success, 'Production must reject aggregate raw demand above available stock');
assert(duplicateRaw.stockQty === duplicateRawBefore, 'Rejected production must not deduct any raw material');
assert(duplicateProduct.stockQty === duplicateStockBefore, 'Rejected production must not add finished goods');

console.log('Distributor supply request, production, stock fulfillment and raw-material aggregation validation passed.');
