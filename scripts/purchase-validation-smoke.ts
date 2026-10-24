import { validatePurchase } from '../src/services/purchaseValidation';
import type { DatabaseSchema } from '../src/types';

const db = {
  version: 2,
  areas: [],
  customers: [],
  customerSales: [],
  customerPayments: [],
  supplyRequests: [],
  distributors: [],
  products: [],
  rawMaterials: [{ id: 'r1', name: 'خام', unit: 'كيلو', stockQty: 5, minimumQty: 1, averageCostPerUnitYER: 100, active: true, createdAt: 1 }],
  suppliers: [{ id: 's1', name: 'مورد', phone: '', address: '', openingBalanceYER: 0, active: true, createdAt: 1 }],
  recipes: [], distributions: [], collections: [], returns: [], purchases: [], supplierPayments: [], productionBatches: [], expenses: []
} as DatabaseSchema;

const valid = validatePurchase(db, {
  supplierId: 's1',
  items: [{ rawMaterialId: 'r1', quantity: 10, unitCostYER: 250 }],
  cashPaidYER: 1000
});

const rejectsNegativeQuantity = validatePurchase(db, {
  supplierId: 's1',
  items: [{ rawMaterialId: 'r1', quantity: -1, unitCostYER: 250 }],
  cashPaidYER: 0
});

const rejectsNegativeCost = validatePurchase(db, {
  supplierId: 's1',
  items: [{ rawMaterialId: 'r1', quantity: 1, unitCostYER: -250 }],
  cashPaidYER: 0
});

const rejectsInactiveSupplier = validatePurchase(db, {
  supplierId: 'missing',
  items: [{ rawMaterialId: 'r1', quantity: 1, unitCostYER: 250 }],
  cashPaidYER: 0
});

if (!valid.valid || rejectsNegativeQuantity.valid || rejectsNegativeCost.valid || rejectsInactiveSupplier.valid) {
  throw new Error('Purchase validation smoke test failed.');
}

console.log('Purchase validation smoke test passed.');
