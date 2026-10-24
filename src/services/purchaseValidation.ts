import { DatabaseSchema } from '../types';

export interface PurchaseValidationInput {
  supplierId: string;
  items: { rawMaterialId: string; quantity: number; unitCostYER: number }[];
  cashPaidYER: number;
}

export interface PurchaseValidationResult {
  valid: boolean;
  error?: string;
}

/** قواعد المشتريات قبل تغيير مخزون المواد الخام أو أرصدة المورد. */
export function validatePurchase(
  db: DatabaseSchema,
  input: PurchaseValidationInput
): PurchaseValidationResult {
  if (!db.suppliers.some(s => s.id === input.supplierId && s.active)) {
    return { valid: false, error: 'المورد غير موجود أو غير مفعّل.' };
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { valid: false, error: 'يجب إضافة مادة خام واحدة على الأقل.' };
  }
  if (!Number.isFinite(input.cashPaidYER) || input.cashPaidYER < 0) {
    return { valid: false, error: 'المبلغ النقدي المدفوع غير صالح.' };
  }

  let total = 0;
  for (const item of input.items) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: 'كمية المادة الخام يجب أن تكون أكبر من صفر.' };
    }
    if (!Number.isFinite(item.unitCostYER) || item.unitCostYER <= 0) {
      return { valid: false, error: 'سعر تكلفة المادة الخام يجب أن يكون أكبر من صفر.' };
    }
    const raw = db.rawMaterials.find(r => r.id === item.rawMaterialId && r.active);
    if (!raw) {
      return { valid: false, error: 'إحدى المواد الخام غير موجودة أو غير مفعّلة.' };
    }
    total += item.quantity * item.unitCostYER;
  }

  if (!Number.isFinite(total) || total <= 0) {
    return { valid: false, error: 'إجمالي فاتورة الشراء غير صالح.' };
  }
  if (input.cashPaidYER > total + 0.0001) {
    return { valid: false, error: 'المبلغ النقدي المدفوع لا يمكن أن يتجاوز إجمالي الفاتورة.' };
  }

  return { valid: true };
}
