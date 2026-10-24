import { storage } from './storage';
import { validatePurchase } from './purchaseValidation';

let installed = false;

/** يمنع أي مسار في التطبيق من تسجيل شراء غير صالح قبل تعديل مخزون المواد الخام. */
export function installPurchaseGuard(): void {
  if (installed) return;

  const service = storage as typeof storage & {
    __madhaqPurchaseGuardInstalled?: boolean;
  };

  if (service.__madhaqPurchaseGuardInstalled) {
    installed = true;
    return;
  }

  const original = storage.createPurchase.bind(storage);

  storage.createPurchase = ((data) => {
    const validation = validatePurchase(storage.getDatabase(), {
      supplierId: data.supplierId,
      items: data.items,
      cashPaidYER: data.cashPaidYER
    });

    if (!validation.valid) {
      return { success: false, error: validation.error || 'فاتورة الشراء غير صالحة.' };
    }

    return original(data);
  }) as typeof storage.createPurchase;

  service.__madhaqPurchaseGuardInstalled = true;
  installed = true;
}
