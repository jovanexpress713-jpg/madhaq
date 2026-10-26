(() => {
  const DB_KEY = 'madhaq_factory_db_v1';
  const MARKER_KEY = 'madhaq_clean_production_start_v1';

  const emptyDatabase = () => ({
    version: 4,
    distributors: [],
    products: [],
    distributions: [],
    collections: [],
    returns: [],
    suppliers: [],
    rawMaterials: [],
    purchases: [],
    supplierPayments: [],
    recipes: [],
    productionBatches: [],
    expenses: [],
    areas: [],
    customers: [],
    customerSales: [],
    customerPayments: [],
    supplyRequests: [],
    customerReturns: [],
    customerWeeklyCloses: []
  });

  const isBundledDemoDatabase = (db) => {
    if (!db || typeof db !== 'object') return false;
    const ids = (key) => Array.isArray(db[key]) ? db[key].map((item) => item && item.id).filter(Boolean) : [];
    const has = (key, id) => ids(key).includes(id);

    return has('distributors', 'dist-1') &&
      has('products', 'prod-1') &&
      has('suppliers', 'supp-1') &&
      has('distributions', 'dst-1001') &&
      has('collections', 'rec-1001') &&
      has('returns', 'ret-1001') &&
      has('purchases', 'pur-1001') &&
      has('supplierPayments', 'pay-1001') &&
      has('productionBatches', 'batch-1001') &&
      has('expenses', 'exp-1001');
  };

  try {
    if (localStorage.getItem(MARKER_KEY) === '1') return;

    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(emptyDatabase()));
      localStorage.setItem(MARKER_KEY, '1');
      return;
    }

    let db;
    try {
      db = JSON.parse(raw);
    } catch {
      db = null;
    }

    if (isBundledDemoDatabase(db)) {
      localStorage.setItem(DB_KEY, JSON.stringify(emptyDatabase()));
    }

    localStorage.setItem(MARKER_KEY, '1');
  } catch (error) {
    console.warn('MADHAQ clean-production bootstrap skipped:', error);
  }
})();
