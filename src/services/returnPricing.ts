import { DatabaseSchema, ReturnEntry } from '../types';

export interface HistoricalReturnItemInput {
  productId: string;
  quantity: number;
}

export interface HistoricalReturnItemPricing {
  productId: string;
  quantity: number;
  unitPriceYER: number;
  totalYER: number;
}

export interface HistoricalReturnPricingResult {
  valid: boolean;
  error?: string;
  items?: HistoricalReturnItemPricing[];
  totalValueYER?: number;
}

/**
 * قيم المرتجعات يجب أن تعتمد على سعر التوزيع التاريخي، لا على سعر المنتج الحالي.
 * نستخدم FIFO على دفعات التوزيع لنفس الموزع والصنف، بعد خصم الكميات المرتجعة سابقاً.
 */
export function calculateHistoricalReturnPricing(
  db: DatabaseSchema,
  distributorId: string,
  requestedItems: HistoricalReturnItemInput[]
): HistoricalReturnPricingResult {
  const distributor = db.distributors.find((d) => d.id === distributorId);
  if (!distributor) return { valid: false, error: 'الموزع غير موجود.' };

  const grouped = new Map<string, number>();
  for (const item of requestedItems) {
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      return { valid: false, error: 'كمية المرتجع يجب أن تكون أكبر من صفر.' };
    }
    grouped.set(item.productId, (grouped.get(item.productId) || 0) + item.quantity);
  }

  const result: HistoricalReturnItemPricing[] = [];
  let totalValueYER = 0;

  for (const [productId, requestedQty] of grouped) {
    const distributions = db.distributions
      .filter((d) => d.distributorId === distributorId)
      .flatMap((d) => d.items
        .filter((item) => item.productId === productId)
        .map((item) => ({
          createdAt: d.createdAt,
          displayNumber: d.displayNumber,
          quantity: item.quantity,
          unitPriceYER: item.unitPriceYER
        })))
      .sort((a, b) => a.createdAt - b.createdAt);

    const returnedQty = db.returns
      .filter((r: ReturnEntry) => r.distributorId === distributorId)
      .reduce((sum, r) => sum + r.items
        .filter((item) => item.productId === productId)
        .reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

    let remainingHistoricalQty = returnedQty;
    const availableLots = distributions.map((lot) => ({ ...lot }));
    for (const lot of availableLots) {
      if (remainingHistoricalQty <= 0) break;
      const consume = Math.min(lot.quantity, remainingHistoricalQty);
      lot.quantity -= consume;
      remainingHistoricalQty -= consume;
    }

    let remainingRequest = requestedQty;
    let weightedValue = 0;
    let weightedQty = 0;

    for (const lot of availableLots) {
      if (remainingRequest <= 0) break;
      if (!Number.isFinite(lot.unitPriceYER) || lot.unitPriceYER <= 0 || lot.quantity <= 0) continue;
      const consume = Math.min(lot.quantity, remainingRequest);
      weightedValue += consume * lot.unitPriceYER;
      weightedQty += consume;
      remainingRequest -= consume;
    }

    if (remainingRequest > 0.0001 || weightedQty <= 0) {
      const product = db.products.find((p) => p.id === productId);
      return {
        valid: false,
        error: `لا توجد كمية تاريخية كافية لإرجاع (${product?.name || productId}). المتاح للإرجاع: ${weightedQty}.`
      };
    }

    const unitPriceYER = weightedValue / weightedQty;
    const totalYER = weightedValue;
    result.push({ productId, quantity: requestedQty, unitPriceYER, totalYER });
    totalValueYER += totalYER;
  }

  return { valid: true, items: result, totalValueYER };
}
