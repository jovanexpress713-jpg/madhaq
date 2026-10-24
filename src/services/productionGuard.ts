import { storage } from './storage';
import { validateProductionBatch } from './productionValidation';

/**
 * دفاع إضافي على مستوى التشغيل: يمنع أي مسار في التطبيق من تنفيذ دفعة إنتاج
 * قبل اجتياز قواعد الإنتاج، حتى لو لم تمر العملية من واجهة ProductionView.
 * لا يغيّر قاعدة البيانات أثناء التحقق.
 */
let installed = false;

export function installProductionGuard(): void {
  if (installed) return;

  const service = storage as typeof storage & {
    __madhaqProductionGuardInstalled?: boolean;
  };

  if (service.__madhaqProductionGuardInstalled) {
    installed = true;
    return;
  }

  const original = storage.executeProductionBatch.bind(storage);

  storage.executeProductionBatch = ((data) => {
    const validation = validateProductionBatch(storage.getDatabase(), {
      recipeId: data.recipeId,
      multiplier: data.multiplier,
      producedQty: data.producedQty,
      damagedQty: data.damagedQty
    });

    if (!validation.valid) {
      return { success: false, error: validation.error || 'دفعة الإنتاج غير صالحة.' };
    }

    return original(data);
  }) as typeof storage.executeProductionBatch;

  service.__madhaqProductionGuardInstalled = true;
  installed = true;
}
