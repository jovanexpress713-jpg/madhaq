import { storage } from './storage';
import { calculateHistoricalReturnPricing } from './returnPricing';
import { validateReturn } from './returnValidation';

let installed = false;

/** حماية المرتجعات والتحصيلات مع تثبيت سعر المرتجع من التوزيعات التاريخية. */
export function installReturnGuard(): void {
  if (installed) return;
  const service = storage as typeof storage & { __madhaqReturnGuardInstalled?: boolean };
  if (service.__madhaqReturnGuardInstalled) { installed = true; return; }

  const originalReturn = storage.createReturn.bind(storage);
  storage.createReturn = ((data) => {
    const validation = validateReturn(storage.getDatabase(), {
      distributorId: data.distributorId,
      items: data.items,
      settlementType: data.settlementType,
      reason: data.reason
    });
    if (!validation.valid) return { success: false, error: validation.error || 'المرتجع غير صالح.' };

    const pricing = calculateHistoricalReturnPricing(
      storage.getDatabase(),
      data.distributorId,
      data.items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    );
    if (!pricing.valid || !pricing.items) {
      return { success: false, error: pricing.error || 'تعذر تحديد سعر المرتجع التاريخي.' };
    }

    const result = originalReturn(data);
    if (!result.success || !result.returnEntry) return result;

    const priceByProduct = new Map(pricing.items.map((item) => [item.productId, item]));
    const entry = storage.getDatabase().returns.find((item) => item.id === result.returnEntry!.id);
    if (!entry) return result;

    entry.items = entry.items.map((item) => {
      const historical = priceByProduct.get(item.productId);
      if (!historical) return item;
      return {
        ...item,
        unitPriceYER: historical.unitPriceYER,
        totalYER: historical.totalYER
      };
    });
    entry.totalValueYER = pricing.totalValueYER || 0;

    // تثبيت التصحيح فوراً في نفس قاعدة البيانات المحلية.
    localStorage.setItem('madhaq_factory_db_v1', JSON.stringify(storage.getDatabase()));
    return { success: true, returnEntry: entry };
  }) as typeof storage.createReturn;

  const originalCollection = storage.createCollection.bind(storage);
  storage.createCollection = ((data) => {
    const dist = storage.getDistributorById(data.distributorId);
    if (!dist) return { success: false, error: 'الموزع غير موجود.' };
    if (!Number.isFinite(data.amountYER) || data.amountYER <= 0) {
      return { success: false, error: 'مبلغ التحصيل يجب أن يكون أكبر من صفر.' };
    }
    const fin = storage.getDistributorFinancials(dist.id);
    if (data.amountYER > fin.currentDebt + 0.0001) {
      return { success: false, error: 'مبلغ التحصيل يتجاوز الدين المستحق على الموزع.' };
    }
    return originalCollection(data);
  }) as typeof storage.createCollection;

  service.__madhaqReturnGuardInstalled = true;
  installed = true;
}
