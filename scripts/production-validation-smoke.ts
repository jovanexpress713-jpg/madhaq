import { validateProductionBatch } from '../src/services/productionValidation';
import type { DatabaseSchema } from '../src/types';

const db = {
  version: 2,
  areas: [],
  customers: [],
  customerSales: [],
  customerPayments: [],
  supplyRequests: [],
  customerReturns: [],
  customerWeeklyCloses: [],
  distributors: [],
  products: [{ id: 'p1', name: 'منتج', category: 'حلويات', unit: 'حبة', factoryPriceYER: 100, distributorPriceYER: 150, stockQty: 0, minimumQty: 1, active: true, createdAt: 1 }],
  rawMaterials: [{ id: 'r1', name: 'خام', unit: 'كيلو', stockQty: 10, minimumQty: 1, averageCostPerUnitYER: 100, active: true, createdAt: 1 }],
  suppliers: [],
  recipes: [{ id: 'rec1', productId: 'p1', productName: 'منتج', name: 'وصفة', outputQty: 10, items: [{ rawMaterialId: 'r1', rawMaterialName: 'خام', quantity: 2, unit: 'كيلو' }], active: true, notes: '', createdAt: 1 }],
  distributions: [],
  collections: [],
  returns: [],
  purchases: [],
  supplierPayments: [],
  productionBatches: [],
  expenses: []
} as DatabaseSchema;

const ok = validateProductionBatch(db, {
  recipeId: 'rec1',
  multiplier: 1,
  producedQty: 9,
  damagedQty: 1
});

const rejectsOverflow = validateProductionBatch(db, {
  recipeId: 'rec1',
  multiplier: 1,
  producedQty: 10,
  damagedQty: 1
});

const rejectsShortStock = validateProductionBatch(db, {
  recipeId: 'rec1',
  multiplier: 6,
  producedQty: 1,
  damagedQty: 0
});

// نفس المادة مرتين في الوصفة يجب أن تُجمع قبل فحص الرصيد.
const duplicateRawDb = {
  ...db,
  recipes: [{
    ...db.recipes[0],
    items: [
      { rawMaterialId: 'r1', rawMaterialName: 'خام', quantity: 6, unit: 'كيلو' },
      { rawMaterialId: 'r1', rawMaterialName: 'خام', quantity: 6, unit: 'كيلو' }
    ]
  }]
} as DatabaseSchema;

const rejectsDuplicateConsumption = validateProductionBatch(duplicateRawDb, {
  recipeId: 'rec1',
  multiplier: 1,
  producedQty: 10,
  damagedQty: 0
});

if (
  !ok.valid ||
  rejectsOverflow.valid ||
  rejectsShortStock.valid ||
  rejectsDuplicateConsumption.valid
) {
  throw new Error('Production validation smoke test failed.');
}

console.log('Production validation smoke test passed.');
