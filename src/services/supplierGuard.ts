import { storage } from './storage';
import { validateSupplierPayment } from './supplierValidation';

let installed = false;

/** حماية سداد الموردين على مستوى الخدمة، وليس الواجهة فقط. */
export function installSupplierGuard(): void {
  if (installed) return;
  const service = storage as typeof storage & { __madhaqSupplierGuardInstalled?: boolean };
  if (service.__madhaqSupplierGuardInstalled) { installed = true; return; }

  const originalPayment = storage.createSupplierPayment.bind(storage);
  storage.createSupplierPayment = ((data) => {
    const validation = validateSupplierPayment(storage.getDatabase(), {
      supplierId: data.supplierId,
      amountYER: data.amountYER
    });
    if (!validation.valid) {
      return { success: false, error: validation.error || 'سداد المورد غير صالح.' };
    }
    return originalPayment(data);
  }) as typeof storage.createSupplierPayment;

  service.__madhaqSupplierGuardInstalled = true;
  installed = true;
}
