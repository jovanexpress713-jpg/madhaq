import React, { useState } from 'react';
import { storage, formatYER, formatNumber } from '../services/storage';
import { RawMaterial } from '../types';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  X,
  Coins,
  Scale
} from 'lucide-react';

export const RawMaterialsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingRaw, setEditingRaw] = useState<RawMaterial | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('كيلو');
  const [stockQty, setStockQty] = useState<number>(10);
  const [minimumQty, setMinimumQty] = useState<number>(5);
  const [averageCostPerUnitYER, setAverageCostPerUnitYER] = useState<number>(5000);
  const [error, setError] = useState('');

  const [adjustingRaw, setAdjustingRaw] = useState<RawMaterial | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);

  const rawMaterials = storage.getRawMaterials().filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRawValuation = rawMaterials.reduce(
    (sum, r) => sum + r.stockQty * r.averageCostPerUnitYER,
    0
  );

  const openAdd = () => {
    setEditingRaw(null);
    setName('');
    setUnit('كيلو');
    setStockQty(10);
    setMinimumQty(5);
    setAverageCostPerUnitYER(5000);
    setError('');
    setShowModal(true);
  };

  const openEdit = (r: RawMaterial) => {
    setEditingRaw(r);
    setName(r.name);
    setUnit(r.unit);
    setStockQty(r.stockQty);
    setMinimumQty(r.minimumQty);
    setAverageCostPerUnitYER(r.averageCostPerUnitYER);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم المادة الخام');
      return;
    }

    storage.saveRawMaterial({
      id: editingRaw ? editingRaw.id : undefined,
      name: name.trim(),
      unit: unit.trim(),
      stockQty: Number(stockQty) || 0,
      minimumQty: Number(minimumQty) || 0,
      averageCostPerUnitYER: Number(averageCostPerUnitYER) || 0,
      active: true
    });

    setShowModal(false);
  };

  const handleAdjustStock = () => {
    if (adjustingRaw && adjustDelta !== 0) {
      storage.updateRawMaterialStock(adjustingRaw.id, adjustDelta);
      setAdjustingRaw(null);
      setAdjustDelta(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              المواد الخام ومستودع المعمل
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              متابعة أرصدة الدقيق والسمن والفستق والسكر، ومتوسط التكلفة المرجح
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block text-left bg-stone-50 dark:bg-stone-800 px-3.5 py-2 rounded-2xl border border-stone-200 dark:border-stone-700">
            <span className="text-[10px] text-stone-400 block">إجمالي قيمة المواد الخام:</span>
            <span className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">
              {formatYER(totalRawValuation)}
            </span>
          </div>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مادة خام</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute right-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم المادة الخام (دقيق، سمن، فستق...)"
          className="w-full pr-11 pl-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Raw Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rawMaterials.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-sm">
            لا توجد مواد خام مطابقة للبحث.
          </div>
        ) : (
          rawMaterials.map((raw) => {
            const isLow = raw.stockQty <= raw.minimumQty;
            const itemValuation = raw.stockQty * raw.averageCostPerUnitYER;

            return (
              <div
                key={raw.id}
                className={`bg-white dark:bg-stone-900 border rounded-3xl p-5 shadow-sm space-y-4 hover:border-emerald-400/50 transition flex flex-col justify-between ${
                  isLow ? 'border-amber-400/60 dark:border-amber-500/40' : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {raw.name}
                        </h3>
                        {isLow && (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            <span>نقص بالمستودع</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 inline-block mt-0.5">
                        وحدة القياس: {raw.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => openEdit(raw)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-100 dark:border-stone-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">الكمية بالمستودع:</span>
                      <span className={`font-mono font-bold text-lg ${
                        isLow ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-stone-900 dark:text-stone-100'
                      }`}>
                        {formatNumber(raw.stockQty, 2)} <span className="text-xs font-normal text-stone-400">{raw.unit}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-[11px]">
                      <div>
                        <span className="text-stone-400 block">متوسط التكلفة:</span>
                        <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatYER(raw.averageCostPerUnitYER)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">إجمالي القيمة:</span>
                        <span className="font-mono text-stone-600 dark:text-stone-300">
                          {formatYER(itemValuation)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 text-xs">
                  <span className="text-stone-400 text-[11px]">حد التنبيه: {raw.minimumQty} {raw.unit}</span>
                  <button
                    onClick={() => {
                      setAdjustingRaw(raw);
                      setAdjustDelta(0);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    تعديل الجرد
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Adjust Raw Material Stock Modal */}
      {adjustingRaw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base">تعديل جرد: {adjustingRaw.name}</h3>
            <p className="text-xs text-stone-500">
              الرصيد الحالي بالمستودع: {adjustingRaw.stockQty} {adjustingRaw.unit}
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold">مقدار التعديل (إضافة + أو خصم -):</label>
              <input
                type="number"
                step="0.1"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold text-center"
              />
              <span className="block text-center text-xs text-stone-400">
                الرصيد بعد التعديل سيكون: {Math.max(0, +(adjustingRaw.stockQty + adjustDelta).toFixed(2))} {adjustingRaw.unit}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAdjustingRaw(null)}
                className="flex-1 py-2.5 rounded-xl border text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Raw Material Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 left-5 text-stone-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold">
                {editingRaw ? 'تعديل بيانات المادة الخام' : 'إضافة مادة خام جديدة'}
              </h3>
              <p className="text-xs text-stone-500">
                تعريف المادة ووحدة قياسها ومتوسط التكلفة الأولي
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم المادة الخام *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: فستق حلبي أخضر نخب أول"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">وحدة القياس *</label>
                <input
                  type="text"
                  required
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="كيلو، كيس (50كجم)، لتر، علبة..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">الكمية الحالية المتوفرة</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={stockQty}
                    onChange={(e) => setStockQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">حد التنبيه عند النقص</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={minimumQty}
                    onChange={(e) => setMinimumQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">متوسط التكلفة للوحدة (ر.ي) *</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={averageCostPerUnitYER}
                  onChange={(e) => setAverageCostPerUnitYER(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold text-emerald-600"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  يتحدث تلقائيًا مع كل فاتورة شراء جديدة وفق التكلفة المرجحة
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  حفظ المادة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
