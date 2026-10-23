import React, { useState } from 'react';
import { storage, formatYER } from '../services/storage';
import { Product } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  X,
  TrendingUp,
  Tag,
  Boxes
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // فورم
  const [name, setName] = useState('');
  const [category, setCategory] = useState('حلويات شرقية');
  const [unit, setUnit] = useState('صحن');
  const [factoryPriceYER, setFactoryPriceYER] = useState<number>(2000);
  const [distributorPriceYER, setDistributorPriceYER] = useState<number>(2800);
  const [stockQty, setStockQty] = useState<number>(50);
  const [minimumQty, setMinimumQty] = useState<number>(15);
  const [error, setError] = useState('');

  // تعديل رصيد سريع
  const [adjustingProd, setAdjustingProd] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);

  const products = storage.getProducts().filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const categories = Array.from(new Set(storage.getProducts().map((p) => p.category).filter(Boolean)));

  const openAdd = () => {
    setEditingProd(null);
    setName('');
    setCategory('حلويات شرقية');
    setUnit('صحن');
    setFactoryPriceYER(2000);
    setDistributorPriceYER(2800);
    setStockQty(50);
    setMinimumQty(15);
    setError('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditingProd(p);
    setName(p.name);
    setCategory(p.category);
    setUnit(p.unit);
    setFactoryPriceYER(p.factoryPriceYER);
    setDistributorPriceYER(p.distributorPriceYER);
    setStockQty(p.stockQty);
    setMinimumQty(p.minimumQty);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم الصنف');
      return;
    }

    storage.saveProduct({
      id: editingProd ? editingProd.id : undefined,
      name: name.trim(),
      category: category.trim(),
      unit: unit.trim(),
      factoryPriceYER: Number(factoryPriceYER) || 0,
      distributorPriceYER: Number(distributorPriceYER) || 0,
      stockQty: Number(stockQty) || 0,
      minimumQty: Number(minimumQty) || 0,
      active: true
    });

    setShowModal(false);
  };

  const handleAdjustStock = () => {
    if (adjustingProd && adjustDelta !== 0) {
      storage.updateProductStock(adjustingProd.id, adjustDelta);
      setAdjustingProd(null);
      setAdjustDelta(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              قائمة أصناف الحلويات والمنتجات
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              الأسعار، أسعار التوزيع، مراقبة المخزون الفعلي، وتنبيهات النواقص
            </p>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة صنف جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute right-4 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث باسم صنف الحلوى..."
            className="w-full pr-11 pl-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1 scrollbar-none">
          <button
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              categoryFilter === 'ALL'
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
            }`}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === c
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-sm">
            لا توجد أصناف مطابقة للبحث.
          </div>
        ) : (
          products.map((prod) => {
            const isLowStock = prod.stockQty <= prod.minimumQty;
            const margin = prod.distributorPriceYER - prod.factoryPriceYER;
            const marginPct =
              prod.factoryPriceYER > 0
                ? Math.round((margin / prod.factoryPriceYER) * 100)
                : 0;

            return (
              <div
                key={prod.id}
                className={`bg-white dark:bg-stone-900 border rounded-3xl p-5 shadow-sm space-y-4 hover:border-amber-400/50 transition flex flex-col justify-between ${
                  isLowStock
                    ? 'border-amber-400/60 dark:border-amber-500/40'
                    : 'border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {prod.name}
                        </h3>
                        {isLowStock && (
                          <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            <span>مخزون منخفض</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400 inline-block mt-0.5">
                        {prod.category} • الوحدة: {prod.unit}
                      </span>
                    </div>

                    <button
                      onClick={() => openEdit(prod)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock & Prices Stats */}
                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-100 dark:border-stone-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">الرصيد بالمخزن:</span>
                      <span className={`font-mono font-bold text-lg ${
                        isLowStock ? 'text-amber-600 dark:text-amber-400 font-black' : 'text-stone-900 dark:text-stone-100'
                      }`}>
                        {prod.stockQty} <span className="text-xs font-normal text-stone-400">{prod.unit}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-[11px]">
                      <div>
                        <span className="text-stone-400 block">سعر التوزيع:</span>
                        <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                          {formatYER(prod.distributorPriceYER)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">تكلفة المعمل:</span>
                        <span className="font-mono text-stone-600 dark:text-stone-300">
                          {formatYER(prod.factoryPriceYER)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock Quick Adjustment */}
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800 text-xs">
                  <span className="text-stone-400 text-[11px]">حد التنبيه: {prod.minimumQty} {prod.unit}</span>
                  <button
                    onClick={() => {
                      setAdjustingProd(prod);
                      setAdjustDelta(0);
                    }}
                    className="text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>تعديل المخزون</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: تعديل رصيد المخزون اليدوي */}
      {adjustingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
            <h3 className="font-bold text-base">تعديل مخزون: {adjustingProd.name}</h3>
            <p className="text-xs text-stone-500">
              المخزون الحالي المسجل: {adjustingProd.stockQty} {adjustingProd.unit}
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold">مقدار التعديل (إضافة + أو خصم -):</label>
              <input
                type="number"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
                placeholder="مثال: +10 أو -5"
                className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold text-center"
              />
              <span className="block text-center text-xs text-stone-400">
                الرصيد بعد التعديل سيكون: {Math.max(0, adjustingProd.stockQty + adjustDelta)} {adjustingProd.unit}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setAdjustingProd(null)}
                className="flex-1 py-2.5 rounded-xl border text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                onClick={handleAdjustStock}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold"
              >
                حفظ التعديل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: إضافة أو تعديل منتج */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold">
                {editingProd ? 'تعديل بيانات الصنف' : 'إضافة صنف حلوى جديد'}
              </h3>
              <p className="text-xs text-stone-500">
                تسجيل صنف المعمل، وحدة البيع، والأسعار
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم الصنف *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: بقلاوة فستق حلبي فاخرة"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">التصنيف</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="حلويات شرقية، نواشف..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">وحدة البيع</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="صحن، كيلو، علبة..."
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">سعر الموزع (ر.ي) *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={distributorPriceYER}
                    onChange={(e) => setDistributorPriceYER(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">تكلفة المعمل التقديرية (ر.ي)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={factoryPriceYER}
                    onChange={(e) => setFactoryPriceYER(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">المخزون الحالي المتوفر</label>
                  <input
                    type="number"
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
                    min="0"
                    value={minimumQty}
                    onChange={(e) => setMinimumQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono"
                  />
                </div>
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
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold"
                >
                  حفظ الصنف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
