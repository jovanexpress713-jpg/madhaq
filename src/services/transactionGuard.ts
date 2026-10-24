import { storage } from './storage';
import { DatabaseSchema } from '../types';

/**
 * يحمي معاملات localStorage متعددة الخطوات من بقاء قاعدة البيانات في حالة جزئية
 * إذا حدث استثناء بعد تعديل جزء من المخزون أو السجلات.
 */
export function withTransactionRollback<T>(operation: () => T): T {
  const db = storage.getDatabase();
  const snapshot = JSON.stringify(db);

  try {
    return operation();
  } catch (error) {
    try {
      const restored = JSON.parse(snapshot) as DatabaseSchema;
      Object.keys(db).forEach((key) => {
        delete (db as unknown as Record<string, unknown>)[key];
      });
      Object.assign(db, restored);
      localStorage.setItem('madhaq_factory_db_v1', JSON.stringify(db));
    } catch (rollbackError) {
      console.error('MADHAQ transaction rollback failed', rollbackError);
    }
    throw error;
  }
}
