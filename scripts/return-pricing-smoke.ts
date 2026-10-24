import { calculateHistoricalReturnPricing } from '../src/services/returnPricing';
import { DatabaseSchema } from '../src/types';

const db: DatabaseSchema = {
  version: 2,
  areas: [],
  customers: [],
  customerSales: [],
  customerPayments: [],
  supplyRequests: [],
  distributors: [{ id: 'd1', name: 'اختبار', phone: '', address: '', debtLimitYER: 0, commissionType: 'PER_PIECE', commissionValue: 0, openingDebtYER: 0, active: true, createdAt: 1 }],
  products: [{ id: 'p1', name: 'صنف اختبار', category: 'اختبار', unit: 'حبة', factoryPriceYER: 0, distributorPriceYER: 9999, stockQty: 0, minimumQty: 0, active: true, createdAt: 1 }],
  rawMaterials: [],
  suppliers: [],
  recipes: [],
  purchases: [],
  supplierPayments: [],
  productionBatches: [],
  expenses: [],
  collections: [],
  returns: [{
    id: 'ret1', displayNumber: 'RET-1', distributorId: 'd1', distributorName: 'اختبار', date: '2026-10-22', createdAt: 30,
    items: [{ productId: 'p1', productName: 'صنف اختبار', quantity: 5, unitPriceYER: 100, totalYER: 500, restock: false }],
    totalValueYER: 500, settlementType: 'REDUCE_DEBT', reason: 'اختبار'
  }],
  distributions: [
    {
      id: 'dst1', displayNumber: 'DST-1', distributorId: 'd1', distributorName: 'اختبار', date: '2026-10-20', createdAt: 10,
      items: [{ productId: 'p1', productName: 'صنف اختبار', unit: 'حبة', quantity: 10, unitPriceYER: 100, commissionTypeSnapshot: 'PER_PIECE', commissionValueSnapshot: 0, commissionYER: 0, totalYER: 1000 }],
      grossYER: 1000, cashPaidYER: 0, creditYER: 1000, totalCommissionYER: 0
    },
    {
      id: 'dst2', displayNumber: 'DST-2', distributorId: 'd1', distributorName: 'اختبار', date: '2026-10-21', createdAt: 20,
      items: [{ productId: 'p1', productName: 'صنف اختبار', unit: 'حبة', quantity: 10, unitPriceYER: 200, commissionTypeSnapshot: 'PER_PIECE', commissionValueSnapshot: 0, commissionYER: 0, totalYER: 2000 }],
      grossYER: 2000, cashPaidYER: 0, creditYER: 2000, totalCommissionYER: 0
    }
  ]
};

// FIFO: the first 5 returned units consume the already-returned quantity from the first lot,
// leaving 5 units at 100 and taking 2 units from the second lot at 200.
// Expected weighted price = (5*100 + 2*200) / 7 = 128.571...
const result = calculateHistoricalReturnPricing(db, 'd1', [{ productId: 'p1', quantity: 7 }]);
if (!result.valid || result.items?.[0]?.unitPriceYER !== 900 / 7 || result.totalValueYER !== 900) {
  throw new Error(`Historical return pricing smoke test failed: ${JSON.stringify(result)}`);
}

console.log('Historical return pricing smoke test passed.');
