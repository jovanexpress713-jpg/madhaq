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
  if (!recipe.items.length) {
    return { valid: false, error: 'الوصفة لا تحتوي مواد خام.' };
  }

  const plannedQty = recipe.outputQty * input.multiplier;
  if (input.producedQty + input.damagedQty > plannedQty + 0.0001) {
    return {
      valid: false,
      error: `الناتج السليم والتالف (${input.producedQty + input.damagedQty}) يتجاوز الناتج المخطط (${plannedQty}).`
    };
  }

  for (const item of recipe.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: `كمية المادة الخام (${item.rawMaterialName}) غير صالحة.` };
    }
    const raw = db.rawMaterials.find(r => r.id === item.rawMaterialId);
    if (!raw) return { valid: false, error: `المادة الخام (${item.rawMaterialName}) غير موجودة.` };
    const required = item.quantity * input.multiplier;
    if (raw.stockQty < required) {
      return {
        valid: false,
        error: `المخزون غير كافٍ للمادة (${raw.name}). المتاح: ${raw.stockQty}، المطلوب: ${required}.`
      };
    }
  }

  return { valid: true };
}
