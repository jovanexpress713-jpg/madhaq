import React, { useState } from 'react';
import { storage, formatYER } from '../services/storage';
import { Expense } from '../types';
import {
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Search,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState('ديزل وغاز للأفران');
  const [amountYER, setAmountYER] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [beneficiary, setBeneficiary] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const cashSummary = storage.getCashboxSummary();
  const expenses = storage.getExpenses();

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amountYER);
    if (!num || num <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }

    const res = storage.createExpense({
      category,
      amountYER: num,
      date,
      beneficiary: beneficiary.trim(),
      note: note.trim()
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء حفظ المصروف');
      return;
    }

    setShowAddModal(false);
    setAmountYER('');
    setBeneficiary('');
    setNote('');
    setError('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              المصروفات التشغيلية وحركة الصندوق
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              متابعة نفقات المعمل اليومية ورصيد السيولة النقدية المتوفرة
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setShowAddModal(true);
            setAmountYER('');
            setBeneficiary('');
            setNote('');
            setError('');
          }}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل سند صرف / مصروف</span>
        </button>
      </div>

      {/* Cashbox Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        {/* التدفقات الداخلة */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-sans font-bold">
            <span>مقبوضات الصندوق (داخل)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatYER(cashSummary.totalCashIn)}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 space-y-0.5 font-sans">
            <div>• مبيعات نقدية: {formatYER(cashSummary.distCash)}</div>
            <div>• سندات تحصيل نقدية: {formatYER(cashSummary.colCash)}</div>
          </div>
        </div>

        {/* التدفقات الخارجة */}
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 font-sans font-bold">
            <span>مدفوعات الصندوق (خارج)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatYER(cashSummary.totalCashOut)}
          </div>
          <div className="text-[11px] text-stone-500 dark:text-stone-400 space-y-0.5 font-sans">
            <div>• مشتريات نقدية: {formatYER(cashSummary.purCash)}</div>
            <div>• سداد موردين نقدًا: {formatYER(cashSummary.suppCash)}</div>
            <div>• مصروفات المعمل: {formatYER(cashSummary.expCash)}</div>
          </div>
        </div>

        {/* صافي السيولة المتبقية */}
        <div className="bg-stone-900 text-white border border-amber-600/30 p-5 rounded-3xl space-y-2">
          <div className="flex items-center justify-between text-xs text-amber-400 font-sans font-bold">
            <span>صافي رصيد الصندوق المتوفر</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            cashSummary.netCashBalance >= 0 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {formatYER(cashSummary.netCashBalance)}
          </div>
          <div className="text-[11px] text-stone-400 font-sans">
            السيولة النقدية الفعلية داخل الخزينة
          </div>
        </div>
      </div>

      {/* Expenses History List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
          سجل المصروفات والنفقات التشغيلية
        </h3>

        {expenses.length === 0 ? (
          <div className="py-8 text-center text-stone-400 text-xs">
            لا توجد مصروفات مسجلة بعد.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {expenses.map((exp) => (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                    <span className="font-mono text-rose-600 text-[11px]">{exp.displayNumber}</span>
                    <span>{exp.category}</span>
                    {exp.beneficiary && (
                      <span className="text-stone-400 text-[11px]">({exp.beneficiary})</span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400 flex items-center gap-2">
                    <span>{exp.date}</span>
                    {exp.note && <span>• {exp.note}</span>}
                  </div>
                </div>

                <div className="font-mono font-bold text-sm text-rose-600 dark:text-rose-400">
                  {formatYER(exp.amountYER)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base">تسجيل سند صرف مصروف</h3>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">بند المصروف *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                >
                  <option value="ديزل وغاز للأفران">ديزل وغاز للأفران</option>
                  <option value="إيجار المعمل">إيجار المعمل</option>
                  <option value="كهرباء ومياه">كهرباء ومياه</option>
                  <option value="أجور عمالة يومية وإضافية">أجور عمالة يومية وإضافية</option>
                  <option value="رواتب الموظفين">رواتب الموظفين</option>
                  <option value="صيانة أفران ومعدات">صيانة أفران ومعدات</option>
                  <option value="أدوات ونظافة ومعقمات">أدوات ونظافة ومعقمات</option>
                  <option value="مواصلات ونقل وبترول">مواصلات ونقل وبترول</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">المبلغ المصروف (ر.ي) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="500"
                    value={amountYER}
                    onChange={(e) => setAmountYER(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="مثال: 25000"
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">تاريخ الصرف *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">المستفيد / المدفوع له</label>
                <input
                  type="text"
                  value={beneficiary}
                  onChange={(e) => setBeneficiary(e.target.value)}
                  placeholder="مثال: سائق النقل، صاحب محطة الغاز..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">تفاصيل وملاحظات</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="بيانات الفاتورة أو سبب الصرف"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl border font-semibold">
                  إلغاء
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">
                  قيد سند الصرف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
