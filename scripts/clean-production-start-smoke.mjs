import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as vm from 'node:vm';

const script = readFileSync(join(process.cwd(), 'public/clean-production-start.js'), 'utf8');

function run(initialValue = null) {
  const store = new Map();
  if (initialValue !== null) store.set('madhaq_factory_db_v1', initialValue);
  const sandbox = {
    localStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
    },
    console,
  };
  vm.runInNewContext(script, sandbox);
  return JSON.parse(store.get('madhaq_factory_db_v1') ?? '{}');
}

const collections = [
  'distributors', 'products', 'distributions', 'collections', 'returns',
  'suppliers', 'rawMaterials', 'purchases', 'supplierPayments', 'recipes',
  'productionBatches', 'expenses', 'areas', 'customers', 'customerSales',
  'customerPayments', 'supplyRequests', 'customerReturns', 'customerWeeklyCloses'
];

const fresh = run();
for (const key of collections) {
  if (!Array.isArray(fresh[key]) || fresh[key].length !== 0) throw new Error(`Expected clean ${key}`);
}
if (fresh.version !== 4) throw new Error(`Expected clean database version 4, got ${fresh.version}`);

const demo = JSON.stringify({
  version: 3,
  distributors: [{ id: 'dist-1' }],
  products: [{ id: 'prod-1' }],
  suppliers: [{ id: 'supp-1' }],
  distributions: [{ id: 'dst-1001' }],
  collections: [{ id: 'rec-1001' }],
  returns: [{ id: 'ret-1001' }],
  purchases: [{ id: 'pur-1001' }],
  supplierPayments: [{ id: 'pay-1001' }],
  productionBatches: [{ id: 'batch-1001' }],
  expenses: [{ id: 'exp-1001' }],
});

const migrated = run(demo);
for (const key of collections) {
  if (!Array.isArray(migrated[key]) || migrated[key].length !== 0) throw new Error(`Demo was not cleared from ${key}`);
}

console.log('clean-production-start smoke passed');
