import React, { useMemo, useState } from 'react';
import { BookOpen, Search, ChefHat, Calculator, PackageCheck, Clock3, TrendingUp, AlertTriangle } from 'lucide-react';
import { RECIPE_LIBRARY, RecipeLibraryItem } from '../data/recipeLibrary';
import { RECIPE_OPERATION_META, DEFAULT_RECIPE_OPERATION_META } from '../data/recipeOperations';
import { storage } from '../services/storage';

const normalize = (value: string) => value.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');

const getCostPerGram = (material: any): number | null => {
  const cost = Number(material?.averageCostPerUnitYER ?? 0);
  if (!Number.isFinite(cost) || cost <= 0) return null;
  const unit = normalize(String(material?.unit ?? material?.unitName ?? ''));
  if (unit.includes('كجم') || unit.includes('كيلو') || unit === 'kg') return cost / 1000;
  if (unit.includes('جرام') || unit.includes('غرام') || unit === 'g' || unit === 'gm') return cost;
  if (unit.includes('لتر') || unit === 'liter' || unit === 'l') return cost / 1000;
  if (unit.includes('مل') || unit === 'ml') return cost;
  return cost;
};

const findMaterial = (name: string, materials: any[]) => {
  const target = normalize(name);
  return materials.find((m) => normalize(String(m.name ?? '')) === target)
    ?? materials.find((m) => normalize(String(m.name ?? '')).includes(target) || target.includes(normalize(String(m.name ?? ''))));
};

const money = (value: number) => `${Math.round(value).toLocaleString()} ر.ي`;

export const RecipeLibraryView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const [selected, setSelected] = useState<RecipeLibraryItem | null>(null);
  const [batchGrams, setBatchGrams] = useState(10000);
  const [sellingPrice, setSellingPrice] = useState(0);
  const materials = useMemo(() => storage.getRawMaterials(), []);
  const categories = ['الكل','حلويات','معجنات','مخبوزات','كيك','مشروبات'];
  const items = useMemo(() => RECIPE_LIBRARY.filter((r) => (category === 'الكل' || r.category === category) && r.name.includes(query.trim())), [query, category]);

  const meta = selected ? (RECIPE_OPERATION_META[selected.id] ?? DEFAULT_RECIPE_OPERATION_META) : null;
  const scale = selected ? Math.max(0, batchGrams) / selected.baseYieldGrams : 0;
  const costing = selected ? selected.ingredients.map((ingredient) => {
    const material = findMaterial(ingredient.name, materials as any[]);
    const unitCost = material ? getCostPerGram(material) : null;
    const grams = ingredient.grams * scale;
    return { ...ingredient, grams, material, unitCost, cost: unitCost === null ? null : grams * unitCost };
  }) : [];
  const matchedCost = costing.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const missingCount = costing.filter((row) => row.cost === null).length;
  const totalCost = matchedCost + (selected ? (selected.laborCostYER + selected.packagingCostYER + selected.otherCostYER) * scale : 0);
  const profit = sellingPrice - totalCost;
  const margin = sellingPrice > 0 ? profit / sellingPrice : 0;

  const openRecipe = (recipe: RecipeLibraryItem) => {
    const recipeMeta = RECIPE_OPERATION_META[recipe.id] ?? DEFAULT_RECIPE_OPERATION_META;
    setSelected(recipe);
    setBatchGrams(recipeMeta.recommendedBatchGrams);
    setSellingPrice(0);
  };

  return <div dir="rtl" className="space-y-5 pb-10">
    <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div><div><h2 className="text-xl font-black">مكتبة الوصفات الاقتصادية الذكية</h2><p className="text-xs text-stone-500">حدد كمية الإنتاج وسعر البيع، والنظام يحسب المواد والتكلفة والربح من أسعار مخزون المعمل.</p></div></div>
        <div className="relative w-full lg:w-80"><Search className="absolute right-3 top-3 w-4 h-4 text-stone-400" /><input value={query} onChange={e=>setQuery(e.target.value)} className="input pr-9 w-full" placeholder="ابحث عن كنافة، كيك، مشروب..." /></div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${category===c?'bg-amber-500 text-stone-950 border-amber-500':'border-stone-200 dark:border-stone-700'}`}>{c}</button>)}</div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{items.map(recipe=>{
      const recipeMeta = RECIPE_OPERATION_META[recipe.id] ?? DEFAULT_RECIPE_OPERATION_META;
      return <article key={recipe.id} className="bg-white dark:bg-stone-900 border rounded-3xl overflow-hidden flex flex-col">
        <img src={recipeMeta.imageUrl} alt={recipeMeta.imageAlt} loading="lazy" className="w-full h-44 object-cover" />
        <div className="p-5 space-y-4 flex-1">
          <div className="flex items-start justify-between gap-3"><div><div className="text-[11px] text-amber-600 font-bold">{recipe.category}</div><h3 className="font-black text-lg">{recipe.name}</h3></div><ChefHat className="w-5 h-5 text-amber-500 shrink-0" /></div>
          <div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3"><span className="text-stone-500">دفعة الأساس</span><b className="block mt-1">{recipe.baseYieldGrams.toLocaleString()} جم</b></div><div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3"><span className="text-stone-500">صلاحية مرجعية</span><b className="block mt-1">{recipeMeta.shelfLifeDays} يوم</b></div></div>
          <div className="flex items-center gap-2 text-xs text-stone-500"><Clock3 className="w-4 h-4" /> {recipeMeta.storage}</div>
          <button onClick={()=>openRecipe(recipe)} className="touch-target w-full rounded-2xl bg-stone-950 text-white dark:bg-white dark:text-stone-950 px-4 py-3 font-black text-sm flex items-center justify-center gap-2"><Calculator className="w-4 h-4" /> احسب دفعة وربح هذه الوصفة</button>
        </div>
      </article>;
    })}</div>

    {items.length===0 && <div className="text-center text-stone-400 py-12">لا توجد وصفات بهذا البحث.</div>}

    {selected && meta && <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onClick={()=>setSelected(null)}>
      <div className="max-w-5xl mx-auto bg-white dark:bg-stone-950 rounded-3xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="grid lg:grid-cols-5">
          <div className="lg:col-span-2 relative min-h-56 lg:min-h-full"><img src={meta.imageUrl} alt={meta.imageAlt} className="absolute inset-0 w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-5 right-5 left-5 text-white"><div className="text-xs font-bold text-amber-300">{selected.category}</div><h2 className="text-2xl font-black">{selected.name}</h2><div className="text-xs mt-2">الصلاحية المرجعية: {meta.shelfLifeDays} يوم</div></div></div>
          <div className="lg:col-span-3 p-5 sm:p-7 space-y-5">
            <div className="flex items-center justify-between gap-3"><div><h3 className="text-xl font-black">حاسبة التشغيل والربح</h3><p className="text-xs text-stone-500">غيّر الكمية كما تريد، وستتغير كل المواد تلقائياً.</p></div><button onClick={()=>setSelected(null)} className="touch-target rounded-xl border px-3">إغلاق</button></div>
            <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">كمية الإنتاج (جم)<input className="input mt-2 w-full" type="number" min="1" value={batchGrams} onChange={e=>setBatchGrams(Math.max(1, Number(e.target.value)||1))} /></label><label className="text-xs font-bold">سعر البيع للدفعة (ر.ي)<input className="input mt-2 w-full" type="number" min="0" value={sellingPrice} onChange={e=>setSellingPrice(Math.max(0, Number(e.target.value)||0))} /></label></div>
            <div className="grid grid-cols-3 gap-2"><div className="rounded-2xl bg-stone-100 dark:bg-stone-900 p-3"><span className="text-[10px] text-stone-500">معامل التكبير</span><b className="block">×{scale.toFixed(2)}</b></div><div className="rounded-2xl bg-stone-100 dark:bg-stone-900 p-3"><span className="text-[10px] text-stone-500">التكلفة</span><b className="block">{money(totalCost)}</b></div><div className={`rounded-2xl p-3 ${profit>=0?'bg-emerald-50 dark:bg-emerald-950/30':'bg-red-50 dark:bg-red-950/30'}`}><span className="text-[10px] text-stone-500">الربح</span><b className="block">{money(profit)}</b></div></div>
            <div className="rounded-2xl border overflow-hidden"><div className="px-4 py-3 font-black text-sm bg-stone-50 dark:bg-stone-900">المواد المطلوبة لهذه الدفعة</div>{costing.map(row=><div key={row.name} className="flex items-center justify-between gap-3 px-4 py-3 border-t text-xs"><div><b>{row.name}</b>{!row.material && <span className="mr-2 text-amber-600">غير مرتبطة بالمخزون</span>}</div><div className="text-left"><b>{Math.round(row.grams).toLocaleString()} جم</b><div className="text-[10px] text-stone-500">{row.cost === null ? 'أدخل المادة في المخزون لحساب تكلفتها' : money(row.cost)}</div></div></div>)}</div>
            {missingCount>0 && <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 p-3 text-xs flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /><span>يوجد {missingCount} مادة غير مرتبطة بمخزون المعمل، لذلك الربح الحالي تقديري وليس نهائياً.</span></div>}
            <div className="grid sm:grid-cols-2 gap-3"><div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 p-4 text-xs"><div className="font-black mb-1 flex items-center gap-2"><PackageCheck className="w-4 h-4" /> التعبئة</div>{meta.packaging}</div><div className="rounded-2xl bg-violet-50 dark:bg-violet-950/20 p-4 text-xs"><div className="font-black mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> هامش الربح</div>{sellingPrice>0 ? `${(margin*100).toFixed(1)}%` : 'أدخل سعر البيع'}</div></div>
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 p-3 text-[11px] leading-5"><b>تنبيه الصلاحية:</b> عدد الأيام المعروض مرجع تشغيلي وليس ضماناً مخبرياً. يجب اعتماد الصلاحية النهائية بعد اختبار المنتج الفعلي والتعبئة ودرجة الحرارة والنظافة، خصوصاً المشروبات والحشوات اللبنية. المنتجات الطازجة لا تُجبر على أسبوع إذا كانت سلامتها لا تسمح بذلك.</div>
          </div>
        </div>
      </div>
    </div>}
  </div>;
};
