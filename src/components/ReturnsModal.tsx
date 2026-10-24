import React, { useState, useEffect } from 'react';
import { storage, formatYER } from '../services/storage';
import { calculateHistoricalReturnPricing } from '../services/returnPricing';
import { ReturnEntry } from '../types';
import { RotateCcw, X, Plus, Trash2, AlertCircle } from 'lucide-react';

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

export const ReturnsModal: React.FC<ReturnsModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [distributorId, setDistributorId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<ReturnRow[]>([{ productId: '', quantity: 1, restock: false }]);
  const [settlementType, setSettlementType] = useState<'REDUCE_DEBT' | 'CASH_REFUND'>('REDUCE_DEBT');
  const [reason, setReason] = useState('كسر أو تالف أثناء النقل');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const distributors = storage.getDistributors().filter((d) => d.active);
  const products = storage.getProducts().filter((p) => p.active);

  useEffect(() => {
    if (isOpen) {
      if (distributors.length > 0) setDistributorId((current) => current || distributors[0].id);
      setDate(new Date().toISOString().slice(0, 10));
      setItems([{ productId: products[0]?.id || '', quantity: 1, restock: false }]);
      setSettlementType('REDUCE_DEBT');
      setReason('كسر أو تالف أثناء النقل');
      setNote('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedDistributor = distributors.find((d) => d.id === distributorId);
  const fin = selectedDistributor ? storage.getDistributorFinancials(selectedDistributor.id) : null;
  const pricing = selectedDistributor
    ? calculateHistoricalReturnPricing(storage.getDatabase(), selectedDistributor.id, items.map((it) => ({ productId: it.productId, quantity: Math.max(0, Number(it.quantity) || 0) })))
    : { valid: false, totalValueYER: 0 };
  const totalValue = pricing.valid ? pricing.totalValueYER || 0 : 0;
  const historicalPriceByProduct = new Map((pricing.items || []).map((item) => [item.productId, item.unitPriceYER]));
  const debtExceeded = settlementType === 'REDUCE_DEBT' && !!fin && totalValue > Math.max(0, fin.currentDebt);

  const addItemRow = () => setItems((prev) => [...prev, { productId: products[0]?.id || '', quantity: 1, restock: false }]);
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, idx) => idx !== index));
  const updateItem = (index: number, field: keyof ReturnRow, value: string | number | boolean) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value } as ReturnRow;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorId) return setError('يرجى اختيار الموزع');
    if (!reason.trim()) return setError('يرجى إدخال سبب المرتجع أو التلف');
    if (items.length === 0) return setError('أضف صنفاً واحداً على الأقل');
    if (items.some((it) => !it.productId || !Number.isFinite(Number(it.quantity)) || Number(it.quantity) <= 0)) {
      return setError('يرجى التأكد من الأصناف والكميات المرتجعة');
    }
    if (!pricing.valid) return setError(pricing.error || 'لا توجد كمية تاريخية كافية لهذا المرتجع');
    if (totalValue <= 0) return setError('قيمة المرتجع يجب أن تكون أكبر من صفر');
    if (settlementType === 'REDUCE_DEBT' && (!fin || fin.currentDebt <= 0)) {
      return setError('لا يوجد دين مستحق يمكن خصم قيمة المرتجع منه');
    }
    if (debtExceeded) {
      return setError(`قيمة المرتجع أكبر من الدين المستحق. الحد الأقصى للخصم: ${formatYER(fin?.currentDebt || 0)}`);
    }

    const res = storage.createReturn({
      distributorId,
      date,
      items: items.map((it) => ({ productId: it.productId, quantity: Number(it.quantity), restock: Boolean(it.restock) })),
      settlementType,
      reason: reason.trim(),
      note: note.trim()
    });

    if (!res.success) return setError(res.error || 'حدث خطأ أثناء حفظ المرتجع');
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
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold"><RotateCcw className="w-6 h-6" /></div>
            <div><h3 className="text-lg font-bold">تسجيل مرتجع / بضاعة تالفة</h3><p className="text-xs text-stone-500">إثبات مسؤولية التالف وتسوية الدين أو المخزون</p></div>
          </div>
          <button onClick={onClose} className="p-2 min-w-11 min-h-11 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400" aria-label="إغلاق"><X className="w-5 h-5" /></button>
        </div>

        {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2"><AlertCircle className="w-4 h-4" /><span>{error}</span></div>}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold mb-1">الموزع *</label><select value={distributorId} onChange={(e) => setDistributorId(e.target.value)} className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold">{distributors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className="block font-bold mb-1">تاريخ الإشعار *</label><input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm" /></div>
          </div>

          {fin && <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between"><span>دين الموزع الحالي</span><strong className="font-mono text-amber-600">{formatYER(Math.max(0, fin.currentDebt))}</strong></div>}

          <div className="space-y-2">
            <div className="flex items-center justify-between font-bold"><span>أصناف المرتجع / التالف:</span><button type="button" onClick={addItemRow} className="min-h-11 px-3 text-amber-600 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" /><span>إضافة صنف</span></button></div>
            {items.map((row, idx) => {
              const prod = products.find((p) => p.id === row.productId);
              const historicalPrice = historicalPriceByProduct.get(row.productId);
              return <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 rounded-2xl grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6"><select value={row.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} className="w-full px-2 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="mt-1 text-[10px] text-stone-500">السعر التاريخي: {historicalPrice ? formatYER(historicalPrice) : 'غير متاح'}</div></div>
                <div className="col-span-2"><input type="number" min="1" value={row.quantity} onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))} className="w-full px-2 py-2 bg-white dark:bg-stone-800 border rounded-xl text-xs font-mono font-bold" /></div>
                <div className="col-span-3"><label className="min-h-11 flex items-center gap-1.5 text-[11px] cursor-pointer"><input type="checkbox" checked={row.restock} onChange={(e) => updateItem(idx, 'restock', e.target.checked)} /><span>إعادة للمخزون؟</span></label></div>
                <div className="col-span-1 text-center">{items.length > 1 && <button type="button" onClick={() => removeItemRow(idx)} className="p-2 min-w-11 min-h-11 text-rose-500" aria-label="حذف الصنف"><Trash2 className="w-4 h-4" /></button>}</div>
              </div>;
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className="block font-bold mb-1">نوع المعالجة المالية</label><select value={settlementType} onChange={(e) => setSettlementType(e.target.value as 'REDUCE_DEBT' | 'CASH_REFUND')} className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm"><option value="REDUCE_DEBT">خصم من رصيد دين الموزع</option><option value="CASH_REFUND">رد المبلغ نقدًا للموزع</option></select></div>
            <div><label className="block font-bold mb-1">سبب المرتجع / التلف</label><input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="مثال: انتهاء صلاحية أو كسر نقل" className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm" /></div>
          </div>

          <div className={`p-3 rounded-xl flex items-center justify-between font-bold ${debtExceeded ? 'bg-rose-500/10 text-rose-700' : 'bg-stone-100 dark:bg-stone-800'}`}><span>إجمالي قيمة المرتجع:</span><span className="font-mono text-sm">{formatYER(totalValue)}</span></div>
          {settlementType === 'CASH_REFUND' && <div className="text-[11px] text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">الرد النقدي لا يخصم من دين الموزع؛ سجله فقط إذا تم رد المبلغ فعلياً.</div>}
          {debtExceeded && <div className="text-[11px] text-rose-600 font-semibold">قيمة المرتجع تتجاوز الدين الحالي، لذلك لا يمكن استخدامه لخفض الدين.</div>}

          <div className="flex items-center gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 min-h-11 py-3 rounded-xl border font-semibold">إلغاء</button>
            <button type="submit" disabled={!pricing.valid || debtExceeded || (settlementType === 'REDUCE_DEBT' && (!fin || fin.currentDebt <= 0))} className="flex-1 min-h-11 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 font-bold">تأكيد وحفظ المرتجع</button>
          </div>
        </form>
      </div>
    </div>
  );
};