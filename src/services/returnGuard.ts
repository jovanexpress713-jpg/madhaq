import { storage } from './storage';
import { validateReturn } from './returnValidation';

let installed = false;

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
    return originalReturn(data);
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
