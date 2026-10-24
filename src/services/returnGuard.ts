import { storage } from './storage';
import { validateReturn } from './returnValidation';

let installed = false;

/**
 * حماية المرتجعات والتحصيلات، مع تثبيت السعر التاريخي للمرتجع.
 * السعر التاريخي يُستخرج من فواتير التوزيع السابقة للموزع بعد خصم الكميات
 * التي سبق إرجاعها، حتى لا تتأثر السجلات القديمة بتغيير سعر البيع الحالي.
 */
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

    const db = storage.getDatabase();
    const historicalPrices = new Map<string, number>();
    const distributions = [...db.distributions]
      .filter((d) => d.distributorId === data.distributorId)
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const requested of data.items) {
      const previousReturned = db.returns
        .filter((r) => r.distributorId === data.distributorId)
        .flatMap((r) => r.items)
        .filter((item) => item.productId === requested.productId)
        .reduce((sum, item) => sum + item.quantity, 0);

      let skip = previousReturned;
      let available = 0;
      let value = 0;
      for (const distribution of distributions) {
        for (const item of distribution.items) {
          if (item.productId !== requested.productId) continue;
          const skipped = Math.min(skip, item.quantity);
          skip -= skipped;
          const remaining = item.quantity - skipped;
          if (remaining > 0) {
            available += remaining;
            value += remaining * item.unitPriceYER;
          }
        }
      }
      if (available > 0) historicalPrices.set(requested.productId, value / available);
    }

    const result = originalReturn(data);
    if (!result.success || !result.returnEntry) return result;

    let correctedTotal = 0;
    result.returnEntry.items = result.returnEntry.items.map((item) => {
      const historicalPrice = historicalPrices.get(item.productId);
      if (!historicalPrice || !Number.isFinite(historicalPrice)) {
        correctedTotal += item.totalYER;
        return item;
      }
      const totalYER = item.quantity * historicalPrice;
      correctedTotal += totalYER;
      return { ...item, unitPriceYER: historicalPrice, totalYER };
    });
    result.returnEntry.totalValueYER = correctedTotal;
    db.returns = db.returns.map((entry) => entry.id === result.returnEntry!.id ? result.returnEntry! : entry);
    localStorage.setItem('madhaq_factory_db_v1', JSON.stringify(db));
    return result;
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
