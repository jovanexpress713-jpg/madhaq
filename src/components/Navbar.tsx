import React from 'react';
import { OfflineBadge } from './OfflineBadge';
import { Plus, Database, Sparkles, Receipt, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  onOpenDistribution: () => void;
  onOpenCollection: () => void;
  onOpenProduction: () => void;
  onOpenBackup: () => void;
  onSelectTab: (tab: string) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenDistribution,
  onOpenCollection,
  onOpenProduction,
  onOpenBackup,
  onSelectTab,
  activeTab
}) => {
  const todayStr = new Intl.DateTimeFormat('ar-YE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  return (
    <header className="bg-stone-900 border-b border-amber-800/40 sticky top-0 z-30 shadow-lg text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Logo and Brand Title */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-black/60 border border-amber-500/40 p-1 flex items-center justify-center overflow-hidden shadow-inner group-hover:border-amber-400 transition">
            <img
              src="/madhaq_logo.png"
              alt="شعار معمل مذاق"
              className="h-full w-full object-contain"
              onError={(e) => {
                // fallback if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-amber-400">
                مذاق <span className="text-amber-200/90 text-sm font-semibold tracking-wider font-mono">MADHAQ</span>
              </span>
              <span className="hidden md:inline-block bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-medium">
                معمل الحلويات الفاخرة
              </span>
            </div>
            <div className="text-[11px] text-stone-400 hidden sm:block">
              نظام إدارة المعمل، التوزيع، المخزون وكشف الخميس
            </div>
          </div>
        </div>

        {/* Center / Date badge */}
        <div className="hidden lg:flex items-center gap-2">
          <OfflineBadge />
          <span className="text-xs text-amber-200/70 border-r border-stone-700 pr-2 mr-1">
            {todayStr}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Distribution */}
          <button
            onClick={onOpenDistribution}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
            title="إنشاء فاتورة توزيع جديدة"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">توزيع جديد</span>
          </button>

          {/* Quick Collection */}
          <button
            onClick={onOpenCollection}
            className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-600/30 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95"
            title="تسجيل سند تحصيل نقد أو حوالة"
          >
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">تحصيل</span>
          </button>

          {/* Quick Production Batch */}
          <button
            onClick={onOpenProduction}
            className="hidden md:flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-200 border border-stone-700 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-95"
            title="تسجيل دفعة إنتاج جديدة"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>دفعة إنتاج</span>
          </button>

          {/* Backup Button */}
          <button
            onClick={onOpenBackup}
            className="flex items-center gap-1.5 bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white p-2 sm:px-3 sm:py-2 rounded-xl border border-stone-700/80 text-xs font-semibold transition"
            title="النسخ الاحتياطي وإدارة البيانات"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">النسخ الاحتياطي</span>
          </button>
        </div>
      </div>
    </header>
  );
};
