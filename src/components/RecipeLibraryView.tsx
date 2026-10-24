import React, { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, Calculator, ChefHat, Clock3, ImagePlus, Link2, PackageCheck, PlayCircle, Search, TrendingUp } from 'lucide-react';
import { RECIPE_LIBRARY, RecipeLibraryItem, RECIPE_PREPARATION_STEPS } from '../data/recipeLibrary';
import { DEFAULT_RECIPE_OPERATION_META, RECIPE_OPERATION_META } from '../data/recipeOperations';
import { storage } from '../services/storage';
import { produceLibraryRecipe } from '../services/recipeProduction';

const normalize = (value: string) => value.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
const money = (value: number) => `${Math.round(value).toLocaleString()} ر.ي`;
const photoSourceUrl = (url: string, sourceUrl?: string) => {
  if (sourceUrl) return sourceUrl;
  if (url.includes('photo-1741424605439-9b3b0f54d755')) return 'https://unsplash.com/photos/delicious-dessert-is-presented-with-toppings-Ca8yl1cXUP0';
  if (url.includes('photo-1772729294786-7a264601887b')) return 'https://unsplash.com/photos/sweet-baklava-pastry-with-nuts-in-a-glass-bowl-MC63Y6DG7wU';
  if (url.includes('photo-1689425863266-3b7432f9006b')) return 'https://unsplash.com/photos/a-close-up-of-cookies-on-a-cooling-rack-26TvYH6didY';
  if (url.includes('photo-1772729996007-40bad08b3c40')) return 'https://unsplash.com/photos/golden-fried-samosas-served-on-a-white-napkin-iaEZgGPnEwo';
  if (url.includes('photo-1573050435329-27ff3181380c')) return 'https://unsplash.com/photos/cupcakes-LD4KsgYUjxI';
  if (url.includes('photo-1737093818249-8c72f5943350')) return 'https://unsplash.com/photos/a-loaf-of-bread-sitting-on-top-of-a-cutting-board-lcSruI0hy9E';
  if (url.includes('photo-1726039413774-614d0ca53d02')) return 'https://unsplash.com/photos/a-glass-filled-with-a-drink-and-a-slice-of-lemon-NKiJFRm8Wyw';
  return url;
};
const DB_KEY = 'madhaq_factory_db_v1';
const CUSTOM_PHOTOS_KEY = 'madhaq_recipe_custom_photos_v1';
const readCustomPhotos = (): Record<string,string> => { try { const value = JSON.parse(localStorage.getItem(CUSTOM_PHOTOS_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; } catch { return {}; } };

const getCostPerGram = (material: any): number | null => {
  const cost = Number(material?.averageCostPerUnitYER ?? 0);
  if (!Number.isFinite(cost) || cost <= 0) return null;
  const unit = normalize(String(material?.unit ?? '')).replace(/\\s/g, '');
  if (unit.includes('كيس') && (unit.includes('50كجم') || unit.includes('50kg'))) return cost / 50000;
  if (unit.includes('كيس') && (unit.includes('25كجم') || unit.includes('25kg'))) return cost / 25000;
  if (unit.includes('سطل') && (unit.includes('5كجم') || unit.includes('5kg'))) return cost / 5000;
  if (unit.includes('كجم') || unit.includes('كيلو') || unit === 'kg') return cost / 1000;
  if (unit.includes('جرام') || unit.includes('غرام') || unit === 'g' || unit === 'gm') return cost;
  if (unit.includes('لتر') || unit === 'l' || unit.includes('liter')) return cost / 1000;
  if (unit.includes('مل') || unit === 'ml') return cost;
  return null;
};

const readProducts = () => {
  try {
    const db = JSON.parse(localStorage.getItem(DB_KEY) || '{}');
    return Array.isArray(db.products) ? db.products.filter((p: any) => p.active !== false) : [];
  } catch { return []; }
};

export const RecipeLibraryView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const [selected, setSelected] = useState<RecipeLibraryItem | null>(null);
  const [batchGrams, setBatchGrams] = useState(10000);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [plannedQty, setPlannedQty] = useState(100);
  const [producedQty, setProducedQty] = useState(100);
  const [damagedQty, setDamagedQty] = useState(0);
  const [productId, setProductId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [customPhotos, setCustomPhotos] = useState<Record<string,string>>(readCustomPhotos);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [imageMessage, setImageMessage] = useState('');
  const materials = useMemo(() => storage.getRawMaterials(), [refresh]);
  const products = useMemo(() => readProducts(), [refresh]);
  const categories = ['الكل','حلويات','معجنات','مخبوزات','كيك','مشروبات'];
  const items = useMemo(() => { const q = normalize(query); return RECIPE_LIBRARY.filter((r) => (category === 'الكل' || r.category === category) && (!q || normalize(r.name).includes(q) || r.ingredients.some((ingredient) => normalize(ingredient.name).includes(q)))); }, [query, category]);
  const meta = selected ? (RECIPE_OPERATION_META[selected.id] ?? DEFAULT_RECIPE_OPERATION_META) : null;
  const recipeImage = (id: string, defaultUrl: string) => customPhotos[id] || defaultUrl;
  const saveRecipeImage = (id: string, url: string) => { try { const next = { ...customPhotos, [id]: url }; localStorage.setItem(CUSTOM_PHOTOS_KEY, JSON.stringify(next)); setCustomPhotos(next); setImageUrlDraft(url.startsWith('data:') ? '' : url); setImageMessage('تم حفظ الصورة الخاصة بهذا الصنف على هذا الجهاز.'); setError(''); } catch { setError('تعذر حفظ الصورة؛ اختر صورة أصغر أو استخدم رابط صورة مباشر.'); } };
  const handleImageUpload = (id: string, file?: File) => { if (!file) return; if (!file.type.startsWith('image/')) { setError('اختر ملف صورة فقط.'); return; } const reader = new FileReader(); reader.onerror = () => setError('تعذر قراءة الصورة.'); reader.onload = () => { const img = new Image(); img.onerror = () => setError('تعذر فتح ملف الصورة.'); img.onload = () => { const max = 900; const scale = Math.min(1, max / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); const ctx = canvas.getContext('2d'); if (!ctx) { setError('تعذر تجهيز الصورة.'); return; } ctx.drawImage(img, 0, 0, canvas.width, canvas.height); const data = canvas.toDataURL('image/webp', 0.76); saveRecipeImage(id, data); }; img.src = String(reader.result); }; reader.readAsDataURL(file); };
  const scale = selected ? Math.max(0, batchGrams) / selected.baseYieldGrams : 0;
  const costing = selected ? selected.ingredients.map((ingredient) => {
    const target = normalize(ingredient.name);
    const material = materials.find((m: any) => normalize(String(m.name)) === target);
    const unitCost = material ? getCostPerGram(material) : null;
    const grams = ingredient.grams * scale;
    return { ...ingredient, grams, material, cost: unitCost === null ? null : grams * unitCost };
  }) : [];
  const matchedCost = costing.reduce((sum, row) => sum + (row.cost ?? 0), 0);
  const missingCount = costing.filter((row) => row.cost === null).length;
  const totalCost = matchedCost + (selected ? (selected.laborCostYER + selected.packagingCostYER + selected.otherCostYER) * scale : 0);
  const profit = sellingPrice - totalCost;
  const margin = sellingPrice > 0 ? profit / sellingPrice : 0;

  const openRecipe = (recipe: RecipeLibraryItem) => {
    const recipeMeta = RECIPE_OPERATION_META[recipe.id] ?? DEFAULT_RECIPE_OPERATION_META;
    setSelected(recipe); setBatchGrams(recipeMeta.recommendedBatchGrams); setSellingPrice(0); setMessage(''); setError('');
    setProductId(products[0]?.id || ''); setPlannedQty(100); setProducedQty(100); setDamagedQty(0); setImageUrlDraft(customPhotos[recipe.id] || recipeMeta.imageUrl); setImageMessage('');
  };

  const executeProduction = () => {
    if (!selected || !productId) { setError('اختر المنتج الذي سيستقبل الناتج أولاً.'); return; }
    setError(''); setMessage('');
    try {
      const result = produceLibraryRecipe({ recipe: selected, batchGrams, productId, plannedQty, producedQty, damagedQty, note: `إنتاج ${selected.name} من مكتبة الوصفات` });
      setMessage(`تم تسجيل الإنتاج: ${result.productName} — الناتج ${result.producedQty} — تكلفة الوحدة ${money(result.unitCostYER)}.`);
      setRefresh((v) => v + 1);
    } catch (e) { setError(e instanceof Error ? e.message : 'تعذر تسجيل الإنتاج.'); }
  };

  return <div dir="rtl" className="space-y-5 pb-10">
    <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div><div><h2 className="text-xl font-black">مكتبة الوصفات الاقتصادية الذكية</h2><p className="text-xs text-stone-500">احسب الدفعة ثم حوّلها مباشرة إلى إنتاج فعلي مع خصم المواد وإضافة الناتج للمخزون.</p></div></div><div className="relative w-full lg:w-80"><Search className="absolute right-3 top-3 w-4 h-4 text-stone-400" /><input value={query} onChange={e=>setQuery(e.target.value)} className="input pr-9 w-full" placeholder="ابحث عن كنافة، كيك، مشروب..." /></div></div><div className="flex flex-wrap gap-2 mt-4">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${category===c?'bg-amber-500 text-stone-950 border-amber-500 shadow-sm':'border-stone-200 dark:border-stone-700 hover:border-amber-400'}`}>{c}</button>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 dark:border-stone-800 pt-3 text-xs"><span className="font-bold text-stone-600 dark:text-stone-300">{items.length} وصفة ظاهرة من أصل {RECIPE_LIBRARY.length}</span><span className="text-stone-500">كل وصفة تشمل مقادير بالجرام وحاسبة لتكبير الدفعة</span></div></div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{items.map(recipe=>{ const m=RECIPE_OPERATION_META[recipe.id]??DEFAULT_RECIPE_OPERATION_META; return <article key={recipe.id} className="bg-white dark:bg-stone-900 border rounded-3xl overflow-hidden flex flex-col"><div className="relative h-44 overflow-hidden bg-stone-100 dark:bg-stone-800"><img src={recipeImage(recipe.id,m.imageUrl)} alt={m.imageAlt} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.style.display='none';}} className="w-full h-full object-cover transition duration-500 hover:scale-[1.03]"/><div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none"/><span className="absolute bottom-3 right-3 rounded-full border border-white/30 bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-sm">{recipe.category}</span><span className="absolute bottom-3 left-3 rounded-full bg-white/90 text-stone-700 px-2.5 py-1 text-[10px] font-bold">صورة فوتوغرافية</span></div><div className="p-5 space-y-4 flex-1"><div className="flex items-start justify-between gap-3"><div><div className="text-[11px] text-amber-600 font-bold">{recipe.category}</div><h3 className="font-black text-lg">{recipe.name}</h3></div><ChefHat className="w-5 h-5 text-amber-500"/></div><div className="grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-stone-50 dark:bg-stone-800/60 p-3"><span className="text-stone-500">دفعة الأساس</span><b className="block mt-1">{recipe.baseYieldGrams.toLocaleString()} جم</b></div><div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3"><span className="text-stone-500">عدد المكونات</span><b className="block mt-1">{recipe.ingredients.length} مكونات</b></div></div><div className="rounded-2xl border border-stone-100 dark:border-stone-800 p-3"><div className="mb-2 text-[11px] font-black text-stone-500">نظرة سريعة على المقادير</div><div className="flex flex-wrap gap-1.5">{recipe.ingredients.slice(0,4).map(ingredient=><span key={ingredient.name} className="rounded-lg bg-stone-100 dark:bg-stone-800 px-2 py-1 text-[11px]">{ingredient.name} <b>{ingredient.grams.toLocaleString()} جم</b></span>)}{recipe.ingredients.length>4&&<span className="rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">+{recipe.ingredients.length-4} أخرى</span>}</div></div><div className="flex items-start gap-2 text-xs text-stone-500"><Clock3 className="w-4 h-4 shrink-0"/>{m.storage}</div><a href={photoSourceUrl(recipeImage(recipe.id,m.imageUrl),m.imageSourceUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-amber-600 underline underline-offset-4">فتح الصورة الأصلية ↗</a><button onClick={()=>openRecipe(recipe)} className="touch-target w-full rounded-2xl bg-stone-950 text-white dark:bg-white dark:text-stone-950 px-4 py-3 font-black text-sm flex items-center justify-center gap-2"><Calculator className="w-4 h-4"/>تشغيل وحساب الوصفة</button></div></article>;})}</div>
    {items.length===0&&<div className="text-center text-stone-400 py-12">لا توجد وصفات بهذا البحث.</div>}
    {selected&&meta&&<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto" onClick={()=>setSelected(null)}><div className="max-w-6xl mx-auto bg-white dark:bg-stone-950 rounded-3xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}><div className="grid lg:grid-cols-5"><div className="lg:col-span-2 relative min-h-64 lg:min-h-full"><img src={recipeImage(selected.id,meta.imageUrl)} alt={meta.imageAlt} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.style.display='none';}} className="absolute inset-0 w-full h-full object-cover"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"/><div className="absolute bottom-5 right-5 left-5 text-white"><div className="text-xs font-bold text-amber-300">{selected.category}</div><h2 className="text-2xl font-black">{selected.name}</h2><div className="text-xs mt-2">الصلاحية المرجعية: {meta.shelfLifeDays} يوم</div><a href={photoSourceUrl(recipeImage(selected.id,meta.imageUrl),meta.imageSourceUrl)} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[11px] font-bold text-white/80 underline underline-offset-4">فتح الصورة الأصلية ↗</a></div></div><div className="lg:col-span-3 p-5 sm:p-7 space-y-5"><div className="flex items-center justify-between gap-3"><div><h3 className="text-xl font-black">حاسبة التشغيل والإنتاج</h3><p className="text-xs text-stone-500">غيّر كمية الدفعة؛ النظام يعيد حساب المواد تلقائياً.</p></div><button onClick={()=>setSelected(null)} className="touch-target rounded-xl border px-3">إغلاق</button></div>
      <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">كمية الدفعة (جم)<input className="input mt-2 w-full" type="number" min="1" value={batchGrams} onChange={e=>setBatchGrams(Math.max(1,Number(e.target.value)||1))}/></label><label className="text-xs font-bold">سعر البيع للدفعة<input className="input mt-2 w-full" type="number" min="0" value={sellingPrice} onChange={e=>setSellingPrice(Math.max(0,Number(e.target.value)||0))}/></label></div>
      <div className="grid grid-cols-3 gap-2"><div className="rounded-2xl bg-stone-100 dark:bg-stone-900 p-3"><span className="text-[10px] text-stone-500">التكبير</span><b className="block">×{scale.toFixed(2)}</b></div><div className="rounded-2xl bg-stone-100 dark:bg-stone-900 p-3"><span className="text-[10px] text-stone-500">التكلفة</span><b className="block">{money(totalCost)}</b></div><div className={`rounded-2xl p-3 ${profit>=0?'bg-emerald-50 dark:bg-emerald-950/30':'bg-red-50 dark:bg-red-950/30'}`}><span className="text-[10px] text-stone-500">الربح</span><b className="block">{money(profit)}</b></div></div>
      <div className="rounded-2xl border overflow-hidden"><div className="px-4 py-3 font-black text-sm bg-stone-50 dark:bg-stone-900">المواد المطلوبة</div>{costing.map(row=><div key={row.name} className="flex items-center justify-between gap-3 px-4 py-3 border-t text-xs"><div><b>{row.name}</b>{!row.material&&<span className="mr-2 text-amber-600">غير مرتبطة</span>}</div><div className="text-left"><b>{Math.round(row.grams).toLocaleString()} جم</b><div className="text-[10px] text-stone-500">{row.cost===null?'أدخل المادة في المخزون':money(row.cost)}</div></div></div>)}</div>

      <section className="rounded-2xl border border-amber-200 dark:border-amber-900/50 p-4 space-y-3">
        <div className="flex items-center gap-2 font-black text-sm"><ImagePlus className="w-5 h-5 text-amber-600"/>صورة هذا الصنف</div>
        <p className="text-xs text-stone-500 leading-5">كل وصفة لها صورة مستقلة. ارفع صورة منتجك لاحقاً أو ضع رابطاً مباشراً لصورة، ولن تُستخدم صورة صنف آخر بدلاً منها. الصورة المرفوعة تحفظ محلياً على هذا الجهاز.</p>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex items-center gap-2 rounded-xl bg-amber-500 text-stone-950 px-4 py-3 text-xs font-black cursor-pointer"><ImagePlus className="w-4 h-4"/>رفع/تغيير الصورة<input type="file" accept="image/*" className="hidden" onChange={e=>{handleImageUpload(selected.id,e.currentTarget.files?.[0]);e.currentTarget.value='';}}/></label>
          <button type="button" onClick={()=>{try{const next={...customPhotos};delete next[selected.id];localStorage.setItem(CUSTOM_PHOTOS_KEY,JSON.stringify(next));setCustomPhotos(next);setImageUrlDraft(meta.imageUrl);setImageMessage('تمت استعادة الصورة المرجعية لهذا الصنف.');setError('');}catch{setError('تعذر تحديث إعداد الصورة.');}}} className="inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold"><Link2 className="w-4 h-4"/>استعادة المرجعية</button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2"><input className="input min-w-0 flex-1" dir="ltr" type="url" value={imageUrlDraft} onChange={e=>setImageUrlDraft(e.target.value)} placeholder="https:// رابط الصورة المباشر"/><button type="button" onClick={()=>{const u=imageUrlDraft.trim();if(!(u.startsWith('https://')||u.startsWith('http://'))){setError('أدخل رابط صورة مباشر يبدأ بـ https:// أو http://');return;}saveRecipeImage(selected.id,u);}} className="rounded-xl border px-4 py-3 text-xs font-black">حفظ الرابط</button></div>
        {imageMessage&&<p role="status" className="text-xs text-emerald-700 dark:text-emerald-300">{imageMessage}</p>}
      </section>

      <section className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 space-y-3">
        <div className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-amber-500"/><h4 className="font-black text-sm">طريقة التحضير خطوة بخطوة</h4></div>
        <ol className="space-y-2.5">{(RECIPE_PREPARATION_STEPS[selected.id] ?? ['حضّر المواد وازنها بدقة، ثم اخلطها حسب ترتيب الوصفة.', 'نفّذ المعالجة أو الخَبز مع مراقبة النضج، ثم برّد الناتج وازنه.', 'سجّل الوزن الفعلي والفاقد قبل اعتماد التكلفة أو التعبئة.']).map((step,index)=><li key={index} className="flex items-start gap-3 text-xs leading-6"><span className="shrink-0 w-6 h-6 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black">{index+1}</span><span>{step}</span></li>)}</ol>
        <p className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40 p-3 text-[11px] leading-5 text-amber-900 dark:text-amber-200">تنبيه مهني: المقادير وصفات تشغيل مرجعية وليست اعتماداً مخبرياً. نفّذ دفعة اختبار، زن الناتج الفعلي، وثبّت المواصفة بعد مراجعة الطعم والقوام وسلامة الغذاء. المشروبات والحشوات اللبنية تحتاج تبريداً واختبار صلاحية قبل البيع.</p>
      </section>
      {missingCount>0&&<div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 p-3 text-xs flex gap-2"><AlertTriangle className="w-4 h-4 text-amber-600 shrink-0"/>يوجد {missingCount} مادة غير مرتبطة؛ لا تعتمد الربح النهائي قبل ربطها.</div>}
      <div className="grid sm:grid-cols-2 gap-3"><div className="rounded-2xl bg-blue-50 dark:bg-blue-950/20 p-4 text-xs"><div className="font-black mb-1 flex items-center gap-2"><PackageCheck className="w-4 h-4"/>التعبئة</div>{meta.packaging}</div><div className="rounded-2xl bg-violet-50 dark:bg-violet-950/20 p-4 text-xs"><div className="font-black mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4"/>هامش الربح</div>{sellingPrice>0?`${(margin*100).toFixed(1)}%`:'أدخل سعر البيع'}</div></div>
      <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 p-4 space-y-3"><div className="flex items-center gap-2 font-black"><PlayCircle className="w-5 h-5 text-amber-600"/>تحويل الحسبة إلى إنتاج فعلي</div><div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold col-span-2">المنتج<select className="input mt-1 w-full" value={productId} onChange={e=>setProductId(e.target.value)}><option value="">اختر المنتج الذي سيستقبل الناتج</option>{products.map((p:any)=><option key={p.id} value={p.id}>{p.name} — مخزون {p.stockQty} {p.unit}</option>)}</select></label><label className="text-xs font-bold">المخطط (وحدة)<input className="input mt-1 w-full" type="number" min="1" value={plannedQty} onChange={e=>setPlannedQty(Math.max(1,Number(e.target.value)||1))}/></label><label className="text-xs font-bold">الناتج السليم<input className="input mt-1 w-full" type="number" min="1" value={producedQty} onChange={e=>setProducedQty(Math.max(1,Number(e.target.value)||1))}/></label><label className="text-xs font-bold">التالف<input className="input mt-1 w-full" type="number" min="0" value={damagedQty} onChange={e=>setDamagedQty(Math.max(0,Number(e.target.value)||0))}/></label></div><button onClick={executeProduction} disabled={missingCount>0} className="touch-target w-full rounded-2xl bg-amber-500 text-stone-950 py-3 font-black flex items-center justify-center gap-2 disabled:opacity-50"><PlayCircle className="w-5 h-5"/>سجل الإنتاج وخصم المواد وإضافة المخزون</button>{message&&<div className="rounded-xl bg-emerald-50 text-emerald-800 p-3 text-xs font-bold">{message}</div>}{error&&<div className="rounded-xl bg-red-50 text-red-800 p-3 text-xs font-bold">{error}</div>}</div>
      <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 p-3 text-[11px] leading-5"><b>الصلاحية:</b> {meta.shelfLifeDays} يوم مرجعي فقط. الاعتماد التجاري النهائي يجب أن يعتمد على اختبار المنتج الفعلي والتعبئة والتبريد والنظافة، ولا يتم تمديد صلاحية المنتجات الطازجة لمجرد أن الهدف أسبوع.</div>
    </div></div></div></div>}
  </div>;
};
