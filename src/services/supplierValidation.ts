import { DatabaseSchema } from '../types';

export interface SupplierPaymentValidationInput {
  supplierId: string;
  amountYER: number;
}

export interface SupplierPaymentValidationResult {
  valid: boolean;
  error?: string;
}

/** يمنع تسجيل سداد مورد أكبر من الرصيد المستحق أو بقيمة غير صالحة. */
export function validateSupplierPayment(
  db: DatabaseSchema,
  input: SupplierPaymentValidationInput
): SupplierPaymentValidationResult {
  const supplier = db.suppliers.find((s) => s.id === input.supplierId && s.active);
  if (!supplier) return { valid: false, error: 'المورد غير موجود أو غير نشط.' };

  if (!Number.isFinite(input.amountYER) || input.amountYER <= 0) {
    return { valid: false, error: 'مبلغ سداد المورد يجب أن يكون أكبر من صفر.' };
  }

  const creditTaken = db.purchases
    .filter((p) => p.supplierId === input.supplierId)
    .reduce((sum, p) => sum + Math.max(0, p.creditYER), 0);
  const paid = db.supplierPayments
    .filter((p) => p.supplierId === input.supplierId)
    .reduce((sum, p) => sum + Math.max(0, p.amountYER), 0);
  const currentBalance = (supplier.openingBalanceYER || 0) + creditTaken - paid;

  if (input.amountYER > currentBalance + 0.0001) {
    return {
      valid: false,
      error: `مبلغ السداد يتجاوز رصيد المورد المستحق. الرصيد الحالي: ${currentBalance.toLocaleString('ar-YE')} ريال.`
    };
  }

  return { valid: true };
}
