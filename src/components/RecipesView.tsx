import React, { useMemo, useState } from 'react';
import { storage, formatYER } from '../services/storage';
import { Boxes, Calculator, ChefHat, Plus, Trash2, Ruler, Save } from 'lucide-react';

type Ingredient = { rawMaterialId: string; quantityGrams: number };
type PanSize = { id: string; name: string; lengthCm: number; widthCm: number; fillGrams: number; sellingPriceYER: number };
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
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') as Recipe[]; } catch { return []; }
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

export const RecipesView: React.FC = () => {
  const rawMaterials = storage.getRawMaterials().filter((r) => r.active !== false);
  const [recipes, setRecipes] = useState<Recipe[]>(readRecipes);
  const [selectedId, setSelectedId] = useState<string | null>(recipes[0]?.id || null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const emptyRecipe = (): Recipe => ({ id: uid(), name: '', category: 'حلويات', baseYieldGrams: 1000, ingredients: [], pans: [], laborCostYER: 0, packagingCostYER: 0, otherCostYER: 0, notes: '', updatedAt: Date.now() });
  const [draft, setDraft] = useState<Recipe>(emptyRecipe());
  const [calcPan, setCalcPan] = useState<PanSize>({ id: uid(), name: 'مقاس جديد', lengthCm: 30, widthCm: 20, fillGrams: 1000, sellingPriceYER: 0 });

  const persist = (next: Recipe[]) => { setRecipes(next); localStorage.setItem(KEY, JSON.stringify(next)); };
  const selected = recipes.find((r) => r.id === selectedId) || null;

  const baseIngredientCost = (recipe: Recipe) => recipe.ingredients.reduce((sum, i) => {
    const raw = rawMaterials.find((r) => r.id === i.rawMaterialId);
    return sum + i.quantityGrams * rawCostPerGram(raw);
  }, 0);
  const panResult = (recipe: Recipe, pan: PanSize) => {
    const scale = recipe.baseYieldGrams > 0 ? pan.fillGrams / recipe.baseYieldGrams : 0;
    const materialCost = baseIngredientCost(recipe) * scale;
    const fixed = recipe.laborCostYER + recipe.packagingCostYER + recipe.otherCostYER;
    const totalCost = materialCost + fixed;
    const profit = pan.sellingPriceYER - totalCost;
    return { scale, materialCost, totalCost, profit, margin: pan.sellingPriceYER ? profit / pan.sellingPriceYER : 0 };
  };

  const totalMaterialBase = selected ? baseIngredientCost(selected) : 0;
  const saveDraft = () => {
    if (!draft.name.trim() || draft.baseYieldGrams <= 0 || draft.ingredients.length === 0) return;
    persist([...recipes.filter((r) => r.id !== draft.id), { ...draft, name: draft.name.trim(), updatedAt: Date.now() }]);
    setSelectedId(draft.id); setShowEditor(false);
  };
  const openNew = () => { const r = emptyRecipe(); setDraft(r); setShowEditor(true); };
  const openEdit = (r: Recipe) => { setDraft(JSON.parse(JSON.stringify(r))); setShowEditor(true); };
  const addIngredient = () => setDraft({ ...draft, ingredients: [...draft.ingredients, { rawMaterialId: rawMaterials[0]?.id || '', quantityGrams: 100 }] });
  const addPan = () => setDraft({ ...draft, pans: [...draft.pans, { id: uid(), name: 'صينية جديدة', lengthCm: 30, widthCm: 20, fillGrams: 1000, sellingPriceYER: 0 }] });

  return <div className="space-y-6">
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><ChefHat className="w-6 h-6" /></div>
          <div><h2 className="text-xl font-black">الوصفات والتكلفة والأرباح</h2><p className="text-xs text-stone-500">حلويات • معجنات • مخبوزات — احسب تكلفة كل مقاس صينية قبل الإنتاج</p></div>
        </div>
        <div className="flex gap-2"><button onClick={openNew} className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 text-stone-950 font-bold text-sm"><Plus className="w-4 h-4" />وصفة جديدة</button>{selected && <button onClick={() => setShowCalculator(true)} className="touch-target flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold text-sm"><Calculator className="w-4 h-4" />حاسبة المقاس</button>}</div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 space-y-2">
        <div className="text-xs font-bold text-stone-500 px-2 pb-2">الوصفات المسجلة ({recipes.length})</div>
        {recipes.length === 0 && <div className="text-xs text-stone-400 p-4 text-center">لم تضف وصفات بعد.</div>}
        {recipes.map(r => <button key={r.id} onClick={() => setSelectedId(r.id)} className={`w-full text-right p-3 rounded-2xl border ${selectedId === r.id ? 'border-amber-500 bg-amber-500/10' : 'border-stone-100 dark:border-stone-800'}`}><div className="font-bold text-sm">{r.name || 'وصفة بدون اسم'}</div><div className="text-[11px] text-stone-500">{r.category} • إنتاج أساسي {r.baseYieldGrams} جم</div></button>)}
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5">
        {!selected ? <div className="py-16 text-center text-stone-400">اختر وصفة أو أنشئ وصفة جديدة.</div> : <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="text-xs text-amber-600 font-bold">{selected.category}</div><h3 className="text-2xl font-black">{selected.name}</h3><p className="text-xs text-stone-500">الوصفة الأساسية تنتج {selected.baseYieldGrams.toLocaleString()} جم</p></div><button onClick={() => openEdit(selected)} className="touch-target px-4 py-2 rounded-xl border text-sm font-bold">تعديل الوصفة</button></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="تكلفة المواد الأساسية" value={formatYER(totalMaterialBase)} />
            <Stat label="تكلفة العمالة" value={formatYER(selected.laborCostYER)} />
            <Stat label="التغليف والمصاريف" value={formatYER(selected.packagingCostYER + selected.otherCostYER)} />
            <Stat label="إجمالي التكلفة" value={formatYER(totalMaterialBase + selected.laborCostYER + selected.packagingCostYER + selected.otherCostYER)} />
          </div>
          <div><h4 className="font-bold text-sm mb-2">مكونات الوصفة</h4><div className="space-y-2">{selected.ingredients.map((i, idx) => { const raw: any = rawMaterials.find(r => r.id === i.rawMaterialId); return <div key={idx} className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/60 rounded-xl p-3 text-xs"><span className="font-semibold">{raw?.name || 'مادة غير موجودة'}</span><span className="font-mono">{i.quantityGrams.toLocaleString()} جم × {formatYER(rawCostPerGram(raw))}/جم = <b>{formatYER(i.quantityGrams * rawCostPerGram(raw))}</b></span></div>; })}</div></div>
          <div><h4 className="font-bold text-sm mb-2">مقاسات الصواني المحفوظة</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{selected.pans.map(p => { const x = panResult(selected, p); return <div key={p.id} className="border rounded-2xl p-4 space-y-2"><div className="flex justify-between"><b>{p.name}</b><span className="text-xs text-stone-500">{p.lengthCm} × {p.widthCm} سم</span></div><div className="grid grid-cols-2 gap-2 text-xs"><span>تعبئة: <b>{p.fillGrams} جم</b></span><span>التكلفة: <b>{formatYER(x.totalCost)}</b></span><span>سعر البيع: <b>{formatYER(p.sellingPriceYER)}</b></span><span className={x.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>الربح: <b>{formatYER(x.profit)}</b></span></div><div className="text-[11px] text-stone-500">معامل الوصفة: ×{x.scale.toFixed(3)} • هامش الربح: {(x.margin * 100).toFixed(1)}%</div></div>; })}</div></div>
        </div>}
      </div>
    </div>

    {showEditor && <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto"><div className="max-w-3xl mx-auto bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5"><div className="flex justify-between"><div><h3 className="text-xl font-black">{draft.name ? 'تعديل الوصفة' : 'وصفة جديدة'}</h3><p className="text-xs text-stone-500">أدخل تكلفة المواد، ثم أضف مقاسات الصواني ووزن التعبئة وسعر البيع.</p></div><button onClick={() => setShowEditor(false)} className="text-stone-400">✕</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Field label="اسم الوصفة"><input value={draft.name} onChange={e => setDraft({...draft,name:e.target.value})} className="input" placeholder="مثال: كنافة بالقشطة" /></Field><Field label="التصنيف"><select value={draft.category} onChange={e => setDraft({...draft,category:e.target.value})} className="input"><option>حلويات</option><option>معجنات</option><option>مخبوزات</option><option>كيك</option><option>أخرى</option></select></Field><Field label="إنتاج الوصفة الأساسي بالجرام"><input type="number" min="1" value={draft.baseYieldGrams} onChange={e => setDraft({...draft,baseYieldGrams:Number(e.target.value)})} className="input" /></Field></div>
      <div className="flex items-center justify-between"><h4 className="font-bold">المكونات</h4><button onClick={addIngredient} className="text-xs font-bold text-amber-600">+ إضافة مادة</button></div>
      <div className="space-y-2">{draft.ingredients.map((i, idx) => <div key={idx} className="grid grid-cols-[1fr_120px_40px] gap-2"><select value={i.rawMaterialId} onChange={e => { const a=[...draft.ingredients]; a[idx]={...a[idx],rawMaterialId:e.target.value}; setDraft({...draft,ingredients:a}); }} className="input">{rawMaterials.map(r=><option key={r.id} value={r.id}>{r.name} ({r.unit})</option>)}</select><input type="number" min="0" step="0.1" value={i.quantityGrams} onChange={e=>{const a=[...draft.ingredients];a[idx]={...a[idx],quantityGrams:Number(e.target.value)};setDraft({...draft,ingredients:a});}} className="input" placeholder="جرام" /><button onClick={()=>setDraft({...draft,ingredients:draft.ingredients.filter((_,j)=>j!==idx)})} className="rounded-xl border text-rose-600"><Trash2 className="w-4 h-4 mx-auto"/></button></div>)}</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><Field label="عمالة"><input type="number" min="0" value={draft.laborCostYER} onChange={e=>setDraft({...draft,laborCostYER:Number(e.target.value)})} className="input" /></Field><Field label="تغليف"><input type="number" min="0" value={draft.packagingCostYER} onChange={e=>setDraft({...draft,packagingCostYER:Number(e.target.value)})} className="input" /></Field><Field label="مصاريف أخرى"><input type="number" min="0" value={draft.otherCostYER} onChange={e=>setDraft({...draft,otherCostYER:Number(e.target.value)})} className="input" /></Field></div>
      <div className="flex items-center justify-between"><h4 className="font-bold">مقاسات الصواني</h4><button onClick={addPan} className="text-xs font-bold text-amber-600">+ إضافة مقاس</button></div>
      <div className="space-y-3">{draft.pans.map((p, idx) => <div key={p.id} className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl"><input className="input" value={p.name} onChange={e=>{const a=[...draft.pans];a[idx]={...a[idx],name:e.target.value};setDraft({...draft,pans:a});}} placeholder="اسم المقاس"/><input className="input" type="number" value={p.lengthCm} onChange={e=>{const a=[...draft.pans];a[idx]={...a[idx],lengthCm:Number(e.target.value)};setDraft({...draft,pans:a});}} placeholder="الطول سم"/><input className="input" type="number" value={p.widthCm} onChange={e=>{const a=[...draft.pans];a[idx]={...a[idx],widthCm:Number(e.target.value)};setDraft({...draft,pans:a});}} placeholder="العرض سم"/><input className="input" type="number" value={p.fillGrams} onChange={e=>{const a=[...draft.pans];a[idx]={...a[idx],fillGrams:Number(e.target.value)};setDraft({...draft,pans:a});}} placeholder="التعبئة جم"/><input className="input" type="number" value={p.sellingPriceYER} onChange={e=>{const a=[...draft.pans];a[idx]={...a[idx],sellingPriceYER:Number(e.target.value)};setDraft({...draft,pans:a});}} placeholder="سعر البيع"/><button onClick={()=>setDraft({...draft,pans:draft.pans.filter(x=>x.id!==p.id)})} className="rounded-xl border text-rose-600"><Trash2 className="w-4 h-4 mx-auto"/></button></div>)}</div>
      <textarea value={draft.notes} onChange={e=>setDraft({...draft,notes:e.target.value})} className="input min-h-20" placeholder="ملاحظات الوصفة..." />
      <button onClick={saveDraft} disabled={!draft.name.trim() || !draft.ingredients.length || draft.baseYieldGrams<=0} className="w-full py-3 rounded-2xl bg-amber-500 disabled:opacity-40 text-stone-950 font-black flex items-center justify-center gap-2"><Save className="w-4 h-4"/>حفظ الوصفة</button>
    </div></div>}

    {showCalculator && selected && <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm p-4 flex items-center justify-center"><div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-2xl space-y-4"><div className="flex justify-between"><div><h3 className="text-xl font-black">حاسبة الصينية — {selected.name}</h3><p className="text-xs text-stone-500">أدخل الطول والعرض ووزن التعبئة وسيحسب النظام الكمية والتكلفة والربح.</p></div><button onClick={()=>setShowCalculator(false)}>✕</button></div><div className="grid grid-cols-2 gap-3"><Field label="الطول سم"><input className="input" type="number" value={calcPan.lengthCm} onChange={e=>setCalcPan({...calcPan,lengthCm:Number(e.target.value)})}/></Field><Field label="العرض سم"><input className="input" type="number" value={calcPan.widthCm} onChange={e=>setCalcPan({...calcPan,widthCm:Number(e.target.value)})}/></Field><Field label="وزن التعبئة جم"><input className="input" type="number" value={calcPan.fillGrams} onChange={e=>setCalcPan({...calcPan,fillGrams:Number(e.target.value)})}/></Field><Field label="سعر البيع"><input className="input" type="number" value={calcPan.sellingPriceYER} onChange={e=>setCalcPan({...calcPan,sellingPriceYER:Number(e.target.value)})}/></Field></div><div className="grid grid-cols-2 gap-3"><Stat label="معامل التكبير" value={`×${(calcPan.fillGrams/selected.baseYieldGrams).toFixed(3)}`} /><Stat label="تكلفة المواد" value={formatYER(panResult(selected,calcPan).materialCost)} /><Stat label="إجمالي التكلفة" value={formatYER(panResult(selected,calcPan).totalCost)} /><Stat label="الربح" value={formatYER(panResult(selected,calcPan).profit)} /></div><div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1"><div className="font-bold">المعادلة التشغيلية</div><div>كمية كل مادة = كمية الوصفة الأساسية × (وزن الصينية ÷ وزن الإنتاج الأساسي).</div><div>تكلفة المادة = الكمية × تكلفة الجرام من المادة الخام.</div><div>الربح = سعر البيع − (المواد + العمالة + التغليف + المصاريف الأخرى).</div></div><button onClick={()=>setShowCalculator(false)} className="w-full py-3 rounded-2xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 font-bold">إغلاق</button></div></div>}
  </div>;
};

const Field: React.FC<{label:string;children:React.ReactNode}> = ({label,children}) => <label className="block text-xs font-bold space-y-1"><span>{label}</span>{children}</label>;
const Stat: React.FC<{label:string;value:string}> = ({label,value}) => <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700"><span className="text-[10px] text-stone-400 block">{label}</span><b className="font-mono text-sm">{value}</b></div>;
