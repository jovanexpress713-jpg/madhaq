import React, { useState } from 'react';
import { storage, formatYER, formatNumber } from '../services/storage';
import { Recipe, ProductionBatch } from '../types';
import {
  UtensilsCrossed,
  Sparkles,
  Plus,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  Scale,
  Boxes,
  Package,
  Calendar,
  Flame
} from 'lucide-react';

interface ProductionViewProps {
  isOpenBatchModal: boolean;
  onCloseBatchModal: () => void;
  onSuccessBatch?: () => void;
}

interface RecipeItemRow {
  rawMaterialId: string;
  quantity: number;
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  isOpenBatchModal,
  onCloseBatchModal,
  onSuccessBatch
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'RECIPES' | 'BATCHES'>('RECIPES');
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  // فورم الوصفة
  const [productId, setProductId] = useState('');
  const [recipeName, setRecipeName] = useState('');
  const [outputQty, setOutputQty] = useState<number>(50);
  const [recipeItems, setRecipeItems] = useState<RecipeItemRow[]>([
    { rawMaterialId: '', quantity: 1 }
  ]);
  const [recipeNotes, setRecipeNotes] = useState('');
  const [recipeError, setRecipeError] = useState('');

  // فورم دفعة الإنتاج
  const [batchRecipeId, setBatchRecipeId] = useState('');
  const [batchMultiplier, setBatchMultiplier] = useState<number>(1);
  const [batchProducedQty, setBatchProducedQty] = useState<number>(50);
  const [batchDamagedQty, setBatchDamagedQty] = useState<number>(0);
  const [batchDate, setBatchDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchNote, setBatchNote] = useState('');
  const [batchError, setBatchError] = useState('');

  const recipes = storage.getRecipes();
  const batches = storage.getProductionBatches();
  const products = storage.getProducts().filter((p) => p.active);
  const rawMaterials = storage.getRawMaterials().filter((r) => r.active);

  // عند فتح دفعة الإنتاج
  React.useEffect(() => {
    if (isOpenBatchModal) {
      if (recipes.length > 0 && !batchRecipeId) {
        setBatchRecipeId(recipes[0].id);
        setBatchMultiplier(1);
        setBatchProducedQty(recipes[0].outputQty);
      }
      setBatchDamagedQty(0);
      setBatchDate(new Date().toISOString().slice(0, 10));
      setBatchNote('');
      setBatchError('');
    }
  }, [isOpenBatchModal, recipes]);

  const selectedRecipeForBatch = recipes.find((r) => r.id === batchRecipeId);

  const openAddRecipe = () => {
    setEditingRecipe(null);
    const firstP = products[0];
    setProductId(firstP ? firstP.id : '');
    setRecipeName(firstP ? `معيار خلطة ${firstP.name}` : '');
    setOutputQty(50);
    const firstR = rawMaterials[0];
    setRecipeItems([{ rawMaterialId: firstR ? firstR.id : '', quantity: 1 }]);
    setRecipeNotes('');
    setRecipeError('');
    setShowAddRecipeModal(true);
  };

  const openEditRecipe = (r: Recipe) => {
    setEditingRecipe(r);
    setProductId(r.productId);
    setRecipeName(r.name);
    setOutputQty(r.outputQty);
    setRecipeItems(r.items.map((it) => ({ rawMaterialId: it.rawMaterialId, quantity: it.quantity })));
    setRecipeNotes(r.notes || '');
    setRecipeError('');
    setShowAddRecipeModal(true);
  };

  const addRecipeItemRow = () => {
    const firstR = rawMaterials[0];
    setRecipeItems((prev) => [
      ...prev,
      { rawMaterialId: firstR ? firstR.id : '', quantity: 1 }
    ]);
  };

  const removeRecipeItemRow = (idx: number) => {
    setRecipeItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRecipeItem = (idx: number, field: keyof RecipeItemRow, val: any) => {
    setRecipeItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleSaveRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      setRecipeError('يرجى اختيار المنتج النهائي');
      return;
    }
    if (!recipeName.trim()) {
      setRecipeError('يرجى كتابة اسم الوصفة أو المعيار');
      return;
    }
    if (outputQty <= 0) {
      setRecipeError('يرجى تحديد كمية ناتج صحيحة');
      return;
    }
    if (recipeItems.length === 0) {
      setRecipeError('يرجى إضافة مادة خام واحدة على الأقل');
      return;
    }

    const prod = products.find((p) => p.id === productId);
    const items = recipeItems.map((it) => {
      const raw = rawMaterials.find((r) => r.id === it.rawMaterialId);
      return {
        rawMaterialId: it.rawMaterialId,
        rawMaterialName: raw ? raw.name : '',
        quantity: Number(it.quantity),
        unit: raw ? raw.unit : ''
      };
    });

    storage.saveRecipe({
      id: editingRecipe ? editingRecipe.id : undefined,
      productId,
      productName: prod ? prod.name : '',
      name: recipeName.trim(),
      outputQty: Number(outputQty),
      items,
      active: true,
      notes: recipeNotes.trim()
    });

    setShowAddRecipeModal(false);
  };

  const handleExecuteBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchRecipeId) {
      setBatchError('يرجى اختيار الوصفة');
      return;
    }

    const res = storage.executeProductionBatch({
      recipeId: batchRecipeId,
      date: batchDate,
      multiplier: Number(batchMultiplier) || 1,
      producedQty: Number(batchProducedQty) || 0,
      damagedQty: Number(batchDamagedQty) || 0,
      note: batchNote.trim()
    });

    if (!res.success) {
      setBatchError(res.error || 'حدث خطأ أثناء تنفيذ دفعة الإنتاج');
      return;
    }

    onCloseBatchModal();
    if (onSuccessBatch) onSuccessBatch();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              الوصفات ودفعات الإنتاج
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              معايير الخلطات، استهلاك الخامات، تسجيل التالف، وحساب تكلفة القطعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'RECIPES' ? (
            <button
              onClick={openAddRecipe}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وصفة جديدة</span>
            </button>
          ) : (
            <button
              onClick={() => {
                // Trigger batch modal
                if (recipes.length > 0) {
                  setBatchRecipeId(recipes[0].id);
                  setBatchMultiplier(1);
                  setBatchProducedQty(recipes[0].outputQty);
                }
              }}
              className="hidden" // Handled through props
            />
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          onClick={() => setActiveSubTab('RECIPES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'RECIPES'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>معايير الوصفات ({recipes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BATCHES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition ${
            activeSubTab === 'BATCHES'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>سجل دفعات الإنتاج والخبز ({batches.length})</span>
        </button>
      </div>

      {/* SubTab 1: Recipes list */}
      {activeSubTab === 'RECIPES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.length === 0 ? (
            <div className="col-span-full py-12 text-center text-stone-400 text-sm bg-white dark:bg-stone-900 border rounded-3xl">
              لا توجد وصفات مسجلة بعد. اضغط "إضافة وصفة جديدة" لإدخال مكونات الحلويات.
            </div>
          ) : (
            recipes.map((rec) => {
              const totalCost = storage.calculateRecipeCost(rec);
              const unitCost = rec.outputQty > 0 ? Math.round(totalCost / rec.outputQty) : 0;

              return (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-amber-400/50 transition flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {rec.name}
                        </h3>
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                          المنتج: {rec.productName} (الناتج القياسي: {rec.outputQty} حبة/صحن)
                        </span>
                      </div>

                      <button
                        onClick={() => openEditRecipe(rec)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                      >
                        <Trash2 className="w-4 h-4 hidden" />
                        <span className="text-xs text-stone-500 underline">تعديل</span>
                      </button>
                    </div>

                    {/* Ingredients list */}
                    <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border border-stone-100 dark:border-stone-700 space-y-1.5 text-xs">
                      <span className="font-bold text-[11px] text-stone-500 block">المواد الخام المطلوبة للمعايير:</span>
                      {rec.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-stone-700 dark:text-stone-300">
                          <span>• {it.rawMaterialName}</span>
                          <span className="font-mono font-semibold">{it.quantity} {it.unit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cost breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                      <div>
                        <span className="text-[10px] text-stone-500 block font-sans">تكلفة خامات الطبخة:</span>
                        <span className="font-bold text-stone-900 dark:text-stone-100">{formatYER(totalCost)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block font-sans">تكلفة القطعة التقديرية:</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">{formatYER(unitCost)}</span>
                      </div>
                    </div>

                    {rec.notes && (
                      <p className="text-[11px] text-stone-400 leading-relaxed italic">
                        ملاحظات: {rec.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SubTab 2: Batches list */}
      {activeSubTab === 'BATCHES' && (
        <div className="space-y-3">
          {batches.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm bg-white dark:bg-stone-900 border rounded-3xl">
              لا توجد دفعات إنتاج مسجلة بعد.
            </div>
          ) : (
            batches.map((batch) => (
              <div
                key={batch.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                      {batch.displayNumber}
                    </span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">
                      {batch.productName}
                    </span>
                    <span className="text-xs text-stone-400">({batch.date})</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      تم إنتاجه للمخزن: {batch.producedQty}
                    </span>
                    {batch.damagedQty > 0 && (
                      <span className="text-rose-500 font-semibold">
                        تالف/هدر: {batch.damagedQty}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-800/50 p-3 rounded-2xl text-xs font-mono">
                  <div>
                    <span className="text-stone-400 block font-sans text-[11px]">الوصفة المعتمدة:</span>
                    <span className="font-bold font-sans text-stone-700 dark:text-stone-300">{batch.recipeName}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-sans text-[11px]">إجمالي تكلفة الخامات:</span>
                    <span className="font-bold text-stone-900 dark:text-stone-100">{formatYER(batch.totalMaterialCostYER)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-sans text-[11px]">تكلفة القطعة المحسوبة:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{formatYER(batch.unitCostYER)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block font-sans text-[11px]">المخطط vs الفعلي:</span>
                    <span>{batch.plannedQty} / {batch.producedQty}</span>
                  </div>
                </div>

                {batch.note && (
                  <div className="text-[11px] text-stone-500">
                    ملاحظة: {batch.note}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal: تنفيذ دفعة إنتاج */}
      {isOpenBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">تسجيل طبخة / دفعة إنتاج جديدة</h3>
                  <p className="text-xs text-stone-500">خصم المواد الخام تلقائيًا وإضافة الحلوى للمخزون</p>
                </div>
              </div>
              <button onClick={onCloseBatchModal} className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {batchError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{batchError}</span>
              </div>
            )}

            <form onSubmit={handleExecuteBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1">الوصفة المطلوب إنتاجها *</label>
                <select
                  value={batchRecipeId}
                  onChange={(e) => {
                    setBatchRecipeId(e.target.value);
                    const r = recipes.find((rec) => rec.id === e.target.value);
                    if (r) {
                      setBatchProducedQty(r.outputQty * batchMultiplier);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.productName})
                    </option>
                  ))}
                </select>
              </div>

              {selectedRecipeForBatch && (
                <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl border space-y-1.5">
                  <span className="font-bold text-stone-600 dark:text-stone-300 block">
                    المواد التي ستخصم من المستودع (مضروبة في {batchMultiplier}):
                  </span>
                  {selectedRecipeForBatch.items.map((it, idx) => {
                    const raw = rawMaterials.find((r) => r.id === it.rawMaterialId);
                    const needed = it.quantity * batchMultiplier;
                    const isDeficit = raw ? raw.stockQty < needed : false;

                    return (
                      <div key={idx} className={`flex items-center justify-between text-[11px] ${
                        isDeficit ? 'text-rose-600 font-bold' : 'text-stone-600 dark:text-stone-300'
                      }`}>
                        <span>• {it.rawMaterialName}: {needed} {it.unit}</span>
                        <span>المتوفر بالمستودع: {raw ? raw.stockQty : 0} {it.unit}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">مضاعف الطبخة (عدد المرات)</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={batchMultiplier}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setBatchMultiplier(m);
                      if (selectedRecipeForBatch) {
                        setBatchProducedQty(Math.round(selectedRecipeForBatch.outputQty * m));
                      }
                    }}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">تاريخ الإنتاج</label>
                  <input
                    type="date"
                    required
                    value={batchDate}
                    onChange={(e) => setBatchDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-emerald-600 dark:text-emerald-400">
                    الناتج الفعلي السليم (يدخل المخزون) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={batchProducedQty}
                    onChange={(e) => setBatchProducedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-emerald-500/50 rounded-xl text-sm font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-rose-500">
                    الكمية التالفة / الهدر
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={batchDamagedQty}
                    onChange={(e) => setBatchDamagedQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-stone-800 border border-rose-500/40 rounded-xl text-sm font-mono font-bold text-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">ملاحظات الوردية أو الخبز</label>
                <input
                  type="text"
                  value={batchNote}
                  onChange={(e) => setBatchNote(e.target.value)}
                  placeholder="مثال: وردية الصباح، فرن رقم 1"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={onCloseBatchModal} className="flex-1 py-2.5 rounded-xl border font-semibold">
                  إلغاء
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold">
                  اعتماد وتنفيذ الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: إضافة أو تعديل وصفة بمكونات متعددة */}
      {showAddRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-base">
                {editingRecipe ? 'تعديل الوصفة' : 'إنشاء وصفة جديدة بمكونات متعددة'}
              </h3>
              <button onClick={() => setShowAddRecipeModal(false)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {recipeError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold">
                {recipeError}
              </div>
            )}

            <form onSubmit={handleSaveRecipe} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">المنتج النهائي *</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">كمية الناتج المعياري *</label>
                  <input
                    type="number"
                    min="1"
                    value={outputQty}
                    onChange={(e) => setOutputQty(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">اسم الوصفة أو المعيار *</label>
                <input
                  type="text"
                  required
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="مثال: معيار صينية كنافة 20 صحن"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Multi-ingredient lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-bold">
                  <span>المكونات والخامات المطلوبة:</span>
                  <button type="button" onClick={addRecipeItemRow} className="text-amber-600 hover:underline flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مادة خام</span>
                  </button>
                </div>

                {recipeItems.map((row, idx) => {
                  const raw = rawMaterials.find((r) => r.id === row.rawMaterialId);

                  return (
                    <div key={idx} className="p-2.5 bg-stone-50 dark:bg-stone-800/60 border rounded-2xl grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <select
                          value={row.rawMaterialId}
                          onChange={(e) => updateRecipeItem(idx, 'rawMaterialId', e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                        >
                          {rawMaterials.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name} ({r.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="number"
                          step="0.05"
                          min="0.01"
                          value={row.quantity}
                          onChange={(e) => updateRecipeItem(idx, 'quantity', Number(e.target.value))}
                          placeholder="الكمية"
                          className="w-full px-2 py-1.5 bg-white dark:bg-stone-800 border rounded-xl text-xs font-mono font-bold text-center"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        {recipeItems.length > 1 && (
                          <button type="button" onClick={() => removeRecipeItemRow(idx)} className="text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block font-bold mb-1">تعليمات الخبز والتصنيع</label>
                <textarea
                  rows={2}
                  value={recipeNotes}
                  onChange={(e) => setRecipeNotes(e.target.value)}
                  placeholder="درجة حرارة الفرن، وقت الخبز، نوع الشيرة..."
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddRecipeModal(false)} className="flex-1 py-2.5 rounded-xl border font-semibold">
                  إلغاء
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold">
                  حفظ الوصفة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
