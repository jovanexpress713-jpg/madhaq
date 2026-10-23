import React, { useState, useEffect } from 'react';
import { storage, formatYER } from '../services/storage';
import { ReturnEntry } from '../types';
import { RotateCcw, X, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (entry: ReturnEntry) => void;
}

interface ReturnRow {
  productId: string;
  quantity: number;
  restock: boolean;
}

export const ReturnsModal: React.FC<ReturnsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [distributorId, setDistributorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ReturnRow[]>([
    { productId: '', quantity: 1, restock: false }
  ]);
  const [settlementType, setSettlementType] = useState<'REDUCE_DEBT' | 'CASH_REFUND'>('REDUCE_DEBT');
  const [reason, setReason] = useState('كسر أو تالف أثناء النقل');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const distributors = storage.getDistributors().filter((d) => d.active);
  const products = storage.getProducts().filter((p) => p.active);

  useEffect(() => {
    if (isOpen) {
      if (distributors.length > 0 && !distributorId) {
        setDistributorId(distributors[0].id);
      }
      setDate(new Date().toISOString().slice(0, 10));
      const firstProd = products[0];
      setItems([{ productId: firstProd ? firstProd.id : '', quantity: 1, restock: false }]);
      setSettlementType('REDUCE_DEBT');
      setReason('كسر أو تالف أثناء النقل');
      setNote('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const addItemRow = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      { productId: firstProd ? firstProd.id : '', quantity: 1, restock: false }
    ]);
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItem = (index: number, field: keyof ReturnRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const totalValue = items.reduce((sum, it) => {
    const p = products.find((prod) => prod.id === it.productId);
    return sum + (it.quantity || 0) * (p ? p.distributorPriceYER : 0);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorId) {
      setError('يرجى اختيار الموزع');
      return;
    }
    for (const it of items) {
      if (!it.productId || it.quantity <= 0) {
        setError('يرجى التأكد من الأصناف والكميات المرتجعة');
        return;
      }
    }

    const res = storage.createReturn({
      distributorId,
      date,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        restock: Boolean(it.restock)
      })),
      settlementType,
      reason,
      note: note.trim()
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء حفظ المرتجع');
      return;
    }

    if (res.returnEntry) {
      onSuccess(res.returnEntry);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">تسجيل مرتجع / بضاعة تالفة</h3>
              <p className="text-xs text-stone-500">إثبات مسؤولية التالف وتسوية الدين أو المخزون</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">الموزع *</label>
              <select
                value={distributorId}
                onChange={(e) => setDistributorId(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-semibold"
              >
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">تاريخ الإشعار *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold">
              <span>أصناف المرتجع / التالف:</span>
              <button type="button" onClick={addItemRow} className="text-amber-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة صنف</span>
              </button>
            </div>

            {items.map((row, idx) => {
              const prod = products.find((p) => p.id === row.productId);
              return (
                <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <select
                      value={row.productId}
                      onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatYER(p.distributorPriceYER)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white dark:bg-stone-800 border rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={row.restock}
                        onChange={(e) => updateItem(idx, 'restock', e.target.checked)}
                      />
                      <span>إعادة للمخزون؟</span>
                    </label>
                  </div>

                  <div className="col-span-1 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => removeItemRow(idx)} className="text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">نوع المعالجة المالية</label>
              <select
                value={settlementType}
                onChange={(e) => setSettlementType(e.target.value as any)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              >
                <option value="REDUCE_DEBT">خصم من رصيد دين الموزع</option>
                <option value="CASH_REFUND">رد المبلغ نقدًا للموزع</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">سبب المرتجع / التلف</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: انتهاء صلاحية أو كسر نقل"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl flex items-center justify-between font-bold">
            <span>إجمالي قيمة المرتجع:</span>
            <span className="font-mono text-sm text-rose-600 dark:text-rose-400">{formatYER(totalValue)}</span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border font-semibold">
              إلغاء
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold">
              تأكيد وحفظ المرتجع
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
