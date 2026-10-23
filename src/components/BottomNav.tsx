import React from 'react';
import {
  LayoutDashboard,
  Truck,
  Receipt,
  Users,
  UtensilsCrossed,
  Package,
  CalendarCheck,
  Building2,
  Wallet,
  Menu
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMore
}) => {
  const tabs = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'distributions', label: 'التوزيع', icon: Truck },
    { id: 'collections', label: 'التحصيل', icon: Receipt },
    { id: 'distributors', label: 'الموزعون', icon: Users },
    { id: 'thursday', label: 'كشف الخميس', icon: CalendarCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-stone-900/95 backdrop-blur-md border-t border-amber-900/40 text-stone-300 shadow-2xl px-2 py-1.5 md:hidden">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
                isActive
                  ? 'text-amber-400 font-bold scale-105'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-500/20 text-amber-400' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* More Menu Button for secondary sections */}
        <button
          onClick={onOpenMore}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            ['production', 'inventory', 'suppliers', 'expenses', 'backup'].includes(activeTab)
              ? 'text-amber-400 font-bold'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">المزيد...</span>
        </button>
      </div>
    </nav>
  );
};
