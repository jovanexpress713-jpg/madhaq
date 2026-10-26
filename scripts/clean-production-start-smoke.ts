import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const script = readFileSync(join(process.cwd(), 'public/clean-production-start.js'), 'utf8');

function run(initialValue: string | null) {
  const store = new Map<string, string>();
  if (initialValue !== null) store.set('madhaq_factory_db_v1', initialValue);
  const sandbox = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    },
    console,
  };
  vm.runInNewContext(script, sandbox);
  return JSON.parse(store.get('madhaq_factory_db_v1') ?? '{}');
}

const fresh = run(null);
for (const key of [
  'distributors', 'products', 'distributions', 'collections', 'returns',
  'suppliers', 'rawMaterials', 'purchases', 'supplierPayments', 'recipes',
  'productionBatches', 'expenses', 'areas', 'customers', 'customerSales',
  'customerPayments', 'supplyRequests', 'customerReturns', 'customerWeeklyCloses'
]) {
  if (!Array.isArray(fresh[key]) || fresh[key].length !== 0) {
    throw new Error(`Expected clean ${key}`);
  }
}

if (fresh.version !== 4) throw new Error(`Expected clean database version 4, got ${fresh.version}`);

const demo = JSON.stringify({
  version: 3,
  distributors: [{ id: 'dist-1', name: 'موزع صنعاء - الأخ عصام الشرعبي', openingDebtYER: 45000 }],
  products: [{ id: 'prod-1', name: 'بسبوسة ملكية بالقشطة والمكسرات', stockQty: 85 }],
  suppliers: [{ id: 'supp-1', name: 'شركة البركة لتجارة الدقيق والمواد الغذائية', openingBalanceYER: 120000 }],
  distributions: [{ id: 'dst-1001', distributorId: 'dist-1', grossYER: 77000 }],
});

const migrated = run(demo);
if (migrated.distributors.length !== 0 || migrated.suppliers.length !== 0 || migrated.distributions.length !== 0) {
  throw new Error('Bundled demo records were not cleared');
}

console.log('clean-production-start smoke passed');
