import React, { useMemo, useState } from 'react';
import { BookOpen, Search, Copy, ChefHat } from 'lucide-react';
import { RECIPE_LIBRARY } from '../data/recipeLibrary';

export const RecipeLibraryView: React.FC = () => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('الكل');
  const categories = ['الكل','حلويات','معجنات','مخبوزات','كيك','مشروبات'];
  const items = useMemo(() => RECIPE_LIBRARY.filter((r) => (category === 'الكل' || r.category === category) && r.name.includes(query.trim())), [query, category]);
  return <div dir="rtl" className="space-y-5 pb-10">
    <div className="bg-white dark:bg-stone-900 border rounded-3xl p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><BookOpen className="w-6 h-6" /></div><div><h2 className="text-xl font-black">مكتبة الوصفات الاقتصادية</h2><p className="text-xs text-stone-500">وصفات تشغيلية قابلة للتعديل. التكلفة والربح يحسبهما النظام من أسعار موادك الفعلية.</p></div></div>
        <div className="relative w-full lg:w-80"><Search className="absolute right-3 top-3 w-4 h-4 text-stone-400" /><input value={query} onChange={e=>setQuery(e.target.value)} className="input pr-9 w-full" placeholder="ابحث عن كنافة، كيك، مشروب..." /></div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4">{categories.map(c=><button key={c} onClick={()=>setCategory(c)} className={`px-3 py-2 rounded-xl text-xs font-bold border ${category===c?'bg-amber-500 text-stone-950 border-amber-500':'border-stone-200 dark:border-stone-700'}`}>{c}</button>)}</div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{items.map(recipe=><article key={recipe.id} className="bg-white dark:bg-stone-900 border rounded-3xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3"><div><div className="text-[11px] text-amber-600 font-bold">{recipe.category}</div><h3 className="font-black text-lg">{recipe.name}</h3></div><ChefHat className="w-5 h-5 text-amber-500 shrink-0" /></div>
      <div className="text-xs text-stone-500">دفعة أساس: <b>{recipe.baseYieldGrams.toLocaleString()} جم</b></div>
      <div className="space-y-1.5">{recipe.ingredients.map(i=><div key={i.name} className="flex justify-between gap-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl px-3 py-2 text-xs"><span>{i.name}</span><b>{i.grams.toLocaleString()} جم</b></div>)}</div>
      <div className="text-[11px] leading-5 text-stone-500">{recipe.notes}</div>
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 p-3 text-[11px] text-stone-600 dark:text-stone-300">ملاحظة: هذه تركيبة بداية اقتصادية، ويجب اختبارها في دفعة صغيرة وضبط القوام والطعم والفاقد حسب موادك ومعداتك قبل اعتمادها تجاريًا.</div>
    </article>)}</div>
    {items.length===0 && <div className="text-center text-stone-400 py-12">لا توجد وصفات بهذا البحث.</div>}
  </div>;
};
