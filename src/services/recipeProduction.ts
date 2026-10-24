import { RecipeLibraryItem } from '../data/recipeLibrary';

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
  return materials.find((m) => normalize(m.name) === target)
    ?? materials.find((m) => normalize(m.name).includes(target) || target.includes(normalize(m.name)))
    ?? null;
}

export function planLibraryRecipe(recipe: RecipeLibraryItem, batchGrams: number) {
  if (!Number.isFinite(batchGrams) || batchGrams <= 0) throw new Error('كمية الإنتاج يجب أن تكون أكبر من صفر.');
  if (recipe.baseYieldGrams <= 0) throw new Error('الوصفة الأساسية غير صالحة.');
  const db = readDb();
  const scale = batchGrams / recipe.baseYieldGrams;
  const rows: ProductionPlanRow[] = recipe.ingredients.map((ingredient) => {
    const material = findMaterial(ingredient.name, db.rawMaterials);
    const grams = ingredient.grams * scale;
    const perUnit = material ? gramsPerStockUnit(material.unit) : null;
    const stockRequired = material && perUnit ? grams / perUnit : null;
    const costYER = material && perUnit ? grams / perUnit * Number(material.averageCostPerUnitYER || 0) : null;
    return { name: ingredient.name, grams, material, stockRequired, costYER, enough: Boolean(material && perUnit && material.stockQty >= (stockRequired || 0)) };
  });
  const missing = rows.filter((r) => !r.material || r.stockRequired === null);
  const insufficient = rows.filter((r) => r.material && r.stockRequired !== null && !r.enough);
  const totalMaterialCostYER = rows.reduce((s, r) => s + (r.costYER ?? 0), 0);
  return { scale, rows, missing, insufficient, totalMaterialCostYER, ready: missing.length === 0 && insufficient.length === 0 };
}

export function produceLibraryRecipe(input: { recipe: RecipeLibraryItem; batchGrams: number; productId: string; producedQty: number; damagedQty?: number; note?: string }) {
  const { recipe, batchGrams, productId } = input;
  const producedQty = Number(input.producedQty);
  const damagedQty = Math.max(0, Number(input.damagedQty || 0));
  if (!Number.isFinite(producedQty) || producedQty <= 0) throw new Error('الناتج السليم يجب أن يكون أكبر من صفر.');
  if (!Number.isFinite(damagedQty) || producedQty + damagedQty > batchGrams) throw new Error('الناتج السليم + التالف لا يمكن أن يتجاوز كمية الإنتاج بالجرام.');

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
    product.factoryPriceYER = plan.totalMaterialCostYER / producedQty;

    const now = Date.now();
    db.productionBatches.push({
      id: `lib-batch-${now}-${Math.random().toString(36).slice(2, 8)}`,
      displayNumber: `BATCH-${String(db.productionBatches.length + 1001)}`,
      recipeId: recipe.id,
      recipeName: recipe.name,
      productId: product.id,
      productName: product.name,
      date: new Date(now).toISOString().slice(0, 10),
      createdAt: now,
      plannedQty: batchGrams,
      producedQty,
      damagedQty,
      totalMaterialCostYER: plan.totalMaterialCostYER,
      unitCostYER: plan.totalMaterialCostYER / producedQty,
      note: input.note || `إنتاج من مكتبة الوصفات — صلاحية مرجعية تُدار من بيانات المنتج.`
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    return { productName: product.name, totalMaterialCostYER: plan.totalMaterialCostYER, unitCostYER: plan.totalMaterialCostYER / producedQty, producedQty, damagedQty };
  } catch (error) {
    localStorage.setItem(STORAGE_KEY, snapshot);
    throw error;
  }
}
