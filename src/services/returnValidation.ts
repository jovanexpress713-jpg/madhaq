import { DatabaseSchema } from '../types';

export interface ReturnValidationInput {
  distributorId: string;
  items: { productId: string; quantity: number; restock: boolean }[];
  settlementType: 'REDUCE_DEBT' | 'CASH_REFUND';
  reason: string;
}

export interface ReturnValidationResult {
  valid: boolean;
  error?: string;
}

export function validateReturn(db: DatabaseSchema, input: ReturnValidationInput): ReturnValidationResult {
  const distributor = db.distributors.find(d => d.id === input.distributorId && d.active);
  if (!distributor) return { valid: false, error: 'الموزع غير موجود أو غير مفعّل.' };
  if (!input.items.length) return { valid: false, error: 'يجب إضافة صنف واحد على الأقل.' };
  if (!input.reason?.trim()) return { valid: false, error: 'سبب المرتجع مطلوب.' };

  const available = new Map<string, number>();
  for (const d of db.distributions) if (d.distributorId === input.distributorId) {
    for (const item of d.items) available.set(item.productId, (available.get(item.productId) || 0) + item.quantity);
  }
  for (const r of db.returns) if (r.distributorId === input.distributorId) {
    for (const item of r.items) available.set(item.productId, (available.get(item.productId) || 0) - item.quantity);
  }

  const requested = new Map<string, number>();
  for (const item of input.items) {
    const product = db.products.find(p => p.id === item.productId && p.active);
    if (!product) return { valid: false, error: 'أحد المنتجات غير موجود أو غير مفعّل.' };
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: `كمية المرتجع للمنتج (${product.name}) يجب أن تكون أكبر من صفر.` };
    }
    requested.set(item.productId, (requested.get(item.productId) || 0) + item.quantity);
  }

  for (const [productId, quantity] of requested) {
    const product = db.products.find(p => p.id === productId)!;
    const remaining = Math.max(0, available.get(productId) || 0);
    if (quantity > remaining + 0.0001) {
      return { valid: false, error: `كمية المرتجع من (${product.name}) تتجاوز الكمية الموزعة المتبقية. المتاح للإرجاع: ${remaining}.` };
    }
  }

  if (input.settlementType === 'REDUCE_DEBT') {
    const credit = db.distributions.filter(d => d.distributorId === input.distributorId).reduce((s, d) => s + d.creditYER, 0);
    const collected = db.collections.filter(c => c.distributorId === input.distributorId).reduce((s, c) => s + c.amountYER, 0);
    const returned = db.returns.filter(r => r.distributorId === input.distributorId && r.settlementType === 'REDUCE_DEBT').reduce((s, r) => s + r.totalValueYER, 0);
    const currentDebt = (distributor.openingDebtYER || 0) + credit - collected - returned;
    if (currentDebt <= 0) return { valid: false, error: 'لا يوجد دين مستحق يمكن خصم المرتجع منه.' };
  }

  return { valid: true };
}
