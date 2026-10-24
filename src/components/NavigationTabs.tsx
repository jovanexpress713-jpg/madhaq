import React, { lazy, Suspense, useState } from 'react';
import { LayoutDashboard, Truck, Receipt, Users, CalendarCheck, UtensilsCrossed, Package, Boxes, Building2, Wallet, ChefHat, BookOpen, Factory, Store, ChevronDown, RotateCcw } from 'lucide-react';

const RecipesView = lazy(() => import('./RecipesView').then((module) => ({ default: module.RecipesView })));
const RecipeLibraryView = lazy(() => import('./RecipeLibraryView').then((module) => ({ default: module.RecipeLibraryView })));
const ManufacturedMaterialsView = lazy(() => import('./ManufacturedMaterialsView').then((module) => ({ default: module.ManufacturedMaterialsView })));

interface NavigationTabsProps { activeTab: string; onSelectTab: (tab: string) => void; }

type NavItem = { id: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string };

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onSelectTab }) => {
  const [moreOpen, setMoreOpen] = useState(false);

  const primary: NavItem[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'distributions', label: 'التوزيع', icon: Truck },
    { id: 'collections', label: 'التحصيل', icon: Receipt },
    { id: 'distributors', label: 'الموزعون', icon: Users },
    { id: 'customers', label: 'العملاء', icon: Store },
    { id: 'thursday', label: 'كشف الخميس', icon: CalendarCheck, badge: 'رئيسي' },
    { id: 'production', label: 'الإنتاج', icon: UtensilsCrossed },
  ];

  const secondary: NavItem[] = [
    { id: 'recipes', label: 'الوصفات والتكلفة', icon: ChefHat },
    { id: 'recipeLibrary', label: 'مكتبة الوصفات', icon: BookOpen },
    { id: 'manufacturedMaterials', label: 'إنتاج المواد الخام', icon: Factory },
    { id: 'products', label: 'مخزون المنتجات', icon: Package },
    { id: 'rawMaterials', label: 'المواد الخام والمستودع', icon: Boxes },
    { id: 'suppliers', label: 'الموردون والمشتريات', icon: Building2 },
    { id: 'expenses', label: 'المصروفات والصندوق', icon: Wallet },
  ];

  const isSecondaryActive = secondary.some((item) => item.id === activeTab);

  const select = (id: string) => {
    setMoreOpen(false);
    onSelectTab(id);
  };

  return <>
    <div className="hidden md:block sticky top-[65px] z-20 bg-stone-900/95 backdrop-blur-md border-b border-amber-900/40 text-stone-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1.5 overflow-visible py-1.5">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 min-w-0">
            {primary.map((tab) => <NavButton key={tab.id} tab={tab} active={activeTab === tab.id} onClick={() => select(tab.id)} />)}
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${isSecondaryActive || moreOpen ? 'bg-amber-500 text-stone-950 shadow-md font-bold' : 'text-stone-300 hover:text-white hover:bg-stone-800/80'}`}
            >
              <span>{isSecondaryActive ? secondary.find((item) => item.id === activeTab)?.label : 'المزيد'}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>
            {moreOpen && (
              <>
                <button aria-label="إغلاق القائمة" className="fixed inset-0 z-40 cursor-default" onClick={() => setMoreOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-stone-700 bg-stone-900/98 backdrop-blur-xl p-2 shadow-2xl">
                  <div className="px-3 py-2 text-[11px] font-bold text-stone-500">إدارة المعمل — الأقسام الأقل استخدامًا</div>
                  <div className="grid grid-cols-1 gap-1">
                    {secondary.map((item) => {
                      const Icon = item.icon;
                      const active = activeTab === item.id;
                      return <button key={item.id} type="button" onClick={() => select(item.id)} className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-right transition ${active ? 'bg-amber-500 text-stone-950' : 'text-stone-200 hover:bg-stone-800'}`}>
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-stone-950/10' : 'bg-stone-800'}`}><Icon className="w-4 h-4" /></span>
                        <span className="flex-1 text-xs font-bold">{item.label}</span>
                      </button>;
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>

    {activeTab === 'recipes' && <Overlay onBack={() => onSelectTab('production')}><RecipesView /></Overlay>}
    {activeTab === 'recipeLibrary' && <Overlay onBack={() => onSelectTab('recipes')}><RecipeLibraryView /></Overlay>}
    {activeTab === 'manufacturedMaterials' && <Overlay onBack={() => onSelectTab('rawMaterials')}><ManufacturedMaterialsView /></Overlay>}
  </>;
};

const NavButton: React.FC<{ tab: NavItem; active: boolean; onClick: () => void }> = ({ tab, active, onClick }) => {
  const Icon = tab.icon;
  return <button type="button" onClick={onClick} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${active ? 'bg-amber-500 text-stone-950 shadow-md font-bold' : 'text-stone-300 hover:text-white hover:bg-stone-800/80'}`}>
    <Icon className={`w-4 h-4 ${active ? 'text-stone-950' : 'text-amber-400'}`} />
    <span>{tab.label}</span>
    {tab.badge && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${active ? 'bg-stone-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'}`}>{tab.badge}</span>}
  </button>;
};

const Overlay: React.FC<{ children: React.ReactNode; onBack: () => void }> = ({ children, onBack }) => <section className="w-full bg-stone-100 dark:bg-stone-950 pb-6">
  <div className="max-w-7xl mx-auto p-3 sm:p-5 lg:p-6">
    <div className="flex items-center justify-between gap-3 mb-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 shadow-sm">
      <div className="text-xs font-bold text-stone-600 dark:text-stone-300">قسم مستقل <span className="mx-1 text-stone-300">/</span><span className="text-amber-600 dark:text-amber-400">إدارة المعمل</span></div>
      <button onClick={onBack} className="touch-target inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-bold shadow-sm hover:opacity-90 transition"><RotateCcw className="w-3.5 h-3.5" />العودة</button>
    </div>
    <Suspense fallback={<div className="rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-10 text-center text-sm font-bold text-stone-500">جارٍ تحميل القسم…</div>}>{children}</Suspense>
  </div>
</section>;
