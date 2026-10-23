import React, { useState, useEffect } from 'react';
import { storage, formatYER } from '../services/storage';
import { Purchase } from '../types';
import {
  ShoppingBag,
  Plus,
  Trash2,
  X,
  AlertCircle,
  Building2,
  CheckCircle2,
  Calendar,
  Search
} from 'lucide-react';

interface PurchasesViewProps {
  isOpenModal: boolean;
  onCloseModal: () => void;
  onSuccessPurchase?: () => void;
}

interface PurchaseItemRow {
  rawMaterialId: string;
  quantity: number;
  unitCostYER: number;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  isOpenModal,
  onCloseModal,
  onSuccessPurchase
}) => {
  const [supplierId, setSupplierId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<PurchaseItemRow[]>([
    { rawMaterialId: '', quantity: 1, unitCostYER: 0 }
  ]);
  const [cashPaidYER, setCashPaidYER] = useState<number>(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const suppliers = storage.getSuppliers().filter((s) => s.active);
  const rawMaterials = storage.getRawMaterials().filter((r) => r.active);
  const purchases = storage.getPurchases().filter((p) =>
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.displayNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (isOpenModal) {
      if (suppliers.length > 0 && !supplierId) {
        setSupplierId(suppliers[0].id);
      }
      setDate(new Date().toISOString().slice(0, 10));
      const firstRaw = rawMaterials[0];
      setItems([
        {
          rawMaterialId: firstRaw ? firstRaw.id : '',
          quantity: 5,
          unitCostYER: firstRaw ? firstRaw.averageCostPerUnitYER : 0
        }
      ]);
      setCashPaidYER(0);
      setNote('');
      setError('');
    }
  }, [isOpenModal]);

  const addItemRow = () => {
    const firstRaw = rawMaterials[0];
    setItems((prev) => [
      ...prev,
      {
        rawMaterialId: firstRaw ? firstRaw.id : '',
        quantity: 5,
        unitCostYER: firstRaw ? firstRaw.averageCostPerUnitYER : 0
      }
    ]);
  };

  const removeItemRow = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof PurchaseItemRow, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      if (field === 'rawMaterialId') {
        const raw = rawMaterials.find((r) => r.id === val);
        if (raw) {
          next[idx].unitCostYER = raw.averageCostPerUnitYER;
        }
      }
      return next;
    });
  };

  const grossTotal = items.reduce((sum, it) => sum + (it.quantity || 0) * (it.unitCostYER || 0), 0);
  const creditTotal = Math.max(0, grossTotal - (cashPaidYER || 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setError('يرجى اختيار المورد');
      return;
    }
    for (const it of items) {
      if (!it.rawMaterialId || it.quantity <= 0 || it.unitCostYER <= 0) {
        setError('يرجى التحقق من الأصناف والكميات وأسعار التكلفة');
        return;
      }
    }

    const res = storage.createPurchase({
      supplierId,
      date,
      items: items.map((it) => ({
        rawMaterialId: it.rawMaterialId,
        quantity: Number(it.quantity),
        unitCostYER: Number(it.unitCostYER)
      })),
      cashPaidYER: Number(cashPaidYER) || 0,
      note: note.trim()
    });

    if (!res.success) {
      setError(res.error || 'حدث خطأ أثناء حفظ فاتورة الشراء');
      return;
    }

    onCloseModal();
    if (onSuccessPurchase) onSuccessPurchase();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              سجل فواتير توريد المواد الخام
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              مشتريات الدقيق والسمن والسكر وتحديث المخزون ومتوسط التكلفة
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            // opens modal
          }}
          className="hidden" // triggered by prop
        />
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute right-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث برقم الفاتورة أو اسم المورد..."
          className="w-full pr-11 pl-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Purchases List */}
      <div className="space-y-3">
        {purchases.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-sm bg-white dark:bg-stone-900 border rounded-3xl">
            لا توجد فواتير شراء مسجلة بعد. اضغط "فاتورة شراء مواد خام" لتسجيل أول فاتورة.
          </div>
        ) : (
          purchases.map((pur) => (
            <div
              key={pur.id}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                    {pur.displayNumber}
                  </span>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {pur.supplierName}
                  </span>
                  <span className="text-xs text-stone-400">({pur.date})</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span>
                    الإجمالي: <strong className="text-stone-900 dark:text-stone-100 text-sm">{formatYER(pur.totalYER)}</strong>
                  </span>
                  {pur.cashPaidYER > 0 && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      مسدد نقدًا: {formatYER(pur.cashPaidYER)}
                    </span>
                  )}
                  {pur.creditYER > 0 && (
                    <span className="text-purple-600 dark:text-purple-400 font-bold">
                      آجل: {formatYER(pur.creditYER)}
                    </span>
                  )}
                </div>
              </div>

              {/* Items in this purchase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {pur.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700">
                    <div className="font-semibold text-stone-800 dark:text-stone-200">{it.rawMaterialName}</div>
                    <div className="text-[11px] text-stone-500 flex items-center justify-between mt-1 font-mono">
                      <span>{it.quantity} {it.unit} × {formatYER(it.unitCostYER)}</span>
                      <span className="font-bold text-stone-700 dark:text-stone-300">{formatYER(it.lineTotalYER)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {pur.note && (
                <div className="text-[11px] text-stone-500 pt-1">
                  ملاحظة: {pur.note}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: تسجيل فاتورة شراء مواد خام جديدة */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">فاتورة توريد مواد خام جديدة</h3>
                  <p className="text-xs text-stone-500">إضافة المواد لمخزون المستودع وتحديث متوسط التكلفة وحساب المورد</p>
                </div>
              </div>
              <button onClick={onCloseModal} className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400">
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
                  <label className="block font-bold mb-1">المورد *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
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
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Items rows */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span>المواد الخام المشتراة:</span>
                  <button type="button" onClick={addItemRow} className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مادة أخرى</span>
                  </button>
                </div>

                {items.map((row, idx) => {
                  const raw = rawMaterials.find((r) => r.id === row.rawMaterialId);
                  const lineTotal = (row.quantity || 0) * (row.unitCostYER || 0);

                  return (
                    <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/60 border rounded-2xl grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select
                          value={row.rawMaterialId}
                          onChange={(e) => updateItem(idx, 'rawMaterialId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                        >
                          {rawMaterials.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-stone-400 mb-0.5">الكمية</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={row.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white dark:bg-stone-800 border rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-stone-400 mb-0.5">سعر الوحدة (ر.ي)</label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          value={row.unitCostYER}
                          onChange={(e) => updateItem(idx, 'unitCostYER', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white dark:bg-stone-800 border rounded-xl text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="col-span-2 text-left">
                        <label className="block text-[10px] text-stone-400 mb-0.5">الإجمالي</label>
                        <span className="font-mono font-bold text-xs text-purple-600 dark:text-purple-400">
                          {formatYER(lineTotal)}
                        </span>
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

              {/* Payment details */}
              <div className="p-3.5 bg-stone-50 dark:bg-stone-800/50 rounded-2xl border space-y-2">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>إجمالي الفاتورة:</span>
                  <span className="font-mono text-base">{formatYER(grossTotal)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                  <div>
                    <label className="block font-bold mb-1 text-emerald-600">المبلغ المدفوع نقدًا (ر.ي)</label>
                    <input
                      type="number"
                      min="0"
                      max={grossTotal}
                      step="500"
                      value={cashPaidYER}
                      onChange={(e) => setCashPaidYER(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold text-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-purple-600">المتبقي آجل (لحساب المورد)</label>
                    <div className="px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-sm font-mono font-bold text-purple-600">
                      {formatYER(creditTotal)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">ملاحظات التوريد</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="رقم سند التوريد أو بيانات الشحنة"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onCloseModal} className="flex-1 py-2.5 rounded-xl border font-semibold">
                  إلغاء
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold">
                  اعتماد وحفظ الفاتورة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
