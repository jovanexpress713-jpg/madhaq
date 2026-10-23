import React, { useState, useEffect } from 'react';
import { storage, formatYER } from '../services/storage';
import { CollectionEntry } from '../types';
import { Receipt, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDistributorId?: string;
  onSuccess: (collection: CollectionEntry) => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  isOpen,
  onClose,
  initialDistributorId,
  onSuccess
}) => {
  const [distributorId, setDistributorId] = useState('');
  const [amountYER, setAmountYER] = useState<number | ''>('');
  const [method, setMethod] = useState<'CASH' | 'TRANSFER' | 'CHEQUE'>('CASH');
  const [reference, setReference] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const distributors = storage.getDistributors().filter((d) => d.active);

  useEffect(() => {
    if (isOpen) {
      if (initialDistributorId) {
        setDistributorId(initialDistributorId);
      } else if (distributors.length > 0 && !distributorId) {
        setDistributorId(distributors[0].id);
      }
      setAmountYER('');
      setMethod('CASH');
      setReference('');
      setDate(new Date().toISOString().slice(0, 10));
      setNote('');
      setError('');
    }
  }, [isOpen, initialDistributorId]);

  if (!isOpen) return null;

  const selectedDistributor = distributors.find((d) => d.id === distributorId);
  const fin = selectedDistributor ? storage.getDistributorFinancials(selectedDistributor.id) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!distributorId) {
      setError('يرجى اختيار الموزع');
      return;
    }
    const numAmount = Number(amountYER);
    if (!numAmount || numAmount <= 0) {
      setError('يرجى إدخال مبلغ تحصيل صحيح أكبر من صفر');
      return;
    }

    const res = storage.createCollection({
      distributorId,
      amountYER: numAmount,
      method,
      date,
      reference: reference.trim(),
      note: note.trim()
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء حفظ سند التحصيل');
      return;
    }

    if (res.collection) {
      onSuccess(res.collection);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                تسجيل سند قبض تحصيل
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                سداد دفعة نقدية أو حوالة وتخفيض دين الموزع فورياً
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
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold mb-1">الموزع / العميل *</label>
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

          {fin && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
              <span className="text-stone-600 dark:text-stone-300">رصيد الدين المستحق حالياً:</span>
              <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                {formatYER(fin.currentDebt)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1">المبلغ المحصل (ر.ي) *</label>
              <input
                type="number"
                required
                min="1"
                step="500"
                value={amountYER}
                onChange={(e) => setAmountYER(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: 50000"
                className="w-full px-3.5 py-2.5 bg-white dark:bg-stone-800 border border-emerald-500/50 rounded-xl text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold mb-1">تاريخ التحصيل *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">طريقة القبض</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CASH', label: 'نقدًا كاش' },
                { id: 'TRANSFER', label: 'حوالة / صرافة' },
                { id: 'CHEQUE', label: 'شيك بنكي' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    method === m.id
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold mb-1">الرقم المرجعي (رقم الحوالة / السند اليدوي)</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="مثال: حوالة النجم 981240"
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1">ملاحظات إضافية</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="مثال: سداد دفعة عن أسبوع الأحد"
              className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

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
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg text-sm active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ وتثبيت السند</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
