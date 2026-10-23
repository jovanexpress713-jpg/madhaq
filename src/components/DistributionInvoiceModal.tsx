import React, { useState, useEffect } from 'react';
import { storage, formatYER, formatNumber } from '../services/storage';
import { Distribution } from '../types';
import {
  Truck,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Coins,
  ShieldAlert,
  CheckCircle2,
  Printer
} from 'lucide-react';

interface DistributionInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistributorId?: string;
  onSuccess: (distribution: Distribution) => void;
}

interface ItemRow {
  productId: string;
  quantity: number;
  unitPriceYER: number;
}

export const DistributionInvoiceModal: React.FC<DistributionInvoiceModalProps> = ({
  isOpen,
  onClose,
  initialDistributorId,
  onSuccess
}) => {
  const [distributorId, setDistributorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ItemRow[]>([
    { productId: '', quantity: 1, unitPriceYER: 0 }
  ]);
  const [cashPaidYER, setCashPaidYER] = useState<number>(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const distributors = storage.getDistributors().filter((d) => d.active);
  const products = storage.getProducts().filter((p) => p.active);

  useEffect(() => {
    if (isOpen) {
      if (initialDistributorId) {
        setDistributorId(initialDistributorId);
      } else if (distributors.length > 0 && !distributorId) {
        setDistributorId(distributors[0].id);
      }
      setDate(new Date().toISOString().slice(0, 10));
      // First product default
      const firstProd = products[0];
      setItems([
        {
          productId: firstProd ? firstProd.id : '',
          quantity: 10,
          unitPriceYER: firstProd ? firstProd.distributorPriceYER : 0
        }
      ]);
      setCashPaidYER(0);
      setNote('');
      setError('');
    }
  }, [isOpen, initialDistributorId]);

  if (!isOpen) return null;

  const selectedDistributor = distributors.find((d) => d.id === distributorId);
  const distFin = selectedDistributor
    ? storage.getDistributorFinancials(selectedDistributor.id)
    : null;

  const addItemRow = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        productId: firstProd ? firstProd.id : '',
        quantity: 10,
        unitPriceYER: firstProd ? firstProd.distributorPriceYER : 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      if (field === 'productId') {
        const prod = products.find((p) => p.id === value);
        if (prod) {
          next[index].unitPriceYER = prod.distributorPriceYER;
        }
      }
      return next;
    });
  };

  // Calculations
  const grossTotal = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitPriceYER || 0), 0);
  const creditTotal = Math.max(0, grossTotal - (cashPaidYER || 0));

  // Projected debt limit check
  const projectedDebt = distFin ? distFin.currentDebt + creditTotal : 0;
  const isOverLimit =
    selectedDistributor &&
    selectedDistributor.debtLimitYER > 0 &&
    projectedDebt > selectedDistributor.debtLimitYER;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorId) {
      setError('يرجى اختيار الموزع');
      return;
    }

    if (items.length === 0) {
      setError('يرجى إضافة صنف واحد على الأقل للفاتورة');
      return;
    }

    for (const it of items) {
      if (!it.productId) {
        setError('يرجى اختيار الصنف');
        return;
      }
      if (it.quantity <= 0) {
        setError('يرجى إدخال كمية صحيحة أكبر من صفر');
        return;
      }
      const prod = products.find((p) => p.id === it.productId);
      if (prod && prod.stockQty < it.quantity) {
        setError(`الكمية المطلوبة من (${prod.name}) تتجاوز المخزون المتوفر (${prod.stockQty} ${prod.unit})`);
        return;
      }
    }

    const result = storage.createDistribution({
      distributorId,
      date,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        unitPriceYER: Number(it.unitPriceYER)
      })),
      cashPaidYER: Number(cashPaidYER) || 0,
      note: note.trim()
    });

    if (!result.success) {
      setError(result.error || 'حدث خطأ أثناء حفظ الفاتورة');
      return;
    }

    if (result.distribution) {
      onSuccess(result.distribution);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 sm:p-7 text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                فاتورة توزيع بضاعة جديدة
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                تسجيل إرسالية حلويات للموزع مع خصم فوري للمخزون وحساب الدين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Distributor & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">الموزع المستلم *</label>
              <select
                value={distributorId}
                onChange={(e) => setDistributorId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold focus:outline-none focus:border-amber-500"
              >
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">تاريخ الفاتورة *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Distributor Live Credit Status */}
          {distFin && selectedDistributor && (
            <div className={`p-3 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
              isOverLimit
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold">الدين الحالي: {formatYER(distFin.currentDebt)}</span>
                {selectedDistributor.debtLimitYER > 0 && (
                  <span className="text-[11px] opacity-80">
                    (سقف الدين: {formatYER(selectedDistributor.debtLimitYER)})
                  </span>
                )}
              </div>
              <div className="font-semibold">
                العمولة المحسوبة له: {selectedDistributor.commissionType === 'PER_PIECE' ? `${formatYER(selectedDistributor.commissionValue)} / قطعة` : `${selectedDistributor.commissionValue}%`}
              </div>
            </div>
          )}

          {/* Invoice Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold text-stone-700 dark:text-stone-300">
              <span>الأصناف المسحوبة:</span>
              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف آخر</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((row, idx) => {
                const prod = products.find((p) => p.id === row.productId);
                const lineTotal = (row.quantity || 0) * (row.unitPriceYER || 0);

                return (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl grid grid-cols-12 gap-2.5 items-center"
                  >
                    {/* Product Selection */}
                    <div className="col-span-12 sm:col-span-5">
                      <select
                        value={row.productId}
                        onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                        className="w-full px-2.5 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-amber-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (المتاح: {p.stockQty} {p.unit})
                          </option>
                        ))}
                      </select>
                      {prod && (
                        <div className="text-[10px] text-stone-400 mt-1">
                          المخزون الحالي: {prod.stockQty} {prod.unit}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-stone-400 mb-0.5">الكمية</label>
                      <input
                        type="number"
                        min="1"
                        value={row.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-4 sm:col-span-2">
                      <label className="block text-[10px] text-stone-400 mb-0.5">السعر (ر.ي)</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={row.unitPriceYER}
                        onChange={(e) => updateItem(idx, 'unitPriceYER', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Line Total */}
                    <div className="col-span-3 sm:col-span-2 text-left">
                      <label className="block text-[10px] text-stone-400 mb-0.5">الإجمالي</label>
                      <span className="font-mono font-bold text-xs text-amber-600 dark:text-amber-400">
                        {formatYER(lineTotal)}
                      </span>
                    </div>

                    {/* Delete row */}
                    <div className="col-span-1 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="p-1 text-stone-400 hover:text-rose-500"
                          title="حذف هذا الصنف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="p-4 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-3">
            <div className="flex items-center justify-between text-sm font-bold">
              <span>إجمالي الفاتورة:</span>
              <span className="font-mono text-base text-stone-900 dark:text-stone-100">
                {formatYER(grossTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-stone-200 dark:border-stone-700">
              <div>
                <label className="block font-bold mb-1 text-emerald-700 dark:text-emerald-400">
                  المبلغ المدفوع نقدًا (ر.ي)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grossTotal}
                  step="500"
                  value={cashPaidYER}
                  onChange={(e) => setCashPaidYER(Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-emerald-500/40 rounded-xl text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-amber-700 dark:text-amber-400">
                  المتبقي آجل (يضاف لدين الموزع)
                </label>
                <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm font-mono font-bold text-amber-700 dark:text-amber-300">
                  {formatYER(creditTotal)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">ملاحظات الفاتورة أو خط السير</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: تسليم سوق الزبيري، سيارة التوزيع رقم 2"
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 font-semibold"
            >
              إلغاء
            </button>

            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition shadow-lg text-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>اعتماد وحفظ الفاتورة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
