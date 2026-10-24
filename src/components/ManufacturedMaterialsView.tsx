import React, { useMemo, useState } from 'react';
import { Factory, Search, Calculator, CheckCircle2, AlertTriangle, ChefHat } from 'lucide-react';
import { RAW_MATERIAL_PRODUCT_LIBRARY, RECIPE_LIBRARY, RECIPE_PREPARATION_STEPS } from '../data/recipeLibrary';
import { DEFAULT_RECIPE_OPERATION_META, RECIPE_OPERATION_META } from '../data/recipeOperations';
import { storage, formatYER } from '../services/storage';
import { planLibraryRecipe } from '../services/recipeProduction';

const normalize = (value: string) => value.trim().toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه');
const gramsPerStockUnit = (unit: string): number | null => { const u=normalize(unit).replace(/\s/g,''); if(u.includes('كيس')&&(u.includes('50كجم')||u.includes('50kg')))return 50000; if(u.includes('كيس')&&(u.includes('25كجم')||u.includes('25kg')))return 25000; if(u.includes('سطل')&&(u.includes('5كجم')||u.includes('5kg')))return 5000; if(u.includes('كجم')||u.includes('كيلو')||u==='kg')return 1000; if(u.includes('جرام')||u.includes('غرام')||u==='g'||u==='gm')return 1; if(u.includes('لتر')||u==='l'||u.includes('liter'))return 1000; if(u.includes('مل')||u==='ml')return 1; return null; };

const recipeIdByProductId: Record<string, string> = {
  'samosa-sheets': 'samosa',
  'kunafa-dough': 'kunafa-dough',
  'baklava-sheets': 'baklava-sheets',
  'pizza-dough': 'pizza-dough',
  'cream-filling': 'cream-filling',
  'sugar-syrup': 'sugar-syrup',
};

export const ManufacturedMaterialsView: React.FC = () => {
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState(RAW_MATERIAL_PRODUCT_LIBRARY[0]);
  const [yieldGrams,setYieldGrams]=useState(selected?.yieldGrams || 10000);
  const [sellingPrice,setSellingPrice]=useState(0);
  const [batchCost,setBatchCost]=useState(0);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);
  const stockMaterials=useMemo(()=>storage.getRawMaterials(),[refresh]);
  const outputStock=stockMaterials.find(m=>normalize(m.name)===normalize(selected.name) && m.active!==false);
  const visible=useMemo(()=>{const q=normalize(query);return RAW_MATERIAL_PRODUCT_LIBRARY.filter(p=>normalize(p.name).includes(q));},[query]);
  const recipe=useMemo(()=>RECIPE_LIBRARY.find(r=>r.id===recipeIdByProductId[selected.id])??null,[selected.id]);
  const recipeMeta=recipe?(RECIPE_OPERATION_META[recipe.id]??DEFAULT_RECIPE_OPERATION_META):DEFAULT_RECIPE_OPERATION_META;
  const scaledIngredients=recipe?recipe.ingredients.map(item=>({...item,scaledGrams:item.grams*(yieldGrams/recipe.baseYieldGrams)})):[];
  const profit=sellingPrice-batchCost;
  const margin=sellingPrice>0?profit/sellingPrice:0;
  const select=(p:typeof selected)=>{setSelected(p);setYieldGrams(p.yieldGrams);setSellingPrice(0);setBatchCost(0)};
  const registerProduction=()=>{
    setMessage(''); setError('');
    if(!recipe){setError('لا توجد وصفة مرتبطة بهذا المنتج، لذلك لم يتم تغيير المخزون.');return;}
    try{
      const plan=planLibraryRecipe(recipe,yieldGrams);
      if(!plan.ready){
        const missing=plan.missing.map(r=>r.name).join('، ');
        const insufficient=plan.insufficient.map(r=>r.name).join('، ');
        throw new Error([missing?('مواد غير مربوطة بالمخزون: '+missing):'',insufficient?('رصيد غير كافٍ: '+insufficient):''].filter(Boolean).join(' | '));
      }
      const existing=storage.getRawMaterials().find(m=>normalize(m.name)===normalize(selected.name)&&m.active!==false);
      const unit=existing?.unit??'كجم';
      const gramsPerUnit=gramsPerStockUnit(unit);
      if(!gramsPerUnit)throw new Error('وحدة مخزون الناتج غير معروفة. غيّر وحدة المادة إلى كجم أو جرام أو لتر قبل الإنتاج.');
      const outputQty=yieldGrams/gramsPerUnit;
      if(!Number.isFinite(outputQty)||outputQty<=0)throw new Error('وزن الناتج غير صالح.');
      const output=existing??storage.saveRawMaterial({name:selected.name,unit:'كجم',stockQty:0,minimumQty:0,averageCostPerUnitYER:0,active:true});
      for(const row of plan.rows){storage.updateRawMaterialStock(row.material!.id,-row.stockRequired!);}
      const outputCostPerUnit=plan.totalFullCostYER/outputQty;
      storage.updateRawMaterialStock(output.id,outputQty,outputCostPerUnit);
      setMessage('تم تسجيل إنتاج '+selected.name+' وإضافة '+outputQty.toLocaleString(undefined,{maximumFractionDigits:3})+' '+output.unit+' إلى مخزون المواد الخام. تكلفة الدفعة: '+formatYER(plan.totalFullCostYER)+'.');
      setRefresh(v=>v+1);
    }catch(e){setError(e instanceof Error?e.message:'تعذر تسجيل الإنتاج؛ لم يتم اعتماد العملية.');}
  };
  return <div dir="rtl" className="space-y-5 pb-10">
    <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5"><div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><Factory className="w-6 h-6" /></div><div><h2 className="text-xl font-black">إنتاج المواد الخام ونصف المصنعة</h2><p className="text-xs text-stone-500">صنّع ما يحتاجه المعمل أو السوق: رقائق سمبوسة، عجينة كنافة، رقائق بقلاوة، عجائن وحشوات وشيرة.</p></div></div><div className="relative w-full lg:w-80"><Search className="absolute right-3 top-3 w-4 h-4 text-stone-400"/><input value={query} onChange={e=>setQuery(e.target.value)} className="input pr-9 w-full" placeholder="ابحث عن منتج نصف مصنع..."/></div></div></div>
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4"><div className="bg-white dark:bg-stone-900 border rounded-3xl p-4 space-y-2">{visible.map(p=><button key={p.id} onClick={()=>select(p)} className={`w-full text-right p-3 rounded-2xl border ${selected.id===p.id?'border-emerald-500 bg-emerald-500/10':'border-stone-100 dark:border-stone-800'}`}><b className="text-sm">{p.name}</b><div className="text-[11px] text-stone-500">{p.category} • دفعة {p.yieldGrams.toLocaleString()} جم</div></button>)}</div>
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 space-y-5 shadow-sm"><div className="flex flex-col sm:flex-row gap-4"><img src={recipeMeta.imageUrl} alt={recipeMeta.imageAlt} loading="lazy" onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src='/madhaq_logo.png';e.currentTarget.alt='شعار مذاق - الصورة غير متاحة';}} className="w-full sm:w-36 h-32 rounded-2xl object-cover bg-stone-100 dark:bg-stone-800"/><div className="flex-1"><div className="text-xs text-emerald-600 font-bold">{selected.category}</div><h3 className="text-2xl font-black">{selected.name}</h3><p className="text-xs text-stone-500 mt-1">المواد المقترحة: {selected.inputs.join(' • ')}</p></div></div>{recipe&&<section className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 overflow-hidden"><div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-between gap-2"><div><h4 className="font-black text-sm">المقادير الفعلية للدفعة</h4><p className="text-[11px] text-stone-500 mt-1">تتغير تلقائياً مع وزن الدفعة أدناه</p></div><span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{recipe.ingredients.length} مكونات</span></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">{scaledIngredients.map(item=><div key={item.name} className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 dark:bg-stone-800/70 px-3 py-2.5 text-xs"><span className="font-semibold">{item.name}</span><b className="font-mono">{Math.round(item.scaledGrams).toLocaleString()} جم</b></div>)}</div><p className="px-4 pb-4 text-[11px] leading-5 text-stone-500">{recipe.notes}</p></section>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="block"><span className="label">وزن الدفعة</span><input type="number" min="1" value={yieldGrams} onChange={e=>setYieldGrams(Number(e.target.value))} className="input"/></label><label className="block"><span className="label">تكلفة الدفعة</span><input type="number" min="0" value={batchCost} onChange={e=>setBatchCost(Number(e.target.value))} className="input"/></label><label className="block"><span className="label">سعر بيع الدفعة</span><input type="number" min="0" value={sellingPrice} onChange={e=>setSellingPrice(Number(e.target.value))} className="input"/></label></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3"><Stat label="تكلفة/كجم" value={(yieldGrams>0?(batchCost/yieldGrams*1000).toLocaleString(undefined,{maximumFractionDigits:0}):'0')+' ر.ي'} /><Stat label="سعر البيع" value={sellingPrice.toLocaleString()+' ر.ي'} /><Stat label="الربح" value={profit.toLocaleString()+' ر.ي'} /><Stat label="الهامش" value={(margin*100).toFixed(1)+'%'} /></div>
        {recipe&&<section className="rounded-2xl border border-stone-200 dark:border-stone-800 p-4 space-y-3"><div className="flex items-center gap-2"><ChefHat className="w-4 h-4 text-amber-500"/><h4 className="font-black text-sm">خطوات التصنيع</h4></div><ol className="space-y-2">{(RECIPE_PREPARATION_STEPS[recipe.id]??[]).map((step,i)=><li key={i} className="flex items-start gap-2 text-xs leading-5"><span className="w-5 h-5 shrink-0 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">{i+1}</span><span>{step}</span></li>)}</ol></section>}
        <div className="rounded-2xl bg-stone-50 dark:bg-stone-800/60 p-4 text-xs leading-6"><b>ربط المخزون:</b> عند تسجيل الإنتاج، يتحقق النظام من توفر كل مادة خام، ويخصم المقادير المطلوبة، ثم يضيف الناتج إلى مخزون المواد الخام بوحدته وتكلفته المحسوبة. لا يتم التسجيل إذا كانت المواد ناقصة أو غير مربوطة.</div>
        {outputStock&&<div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-200">الرصيد الحالي من {selected.name}: <b>{outputStock.stockQty.toLocaleString()} {outputStock.unit}</b></div>}
        {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-200"><AlertTriangle className="inline w-4 h-4 ml-1"/>{error}</div>}
        {message&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-700 dark:text-emerald-200"><CheckCircle2 className="inline w-4 h-4 ml-1"/>{message}</div>}
        <button onClick={registerProduction} disabled={!recipe} className="w-full min-h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[.99]"><CheckCircle2 className="w-4 h-4"/>تسجيل الإنتاج وخصم المواد وإضافة الناتج للمخزون</button>
        <p className="text-[11px] text-stone-500">{selected.notes}</p>
      </div></div>
  </div>;
};
const Stat=({label,value}:{label:string;value:string})=><div className="rounded-2xl border p-3"><div className="text-[10px] text-stone-500">{label}</div><div className="font-black text-sm mt-1">{value}</div></div>;
