import { validateSupplierPayment } from '../src/services/supplierValidation';
import { DatabaseSchema } from '../src/types';

const db = {
  version: 3,
  areas: [],
  customers: [],
  customerSales: [],
  customerPayments: [],
  supplyRequests: [],
  customerReturns: [],
  customerWeeklyCloses: [],
  settings: {},
  distributors: [],
  products: [],
  distributions: [],
  collections: [],
  returns: [],
  suppliers: [
    {
      id: 'supp-1',
      name: 'مورد تجريبي',
      phone: '',
      address: '',
      openingBalanceYER: 1000,
      active: true,
      createdAt: Date.now()
    }
  ],
  rawMaterials: [],
  purchases: [
    {
      id: 'pur-1',
      displayNumber: 'PUR-1',
      supplierId: 'supp-1',
      supplierName: 'مورد تجريبي',
      date: '2026-10-24',
      createdAt: Date.now(),
      items: [],
      totalYER: 3000,
      cashPaidYER: 1000,
      creditYER: 2000
    }
  ],
  supplierPayments: [],
  recipes: [],
  productionBatches: [],
  expenses: []
} as unknown as DatabaseSchema;

const ok = validateSupplierPayment(db, { supplierId: 'supp-1', amountYER: 2500 });
if (!ok.valid) throw new Error(`Expected valid payment: ${ok.error}`);

const over = validateSupplierPayment(db, { supplierId: 'supp-1', amountYER: 3001 });
if (over.valid) throw new Error('Expected overpayment to be rejected.');

const zero = validateSupplierPayment(db, { supplierId: 'supp-1', amountYER: 0 });
if (zero.valid) throw new Error('Expected zero payment to be rejected.');

console.log('Supplier payment validation smoke test passed.');
