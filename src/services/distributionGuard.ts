import { storage } from './storage';
import { withTransactionRollback } from './transactionGuard';

let installed = false;

/**
 * يحمي توزيع الأصناف متعددة السطور من بقاء خصم جزئي للمخزون إذا حدث استثناء.
 * التحقق التجاري الأساسي يبقى داخل StorageService، وهذا الغلاف يضيف الذرّية.
 */
export function installDistributionGuard(): void {
  if (installed) return;

  const service = storage as typeof storage & { __madhaqDistributionGuardInstalled?: boolean };
  if (service.__madhaqDistributionGuardInstalled) {
    installed = true;
    return;
  }

  const original = storage.createDistribution.bind(storage);
  storage.createDistribution = ((data) => withTransactionRollback(() => original(data))) as typeof storage.createDistribution;

  service.__madhaqDistributionGuardInstalled = true;
  installed = true;
}
