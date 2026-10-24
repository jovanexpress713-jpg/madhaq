import { strict as assert } from 'node:assert';

const memory = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, String(value)); },
    removeItem: (key: string) => { memory.delete(key); },
    clear: () => memory.clear(),
  },
});

const database = {
  version: 1,
  distributors: [],
  products: [{ id: 'finished-1', name: 'بسكويت تجريبي', category: 'حلويات', unit: 'قطعة', factoryPriceYER: 0, distributorPriceYER: 50, stockQty: 5, minimumQty: 1, active: true, createdAt: 1 }],
  rawMaterials: [
    { id: 'sugar-1', name: 'سكر مخزون', unit: 'جرام', stockQty: 1000, minimumQty: 0, averageCostPerUnitYER: 2, active: true, createdAt: 1 },
    { id: 'flour-1', name: 'دقيق مخزون', unit: 'جرام', stockQty: 1000, minimumQty: 0, averageCostPerUnitYER: 3, active: true, createdAt: 1 },
  ],
  suppliers: [], purchases: [], supplierPayments: [], recipes: [], distributions: [], collections: [], returns: [], expenses: [], productionBatches: [],
};
memory.set('madhaq_factory_db_v1', JSON.stringify(database));
memory.set('madhaq_recipe_material_links_v1', JSON.stringify({
  'test-recipe::سكر': 'sugar-1',
  'test-recipe::دقيق': 'flour-1',
  'duplicate-recipe::سكر-أول': 'sugar-1',
  'duplicate-recipe::سكر-ثاني': 'sugar-1',
}));

const { planLibraryRecipe, produceLibraryRecipe } = await import('../src/services/recipeProduction');
const recipe = {
  id: 'test-recipe',
  name: 'وصفة اختبار التكامل',
  category: 'حلويات',
  baseYieldGrams: 100,
  ingredients: [{ name: 'سكر', grams: 20 }, { name: 'دقيق', grams: 30 }],
  laborCostYER: 0,
  packagingCostYER: 0,
  otherCostYER: 0,
  notes: 'وصفة اختبار للتكامل فقط',
};
const plan = planLibraryRecipe(recipe, 100);
assert.equal(plan.ready, true, 'linked, sufficiently stocked recipe should be ready');
assert.equal(plan.totalMaterialCostYER, 130, 'material cost must be calculated using stock-unit cost');

const duplicateRecipe = {
  ...recipe,
  id: 'duplicate-recipe',
  ingredients: [{ name: 'سكر-أول', grams: 600 }, { name: 'سكر-ثاني', grams: 600 }],
};
const duplicatePlan = planLibraryRecipe(duplicateRecipe, 100);
assert.equal(duplicatePlan.ready, false, 'duplicate lines linked to one material must aggregate demand before stock checks');
assert.equal(duplicatePlan.insufficient.length, 2, 'both lines should indicate the shared stock shortage');

const result = produceLibraryRecipe({
  recipe,
  batchGrams: 100,
  productId: 'finished-1',
  plannedQty: 10,
  producedQty: 8,
  damagedQty: 2,
});
assert.equal(result.producedQty, 8);
assert.equal(result.damagedQty, 2);

const saved = JSON.parse(memory.get('madhaq_factory_db_v1')!);
assert.equal(saved.rawMaterials.find((m: any) => m.id === 'sugar-1').stockQty, 980, 'sugar must be deducted');
assert.equal(saved.rawMaterials.find((m: any) => m.id === 'flour-1').stockQty, 970, 'flour must be deducted');
assert.equal(saved.products.find((p: any) => p.id === 'finished-1').stockQty, 13, 'good output must be added to finished stock');
assert.equal(saved.productionBatches.length, 1, 'a production batch must be recorded');
assert.equal(saved.productionBatches[0].totalMaterialCostYER, 130, 'batch cost must be recorded');

let rejected = false;
try {
  produceLibraryRecipe({ recipe, batchGrams: 100, productId: 'finished-1', plannedQty: 10, producedQty: 10, damagedQty: 1 });
} catch { rejected = true; }
assert.equal(rejected, true, 'good output plus damaged output must not exceed planned quantity');
assert.equal(JSON.parse(memory.get('madhaq_factory_db_v1')!).productionBatches.length, 1, 'rejected batch must not mutate saved records');

console.log('Recipe production integration smoke test passed: mapping, costing, stock deduction, finished stock, batch record, and invalid-output rejection.');
