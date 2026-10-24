import { DatabaseSchema, Recipe } from '../types';

export interface ProductionValidationInput {
  recipeId: string;
  multiplier: number;
  producedQty: number;
  damagedQty: number;
}

export interface ProductionValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * قواعد الأعمال لدفعة الإنتاج قبل أن تغيّر المخزون.
 * هذه الدالة لا تعدّل قاعدة البيانات، ويمكن استخدامها من الواجهة أو طبقة التخزين.
 *
 * مهم: يتم تجميع استهلاك المادة الخام حسب المعرّف، لأن الوصفة قد تحتوي
 * على نفس المادة في أكثر من سطر. التحقق من كل سطر منفرداً قد يسمح بتجاوز
 * المخزون عند وجود تكرار لنفس المادة.
 */
export function validateProductionBatch(
  db: DatabaseSchema,
  input: ProductionValidationInput
): ProductionValidationResult {
  if (!Number.isFinite(input.multiplier) || input.multiplier <= 0) {
    return { valid: false, error: 'معامل الإنتاج يجب أن يكون أكبر من صفر.' };
  }
  if (!Number.isFinite(input.producedQty) || input.producedQty <= 0) {
    return { valid: false, error: 'كمية الإنتاج السليم يجب أن تكون أكبر من صفر.' };
  }
  if (!Number.isFinite(input.damagedQty) || input.damagedQty < 0) {
    return { valid: false, error: 'كمية التالف لا يمكن أن تكون سالبة.' };
  }

  const recipe: Recipe | undefined = db.recipes.find(r => r.id === input.recipeId && r.active);
  if (!recipe) return { valid: false, error: 'الوصفة غير موجودة أو غير مفعلة.' };
  if (!Number.isFinite(recipe.outputQty) || recipe.outputQty <= 0) {
    return { valid: false, error: 'ناتج الوصفة غير صالح.' };
  }
  if (!db.products.some(p => p.id === recipe.productId && p.active)) {
    return { valid: false, error: 'المنتج النهائي للوصفة غير موجود أو غير مفعّل.' };
  }
  if (!recipe.items.length) {
    return { valid: false, error: 'الوصفة لا تحتوي مواد خام.' };
  }

  const plannedQty = recipe.outputQty * input.multiplier;
  const actualQty = input.producedQty + input.damagedQty;
  if (actualQty > plannedQty + 0.0001) {
    return {
      valid: false,
      error: `الناتج السليم والتالف (${actualQty}) يتجاوز الناتج المخطط (${plannedQty}).`
    };
  }

  const requiredByRaw = new Map<string, number>();
  for (const item of recipe.items) {
    if (!item.rawMaterialId) {
      return { valid: false, error: `يوجد سطر مادة خام بدون معرّف.` };
    }
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: `كمية المادة الخام (${item.rawMaterialName}) غير صالحة.` };
    }

    const previous = requiredByRaw.get(item.rawMaterialId) || 0;
    requiredByRaw.set(item.rawMaterialId, previous + item.quantity * input.multiplier);
  }

  for (const [rawMaterialId, required] of requiredByRaw) {
    const raw = db.rawMaterials.find(r => r.id === rawMaterialId && r.active);
    if (!raw) {
      const item = recipe.items.find(i => i.rawMaterialId === rawMaterialId);
      return {
        valid: false,
        error: `المادة الخام (${item?.rawMaterialName || rawMaterialId}) غير موجودة أو غير مفعلة.`
      };
    }
    if (!Number.isFinite(raw.stockQty) || raw.stockQty < 0) {
      return { valid: false, error: `رصيد المادة الخام (${raw.name}) غير صالح.` };
    }
    if (raw.stockQty + 0.0001 < required) {
      return {
        valid: false,
        error: `المخزون غير كافٍ للمادة (${raw.name}). المتاح: ${raw.stockQty}، المطلوب: ${required}.`
      };
    }
  }

  return { valid: true };
}
