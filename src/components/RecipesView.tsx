import React, { useMemo, useState } from 'react';
import { Calculator, ChefHat, Plus, Trash2, Save, Ruler, Circle, Square } from 'lucide-react';
import { storage, formatYER } from '../services/storage';

type PanShape = 'RECTANGLE' | 'ROUND';
type PanUnit = 'INCH' | 'CM';
type Ingredient = { rawMaterialId: string; quantityGrams: number };
type PanSize = {
  id: string;
  name: string;
  shape: PanShape;
  unit: PanUnit;
  length: number;
  width: number;
  diameter: number;
  depth: number;
  fillGrams: number;
  sellingPriceYER: number;
};
type Recipe = {
  id: string;
  name: string;
  category: string;
  baseYieldGrams: number;
  ingredients: Ingredient[];
  pans: PanSize[];
  laborCostYER: number;
  packagingCostYER: number;
  otherCostYER: number;
  notes: string;
  updatedAt: number;
};

const KEY = 'madhaq_recipes_v1';
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const readRecipes = (): Recipe[] => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const unitFactor = (unit: string) => {
  const u = unit.toLowerCase().replace(/\s/g, '');
  if (u.includes('كجم') || u.includes('كيلو') || u.includes('kg')) return 1000;
  if (u.includes('جرام') || u.includes('غرام') || u === 'g' || u.includes('gram')) return 1;
  if (u.includes('لتر') || u === 'l' || u.includes('liter')) return 1000;
  if (u.includes('مل') || u.includes('ml')) return 1;
  return 1;
};

const rawCostPerGram = (raw: any) => Number(raw?.averageCostPerUnitYER || 0) / unitFactor(String(raw?.unit || 'جرام'));
const inchToCm = (v: number) => v * 2.54;
const dimensionText = (p: PanSize) => p.shape === 'ROUND'
  ? `قطر ${p.diameter} ${p.unit === 'INCH' ? 'إنش' : 'سم'} × عمق ${p.depth} ${p.unit === 'INCH' ? 'إنش' : 'سم'}`
  : `${p.length} × ${p.width} ${p.unit === 'INCH' ? 'إنش' : 'سم'} × عمق ${p.depth} ${p.unit === 'INCH' ? 'إنش' : 'سم'}`;

const rectanglePresets = [
  [8, 4], [8, 8], [9, 5], [9, 9], [10, 4], [10, 5], [10, 6], [10, 10],
  [11, 7], [12, 4], [12, 6], [12, 8], [12, 10], [12, 12], [13, 9], [14, 4],
  [14, 6], [14, 8], [14, 10], [14, 12], [15, 10], [16, 4], [16, 6], [16, 8],
  [16, 10], [16, 12], [18, 6], [18, 8], [18, 10], [18, 12], [18, 14], [20, 8],
  [20, 10], [20, 12], [20, 14], [20, 16], [22, 10], [22, 12], [22, 14], [24, 10],
  [24, 12], [24, 14], [24, 16], [24, 18], [26, 12], [26, 14], [26, 16], [28, 14],
  [28, 16], [30, 20], [30, 22], [30, 24], [32, 22], [32, 24], [35, 25], [40, 30],
  [45, 30], [50, 30], [50, 40], [60, 40]
] as const;

const roundPresets = [8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 26, 28, 30, 32, 35, 38, 40, 45, 50, 55, 60] as const;

const makePresetPans = (): PanSize[] => [
  ...rectanglePresets.map(([length, width]) => ({
    id: `preset-r-${length}x${width}`,
    name: `${length} × ${width}`,
    shape: 'RECTANGLE' as const,
    unit: 'INCH' as const,
    length,
    width,
    diameter: 0,
    depth: 2,
    fillGrams: 0,
    sellingPriceYER: 0
  })),
  ...roundPresets.map((diameter) => ({
    id: `preset-c-${diameter}`,
    name: `دائري قطر ${diameter}`,
    shape: 'ROUND' as const,
    unit: 'INCH' as const,
    length: 0,
    width: 0,
    diameter,
    depth: 2,
    fillGrams: 0,
    sellingPriceYER: 0
  }))
];

const defaultPan = (): PanSize => ({
  id: uid(), name: 'مقاس جديد', shape: 'RECTANGLE', unit: 'INCH', length: 8, width: 4,
  diameter: 0, depth: 2, fillGrams: 1000, sellingPriceYER: 0
});

export const RecipesView: React.FC = () => {
  const rawMaterials = storage.getRawMaterials().filter((r) => r.active !== false);
  const [recipes, setRecipes] = useState<Recipe[]>(readRecipes);
  const [selectedId, setSelectedId] = useState<string | null>(recipes[0]?.id || null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogFilter, setCatalogFilter] = useState<'ALL' | PanShape>('ALL');
  const [calcPan, setCalcPan] = useState<PanSize>(defaultPan());

  const emptyRecipe = (): Recipe => ({
    id: uid(), name: '', category: 'حلويات', baseYieldGrams: 1000, ingredients: [], pans: [],
    laborCostYER: 0, packagingCostYER: 0, otherCostYER: 0, notes: '', updatedAt: Date.now()
  });
  const [draft, setDraft] = useState<Recipe>(emptyRecipe());

  const selected = recipes.find((r) => r.id === selectedId) || null;
  const persist = (next: Recipe[]) => {
    setRecipes(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const baseIngredientCost = (recipe: Recipe) => recipe.ingredients.reduce((sum, item) => {
    const raw = rawMaterials.find((r) => r.id === item.rawMaterialId);
    return sum + item.quantityGrams * rawCostPerGram(raw);
  }, 0);

  const panResult = (recipe: Recipe, pan: PanSize) => {
    const scale = recipe.baseYieldGrams > 0 && pan.fillGrams > 0 ? pan.fillGrams / recipe.baseYieldGrams : 0;
    const materialCost = baseIngredientCost(recipe) * scale;
    const fixed = recipe.laborCostYER + recipe.packagingCostYER + recipe.otherCostYER;
    const totalCost = materialCost + fixed;
    const profit = pan.sellingPriceYER - totalCost;
    return { scale, materialCost, totalCost, profit, margin: pan.sellingPriceYER > 0 ? profit / pan.sellingPriceYER : 0 };
  };

  const catalog = useMemo(() => {
    const all = makePresetPans();
    return catalogFilter === 'ALL' ? all : all.filter((p) => p.shape === catalogFilter);
  }, [catalogFilter]);

  const saveDraft = () => {
    if (!draft.name.trim() || draft.baseYieldGrams <= 0 || draft.ingredients.length === 0) return;
    persist([...recipes.filter((r) => r.id !== draft.id), { ...draft, name: draft.name.trim(), updatedAt: Date.now() }]);
    setSelectedId(draft.id);
    setShowEditor(false);
  };

  const openNew = () => {
    const recipe = emptyRecipe();
    setDraft(recipe);
    setShowEditor(true);
  };

  const openEdit = (recipe: Recipe) => {
    setDraft(JSON.parse(JSON.stringify(recipe)) as Recipe);
    setShowEditor(true);
  };

  const addIngredient = () => setDraft({
    ...draft,
    ingredients: [...draft.ingredients, { rawMaterialId: rawMaterials[0]?.id || '', quantityGrams: 100 }]
  });

  const addPan = (source?: PanSize) => {
    const pan = source ? { ...source, id: uid(), name: source.name, fillGrams: 1000, sellingPriceYER: 0 } : defaultPan();
    setDraft({ ...draft, pans: [...draft.pans, pan] });
  };

  const addCatalogToDraft = (source: PanSize) => {
    addPan(source);
    setShowCatalog(false);
  };

  const selectedBaseCost = selected ? baseIngredientCost(selected) : 0;

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><ChefHat className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black">الوصفات والتكلفة والمقاسات</h2>
              <p className="text-xs text-stone-500">من صينية ٨ × ٤ إلى المقاسات الكبيرة — مستطيل أو دائري، مع إضافة أي مقاس جديد يدويًا.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCatalog(true)} className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-amber-300 text-amber-700 dark:text-amber-300 font-bold text-sm"><Ruler className="w-4 h-4" />دليل المقاسات</button>
            <button onClick={openNew} className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-sm"><Plus className="w-4 h-4" />وصفة جديدة</button>
            {selected && <button onClick={() => { setCalcPan(selected.pans[0] ? { ...selected.pans[0] } : defaultPan()); setShowCalculator(true); }} className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm"><Calculator className="w-4 h-4" />حاسبة المقاس</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 space-y-2">
          <div className="text-xs font-bold text-stone-500 px-2 pb-2">الوصفات المسجلة ({recipes.length})</div>
          {recipes.length === 0 && <div className="text-xs text-stone-400 p-4 text-center">لم تضف وصفات بعد.</div>}
          {recipes.map((recipe) => (
            <button key={recipe.id} onClick={() => setSelectedId(recipe.id)} className={`w-full text-right p-3 rounded-2xl border ${selectedId === recipe.id ? 'border-amber-500 bg-amber-500/10' : 'border-stone-100 dark:border-stone-800'}`}>
              <div className="font-bold text-sm">{recipe.name || 'وصفة بدون اسم'}</div>
              <div className="text-[11px] text-stone-500">{recipe.category} • إنتاج أساسي {recipe.baseYieldGrams.toLocaleString()} جم</div>
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5">
          {!selected ? <div className="py-16 text-center text-stone-400">اختر وصفة أو أنشئ وصفة جديدة.</div> : <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div><div className="text-xs text-amber-600 font-bold">{selected.category}</div><h3 className="text-2xl font-black">{selected.name}</h3><p className="text-xs text-stone-500">الوصفة الأساسية تنتج {selected.baseYieldGrams.toLocaleString()} جم</p></div>
              <button onClick={() => openEdit(selected)} className="touch-target px-4 py-2 rounded-xl border text-sm font-bold">تعديل الوصفة</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat label="تكلفة المواد الأساسية" value={formatYER(selectedBaseCost)} />
              <Stat label="العمالة" value={formatYER(selected.laborCostYER)} />
              <Stat label="التغليف والمصاريف" value={formatYER(selected.packagingCostYER + selected.otherCostYER)} />
              <Stat label="إجمالي التكلفة" value={formatYER(selectedBaseCost + selected.laborCostYER + selected.packagingCostYER + selected.otherCostYER)} />
            </div>

            <div>
              <h4 className="font-bold text-sm mb-2">مكونات الوصفة</h4>
              <div className="space-y-2">
                {selected.ingredients.map((item, index) => {
                  const raw: any = rawMaterials.find((r) => r.id === item.rawMaterialId);
                  return <div key={`${item.rawMaterialId}-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3 text-xs">
                    <span className="font-semibold">{raw?.name || 'مادة غير موجودة'}</span>
                    <span className="font-mono">{item.quantityGrams.toLocaleString()} جم × {formatYER(rawCostPerGram(raw))}/جم = <b>{formatYER(item.quantityGrams * rawCostPerGram(raw))}</b></span>
                  </div>;
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><h4 className="font-bold text-sm">مقاسات الصواني المحفوظة</h4><button onClick={() => openEdit(selected)} className="text-xs text-amber-600 font-bold">+ إضافة مقاس</button></div>
              {selected.pans.length === 0 ? <div className="rounded-2xl border border-dashed p-5 text-center text-xs text-stone-400">لا توجد مقاسات محفوظة. افتح تعديل الوصفة واختر من دليل المقاسات أو أضف مقاسًا يدويًا.</div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selected.pans.map((pan) => {
                  const result = panResult(selected, pan);
                  return <div key={pan.id} className="border rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><span className="text-amber-600">{pan.shape === 'ROUND' ? <Circle className="w-4 h-4" /> : <Square className="w-4 h-4" />}</span><b>{pan.name}</b></div><span className="text-[11px] text-stone-500">{dimensionText(pan)}</span></div>
                    <div className="grid grid-cols-2 gap-2 text-xs"><span>تعبئة: <b>{pan.fillGrams.toLocaleString()} جم</b></span><span>التكلفة: <b>{formatYER(result.totalCost)}</b></span><span>سعر البيع: <b>{formatYER(pan.sellingPriceYER)}</b></span><span className={result.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>الربح: <b>{formatYER(result.profit)}</b></span></div>
                    <div className="text-[11px] text-stone-500">معامل الوصفة ×{result.scale.toFixed(3)} • هامش {(result.margin * 100).toFixed(1)}%</div>
                  </div>;
                })}
              </div>}
            </div>
          </div>}
        </div>
      </div>

      {showEditor && <Modal title={draft.name ? 'تعديل الوصفة' : 'وصفة جديدة'} onClose={() => setShowEditor(false)}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Field label="اسم الوصفة"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="input" placeholder="مثال: كنافة بالقشطة" /></Field><Field label="التصنيف"><select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="input"><option>حلويات</option><option>معجنات</option><option>مخبوزات</option><option>كيك</option><option>أخرى</option></select></Field><Field label="إنتاج الوصفة الأساسي (جم)"><input type="number" min="1" value={draft.baseYieldGrams} onChange={(e) => setDraft({ ...draft, baseYieldGrams: Number(e.target.value) })} className="input" /></Field></div>

          <div className="flex items-center justify-between"><h4 className="font-bold">المكونات</h4><button onClick={addIngredient} className="text-xs font-bold text-amber-600">+ إضافة مادة</button></div>
          <div className="space-y-2">{draft.ingredients.map((item, index) => <div key={index} className="grid grid-cols-[1fr_120px_40px] gap-2"><select value={item.rawMaterialId} onChange={(e) => { const next = [...draft.ingredients]; next[index] = { ...next[index], rawMaterialId: e.target.value }; setDraft({ ...draft, ingredients: next }); }} className="input">{rawMaterials.map((raw) => <option key={raw.id} value={raw.id}>{raw.name} ({raw.unit})</option>)}</select><input type="number" min="0" step="0.1" value={item.quantityGrams} onChange={(e) => { const next = [...draft.ingredients]; next[index] = { ...next[index], quantityGrams: Number(e.target.value) }; setDraft({ ...draft, ingredients: next }); }} className="input" placeholder="جرام" /><button onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((_, j) => j !== index) })} className="rounded-xl border text-rose-600"><Trash2 className="w-4 h-4 mx-auto" /></button></div>)}</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Field label="عمالة"><input type="number" min="0" value={draft.laborCostYER} onChange={(e) => setDraft({ ...draft, laborCostYER: Number(e.target.value) })} className="input" /></Field><Field label="تغليف"><input type="number" min="0" value={draft.packagingCostYER} onChange={(e) => setDraft({ ...draft, packagingCostYER: Number(e.target.value) })} className="input" /></Field><Field label="مصاريف أخرى"><input type="number" min="0" value={draft.otherCostYER} onChange={(e) => setDraft({ ...draft, otherCostYER: Number(e.target.value) })} className="input" /></Field></div>

          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-3"><div className="flex items-center justify-between"><div><h4 className="font-bold">مقاسات الصواني</h4><p className="text-[11px] text-stone-500">ابدأ من ٨ × ٤ أو اختر أي مقاس من الدليل، ثم أدخل وزن التعبئة وسعر البيع.</p></div><button onClick={() => setShowCatalog(true)} className="text-xs font-bold text-amber-700 dark:text-amber-300">فتح الدليل</button></div>
            <div className="space-y-3">{draft.pans.map((pan, index) => <PanEditor key={pan.id} pan={pan} onChange={(next) => { const pans = [...draft.pans]; pans[index] = next; setDraft({ ...draft, pans }); }} onDelete={() => setDraft({ ...draft, pans: draft.pans.filter((_, j) => j !== index) })} />)}</div>
            <button onClick={() => addPan()} className="w-full border border-dashed rounded-2xl py-3 text-xs font-bold text-amber-700 dark:text-amber-300">+ إضافة مقاس يدوي</button>
          </div>

          <Field label="ملاحظات"><textarea value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} className="input min-h-20" placeholder="ملاحظات الوصفة أو طريقة التعبئة..." /></Field>
          <div className="flex justify-end gap-2"><button onClick={() => setShowEditor(false)} className="px-4 py-2.5 rounded-xl border font-bold text-sm">إلغاء</button><button disabled={!draft.name.trim() || draft.baseYieldGrams <= 0 || draft.ingredients.length === 0} onClick={saveDraft} className="touch-target flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-black text-sm disabled:opacity-40"><Save className="w-4 h-4" />حفظ الوصفة</button></div>
        </div>
      </Modal>}

      {showCatalog && <Modal title="دليل مقاسات الصواني" onClose={() => setShowCatalog(false)} wide>
        <div className="space-y-4">
          <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 p-4 text-xs leading-6"><b>المقاسات ليست محدودة.</b> الدليل يحتوي مقاسات بداية من ٨ × ٤، ومقاسات كبيرة حتى ٦٠ × ٤٠، ومقاسات دائرية حتى قطر ٦٠. ويمكنك دائمًا إضافة أي طول وعرض أو قطر وعمق جديد يدويًا.</div>
          <div className="flex flex-wrap gap-2"><FilterButton active={catalogFilter === 'ALL'} onClick={() => setCatalogFilter('ALL')}>الكل</FilterButton><FilterButton active={catalogFilter === 'RECTANGLE'} onClick={() => setCatalogFilter('RECTANGLE')}>مستطيل</FilterButton><FilterButton active={catalogFilter === 'ROUND'} onClick={() => setCatalogFilter('ROUND')}>دائري</FilterButton></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-[55vh] overflow-y-auto pr-1">{catalog.map((pan) => <button key={pan.id} onClick={() => { if (showEditor) addCatalogToDraft(pan); else { setCalcPan({ ...pan, fillGrams: 1000, sellingPriceYER: 0 }); setShowCatalog(false); setShowCalculator(true); } }} className="text-right p-3 rounded-2xl border hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition"><div className="flex items-center gap-1 text-amber-600 text-xs font-bold">{pan.shape === 'ROUND' ? <Circle className="w-3 h-3" /> : <Square className="w-3 h-3" />}{pan.shape === 'ROUND' ? 'دائري' : 'مستطيل'}</div><div className="font-black text-sm mt-1">{pan.name}</div><div className="text-[10px] text-stone-500">عمق افتراضي {pan.depth} إنش</div></button>)}</div>
          <div className="border-t pt-4 flex justify-end"><button onClick={() => { setShowCatalog(false); setCalcPan(defaultPan()); setShowCalculator(true); }} className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold"><Plus className="w-4 h-4" />إنشاء مقاس جديد يدويًا</button></div>
        </div>
      </Modal>}

      {showCalculator && selected && <Modal title="حاسبة تكلفة أي مقاس" onClose={() => setShowCalculator(false)}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2"><FilterButton active={calcPan.shape === 'RECTANGLE'} onClick={() => setCalcPan({ ...calcPan, shape: 'RECTANGLE', length: calcPan.length || 8, width: calcPan.width || 4, diameter: 0 })}>مستطيل</FilterButton><FilterButton active={calcPan.shape === 'ROUND'} onClick={() => setCalcPan({ ...calcPan, shape: 'ROUND', diameter: calcPan.diameter || 10, length: 0, width: 0 })}>دائري</FilterButton></div>
          <div className="grid grid-cols-2 gap-3"><Field label="الوحدة"><select value={calcPan.unit} onChange={(e) => setCalcPan({ ...calcPan, unit: e.target.value as PanUnit })} className="input"><option value="INCH">إنش</option><option value="CM">سم</option></select></Field><Field label="العمق"><input type="number" min="0.1" value={calcPan.depth} onChange={(e) => setCalcPan({ ...calcPan, depth: Number(e.target.value) })} className="input" /></Field></div>
          {calcPan.shape === 'RECTANGLE' ? <div className="grid grid-cols-2 gap-3"><Field label="العرض"><input type="number" min="0.1" value={calcPan.length} onChange={(e) => setCalcPan({ ...calcPan, length: Number(e.target.value) })} className="input" /></Field><Field label="العمق/العرض الآخر"><input type="number" min="0.1" value={calcPan.width} onChange={(e) => setCalcPan({ ...calcPan, width: Number(e.target.value) })} className="input" /></Field></div> : <Field label="القطر"><input type="number" min="0.1" value={calcPan.diameter} onChange={(e) => setCalcPan({ ...calcPan, diameter: Number(e.target.value) })} className="input" /></Field>}
          <div className="grid grid-cols-2 gap-3"><Field label="وزن تعبئة الصينية (جم)"><input type="number" min="1" value={calcPan.fillGrams} onChange={(e) => setCalcPan({ ...calcPan, fillGrams: Number(e.target.value) })} className="input" /></Field><Field label="سعر البيع"><input type="number" min="0" value={calcPan.sellingPriceYER} onChange={(e) => setCalcPan({ ...calcPan, sellingPriceYER: Number(e.target.value) })} className="input" /></Field></div>
          {(() => { const result = panResult(selected, calcPan); return <div className="rounded-3xl bg-stone-950 text-white p-5 space-y-3"><div className="text-xs text-amber-300">{selected.name} • {dimensionText(calcPan)}</div><div className="grid grid-cols-2 gap-3"><Stat label="معامل التكبير" value={`×${result.scale.toFixed(3)}`} dark /><Stat label="تكلفة المواد" value={formatYER(result.materialCost)} dark /><Stat label="إجمالي التكلفة" value={formatYER(result.totalCost)} dark /><Stat label="الربح المتوقع" value={formatYER(result.profit)} dark /></div><div className="text-xs text-stone-300">النظام يحسب كمية كل مكوّن = كمية الوصفة الأساسية × معامل المقاس، ثم يضيف العمالة والتغليف والمصاريف. تغيير سعر المواد لاحقًا لا يغيّر السجلات التاريخية للإنتاج.</div></div>; })()}
          <div className="flex justify-end"><button onClick={() => setShowCalculator(false)} className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-black text-sm">تم</button></div>
        </div>
      </Modal>}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"><div className={`${wide ? 'max-w-6xl' : 'max-w-3xl'} mx-auto bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 shadow-2xl`}><div className="flex items-center justify-between mb-5"><h3 className="text-xl font-black">{title}</h3><button onClick={onClose} className="text-stone-400 text-xl">✕</button></div>{children}</div></div>;

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <label className="block"><span className="block text-[11px] font-bold text-stone-500 mb-1.5">{label}</span>{children}</label>;
const FilterButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => <button onClick={onClick} className={`px-3 py-2.5 rounded-xl border text-xs font-bold ${active ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-stone-200 dark:border-stone-700'}`}>{children}</button>;
const Stat: React.FC<{ label: string; value: string; dark?: boolean }> = ({ label, value, dark }) => <div className={`rounded-xl p-3 ${dark ? 'bg-white/5 border border-white/10' : 'bg-stone-50 dark:bg-stone-800/60'}`}><div className={`text-[10px] ${dark ? 'text-stone-400' : 'text-stone-500'}`}>{label}</div><div className="font-black text-sm mt-1">{value}</div></div>;

const PanEditor: React.FC<{ pan: PanSize; onChange: (pan: PanSize) => void; onDelete: () => void }> = ({ pan, onChange, onDelete }) => <div className="rounded-2xl border bg-white dark:bg-stone-900 p-3 space-y-3"><div className="grid grid-cols-2 sm:grid-cols-4 gap-2"><Field label="اسم المقاس"><input className="input" value={pan.name} onChange={(e) => onChange({ ...pan, name: e.target.value })} /></Field><Field label="النوع"><select className="input" value={pan.shape} onChange={(e) => onChange({ ...pan, shape: e.target.value as PanShape })}><option value="RECTANGLE">مستطيل</option><option value="ROUND">دائري</option></select></Field><Field label="الوحدة"><select className="input" value={pan.unit} onChange={(e) => onChange({ ...pan, unit: e.target.value as PanUnit })}><option value="INCH">إنش</option><option value="CM">سم</option></select></Field><Field label="العمق"><input className="input" type="number" min="0.1" value={pan.depth} onChange={(e) => onChange({ ...pan, depth: Number(e.target.value) })} /></Field></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{pan.shape === 'ROUND' ? <Field label="القطر"><input className="input" type="number" min="0.1" value={pan.diameter} onChange={(e) => onChange({ ...pan, diameter: Number(e.target.value) })} /></Field> : <><Field label="الطول / العرض"><input className="input" type="number" min="0.1" value={pan.length} onChange={(e) => onChange({ ...pan, length: Number(e.target.value) })} /></Field><Field label="العرض / العمق"><input className="input" type="number" min="0.1" value={pan.width} onChange={(e) => onChange({ ...pan, width: Number(e.target.value) })} /></Field></>}<Field label="وزن التعبئة (جم)"><input className="input" type="number" min="1" value={pan.fillGrams} onChange={(e) => onChange({ ...pan, fillGrams: Number(e.target.value) })} /></Field><Field label="سعر البيع"><input className="input" type="number" min="0" value={pan.sellingPriceYER} onChange={(e) => onChange({ ...pan, sellingPriceYER: Number(e.target.value) })} /></Field></div><div className="flex justify-between items-center"><span className="text-[11px] text-stone-500">{dimensionText(pan)}</span><button onClick={onDelete} className="touch-target rounded-xl border text-rose-600 px-3"><Trash2 className="w-4 h-4" /></button></div></div>;
