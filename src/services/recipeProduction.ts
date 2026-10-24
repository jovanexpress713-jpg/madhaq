import { RecipeLibraryItem } from '../data/recipeLibrary';
import { RECIPE_OPERATION_META, DEFAULT_RECIPE_OPERATION_META } from '../data/recipeOperations';

const STORAGE_KEY = 'madhaq_factory_db_v1';
type Material = { id: string; name: string; unit: string; stockQty: number; averageCostPerUnitYER: number; active?: boolean };
type Product = { id: string; name: string; category: string; unit: string; factoryPriceYER: number; distributorPriceYER: number; stockQty: number; minimumQty: number; active: boolean; createdAt: number };
type ProductionPlanRow = { name: string; grams: number; material: Material | null; stockRequired: number | null; costYER: number | null; enough: boolean };
const normalize = (v: string) => v.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
function gramsPerStockUnit(unit: string): number | null {
  const u = normalize(unit).replace(/\s/g, '');
  if (u.includes('كيس') && (u.includes('50كجم') || u.includes('50kg'))) return 50000;
  if (u.includes('كيس') && (u.includes('25كجم') || u.includes('25kg'))) return 25000;
  if (u.includes('سطل') && (u.includes('5كجم') || u.includes('5kg'))) return 5000;
  if (u.includes('كجم') || u.includes('كيلو') || u === 'kg') return 1000;
  if (u.includes('جرام') || u.includes('غرام') || u === 'g' || u === 'gm') return 1;
  if (u.includes('لتر') || u === 'l' || u.includes('liter')) return 1000;
  if (u.includes('مل') || u === 'ml') return 1;
  return null;
}
function readDb(): any {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) throw new Error('قاعدة بيانات المعمل غير موجودة.');
  const db = JSON.parse(raw);
  db.rawMaterials = Array.isArray(db.rawMaterials) ? db.rawMaterials : [];
  db.products = Array.isArray(db.products) ? db.products : [];
  db.productionBatches = Array.isArray(db.productionBatches) ? db.productionBatches : [];
  return db;
}
function findMaterial(name: string, materials: Material[]): Material | null {
  const target = normalize(name);
  const active = materials.filter((m) => m.active !== false);
  return active.find((m) => normalize(m.name) === target) ?? null;
}

function scaledRecipeCosts(recipe: RecipeLibraryItem, batchGrams: number) {
  const scale = batchGrams / recipe.baseYieldGrams;
  const labor = Number(recipe.laborCostYER || 0) * scale;
  const packaging = Number(recipe.packagingCostYER || 0) * scale;
  const other = Number(recipe.otherCostYER || 0) * scale;
  return { scale, labor, packaging, other, nonMaterial: labor + packaging + other };
}

export function planLibraryRecipe(recipe: RecipeLibraryItem, batchGrams: number) {
  if (!Number.isFinite(batchGrams) || batchGrams <= 0) throw new Error('كمية الإنتاج يجب أن تكون أكبر من صفر.');
  if (recipe.baseYieldGrams <= 0) throw new Error('الوصفة الأساسية غير صالحة.');
  const db = readDb();
  const { scale, labor, packaging, other, nonMaterial } = scaledRecipeCosts(recipe, batchGrams);
  const rows: ProductionPlanRow[] = recipe.ingredients.map((ingredient) => {
    const material = findMaterial(ingredient.name, db.rawMaterials);
    const grams = ingredient.grams * scale;
    const perUnit = material ? gramsPerStockUnit(material.unit) : null;
    const stockRequired = material && perUnit ? grams / perUnit : null;
    const costYER = material && perUnit ? stockRequired! * Number(material.averageCostPerUnitYER || 0) : null;
    return { name: ingredient.name, grams, material, stockRequired, costYER, enough: Boolean(material && perUnit && material.stockQty >= (stockRequired || 0)) };
  });
  const missing = rows.filter((r) => !r.material || r.stockRequired === null);
  const insufficient = rows.filter((r) => r.material && r.stockRequired !== null && !r.enough);
  const totalMaterialCostYER = rows.reduce((s, r) => s + (r.costYER ?? 0), 0);
  const totalFullCostYER = totalMaterialCostYER + nonMaterial;
  return { scale, rows, missing, insufficient, laborCostYER: labor, packagingCostYER: packaging, otherCostYER: other, totalMaterialCostYER, totalFullCostYER, ready: missing.length === 0 && insufficient.length === 0 };
}

export function produceLibraryRecipe(input: { recipe: RecipeLibraryItem; batchGrams: number; productId: string; plannedQty: number; producedQty: number; damagedQty?: number; note?: string }) {
  const { recipe, batchGrams, productId } = input;
  const plannedQty = Number(input.plannedQty);
  const producedQty = Number(input.producedQty);
  const damagedQty = Math.max(0, Number(input.damagedQty || 0));
  if (!Number.isFinite(plannedQty) || plannedQty <= 0) throw new Error('الكمية المخطط إنتاجها يجب أن تكون أكبر من صفر.');
  if (!Number.isFinite(producedQty) || producedQty <= 0) throw new Error('الناتج السليم يجب أن يكون أكبر من صفر.');
  if (!Number.isFinite(damagedQty) || producedQty + damagedQty > plannedQty) throw new Error('الناتج السليم + التالف لا يمكن أن يتجاوز الكمية المخطط إنتاجها.');
  const plan = planLibraryRecipe(recipe, batchGrams);
  if (!plan.ready) {
    const missing = plan.missing.map((r) => r.name).join('، ');
    const insufficient = plan.insufficient.map((r) => r.name).join('، ');
    throw new Error([missing ? `مواد غير مرتبطة بالمخزون: ${missing}` : '', insufficient ? `رصيد غير كافٍ: ${insufficient}` : ''].filter(Boolean).join(' | '));
  }
  const db = readDb();
  const product = db.products.find((p: Product) => p.id === productId && p.active !== false);
  if (!product) throw new Error('اختر منتجاً فعّالاً لإضافة الناتج إلى مخزونه.');
  const snapshot = JSON.stringify(db);
  try {
    for (const row of plan.rows) {
      const material = db.rawMaterials.find((m: Material) => m.id === row.material!.id)!;
      material.stockQty -= row.stockRequired!;
    }
    product.stockQty += producedQty;
    product.factoryPriceYER = plan.totalFullCostYER / producedQty;
    const now = Date.now();
    const operationMeta = RECIPE_OPERATION_META[recipe.id] ?? DEFAULT_RECIPE_OPERATION_META;
    const productionDate = new Date(now).toISOString().slice(0, 10);
    const expiryDate = new Date(now + operationMeta.shelfLifeDays * 86400000).toISOString().slice(0, 10);
    db.productionBatches.push({
      id: `lib-batch-${now}-${Math.random().toString(36).slice(2, 8)}`,
      displayNumber: `BATCH-${String(db.productionBatches.length + 1001)}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      productId: product.id,
      productName: product.name,
      date: productionDate,
      createdAt: now,
      plannedQty,
      producedQty,
      damagedQty,
      totalMaterialCostYER: plan.totalMaterialCostYER,
      laborCostYER: plan.laborCostYER,
      packagingCostYER: plan.packagingCostYER,
      otherCostYER: plan.otherCostYER,
      totalFullCostYER: plan.totalFullCostYER,
      unitCostYER: plan.totalFullCostYER / producedQty,
      shelfLifeDaysReference: operationMeta.shelfLifeDays,
      shelfLifeValidated: false,
      storage: operationMeta.storage,
      packaging: operationMeta.packaging,
      productionDate,
      expiryDateReference: expiryDate,
      note: input.note || 'إنتاج من مكتبة الوصفات؛ تاريخ الانتهاء مرجعي ويجب اعتماده بعد تحقق الصلاحية الفعلي.'
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return { productName: product.name, totalMaterialCostYER: plan.totalMaterialCostYER, totalFullCostYER: plan.totalFullCostYER, unitCostYER: plan.totalFullCostYER / producedQty, producedQty, damagedQty, shelfLifeDaysReference: operationMeta.shelfLifeDays, expiryDateReference: expiryDate };
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, snapshot);
    throw error;
  }
}
