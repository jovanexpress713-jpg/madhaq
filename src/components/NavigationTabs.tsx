import React, { lazy, Suspense } from 'react';
import { LayoutDashboard, Truck, Receipt, Users, CalendarCheck, UtensilsCrossed, Package, Boxes, Building2, Wallet, ChefHat, BookOpen, Factory, Store } from 'lucide-react';
const RecipesView = lazy(() => import('./RecipesView').then((module) => ({ default: module.RecipesView })));
const RecipeLibraryView = lazy(() => import('./RecipeLibraryView').then((module) => ({ default: module.RecipeLibraryView })));
const ManufacturedMaterialsView = lazy(() => import('./ManufacturedMaterialsView').then((module) => ({ default: module.ManufacturedMaterialsView })));

interface NavigationTabsProps { activeTab: string; onSelectTab: (tab: string) => void; }

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'distributions', label: 'فواتير التوزيع', icon: Truck },
    { id: 'collections', label: 'سندات التحصيل', icon: Receipt },
    { id: 'distributors', label: 'الموزعون والحسابات', icon: Users },
    { id: 'customers', label: 'البقالات وديون العملاء', icon: Store },
    { id: 'thursday', label: 'كشف الخميس الأسبوعي', icon: CalendarCheck, badge: 'رئيسي' },
    { id: 'production', label: 'الإنتاج', icon: UtensilsCrossed },
    { id: 'recipes', label: 'الوصفات والتكلفة', icon: ChefHat },
    { id: 'recipeLibrary', label: 'مكتبة الوصفات', icon: BookOpen },
    { id: 'manufacturedMaterials', label: 'إنتاج المواد الخام', icon: Factory },
    { id: 'products', label: 'مخزون المنتجات', icon: Package },
    { id: 'rawMaterials', label: 'المواد الخام', icon: Boxes },
    { id: 'suppliers', label: 'الموردون والمشتريات', icon: Building2 },
    { id: 'expenses', label: 'المصروفات والصندوق', icon: Wallet },
  ];
  return <>
    <div className="hidden md:block bg-stone-900/90 border-b border-amber-900/40 text-stone-300"><div className="max-w-7xl mx-auto px-4 sm:px-6"><div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">{tabs.map(tab=>{const Icon=tab.icon;const isActive=activeTab===tab.id;return <button key={tab.id} onClick={()=>onSelectTab(tab.id)} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${isActive?'bg-amber-500 text-stone-950 shadow-md font-bold':'text-stone-300 hover:text-white hover:bg-stone-800/80'}`}><Icon className={`w-4 h-4 ${isActive?'text-stone-950':'text-amber-400'}`}/><span>{tab.label}</span>{tab.badge&&<span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isActive?'bg-stone-950 text-amber-300':'bg-amber-500/20 text-amber-300'}`}>{tab.badge}</span>}</button>})}</div></div></div>
    {activeTab==='recipes'&&<Overlay onBack={()=>onSelectTab('production')}><RecipesView/></Overlay>}
    {activeTab==='recipeLibrary'&&<Overlay onBack={()=>onSelectTab('recipes')}><RecipeLibraryView/></Overlay>}
    {activeTab==='manufacturedMaterials'&&<Overlay onBack={()=>onSelectTab('rawMaterials')}><ManufacturedMaterialsView/></Overlay>}
  </>;
};

const Overlay: React.FC<{children:React.ReactNode;onBack:()=>void}>=({children,onBack})=><section className="w-full bg-stone-100 dark:bg-stone-950 pb-6"><div className="max-w-7xl mx-auto p-3 sm:p-5 lg:p-6"><div className="flex items-center justify-between gap-3 mb-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 shadow-sm"><div className="text-xs font-bold text-stone-600 dark:text-stone-300">قسم مستقل <span className="mx-1 text-stone-300">/</span><span className="text-amber-600 dark:text-amber-400">إدارة المعمل</span></div><button onClick={onBack} className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold shadow-sm hover:opacity-90 transition">العودة للقسم السابق</button></div><Suspense fallback={<div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center text-sm font-bold text-stone-500">جارٍ تحميل القسم…</div>}>{children}</Suspense></div></section>;
