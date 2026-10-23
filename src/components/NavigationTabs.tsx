import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Receipt,
  Users,
  CalendarCheck,
  UtensilsCrossed,
  Package,
  Boxes,
  Building2,
  Wallet,
  Settings
} from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onSelectTab
}) => {
  const tabs = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'distributions', label: 'فواتير التوزيع', icon: Truck },
    { id: 'collections', label: 'سندات التحصيل', icon: Receipt },
    { id: 'distributors', label: 'الموزعون والحسابات', icon: Users },
    { id: 'thursday', label: 'كشف الخميس الأسبوعي', icon: CalendarCheck, badge: 'رئيسي' },
    { id: 'production', label: 'الوصفات والإنتاج', icon: UtensilsCrossed },
    { id: 'products', label: 'مخزون المنتجات', icon: Package },
    { id: 'rawMaterials', label: 'المواد الخام', icon: Boxes },
    { id: 'suppliers', label: 'الموردون والمشتريات', icon: Building2 },
    { id: 'expenses', label: 'المصروفات والصندوق', icon: Wallet },
  ];

  return (
    <div className="hidden md:block bg-stone-900/90 border-b border-amber-900/40 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-stone-950' : 'text-amber-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isActive ? 'bg-stone-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
