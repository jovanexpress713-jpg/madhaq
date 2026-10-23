import React from 'react';
import { storage, formatYER, formatNumber } from '../services/storage';
import {
  Truck,
  Receipt,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarCheck,
  UtensilsCrossed,
  Boxes,
  Plus,
  Coins,
  ShieldAlert,
  Building2,
  Package,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { Distribution, CollectionEntry } from '../types';

interface DashboardProps {
  onOpenDistribution: () => void;
  onOpenCollection: () => void;
  onOpenProduction: () => void;
  onOpenPurchase: () => void;
  onSelectTab: (tab: string) => void;
  onPrintDistribution: (dist: Distribution) => void;
  onPrintCollection: (col: CollectionEntry) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onOpenDistribution,
  onOpenCollection,
  onOpenProduction,
  onOpenPurchase,
  onSelectTab,
  onPrintDistribution,
  onPrintCollection
}) => {
  const db = storage.getDatabase();
  const cashSummary = storage.getCashboxSummary();

  // حساب إجمالي ديون الموزعين
  const totalDistributorDebt = db.distributors
    .filter((d) => d.active)
    .reduce((sum, d) => sum + storage.getDistributorFinancials(d.id).currentDebt, 0);

  // حساب إجمالي مستحقات الموردين
  const totalSupplierPayables = db.suppliers
    .filter((s) => s.active)
    .reduce((sum, s) => sum + storage.getSupplierFinancials(s.id).currentBalance, 0);

  // إجمالي العمولات المستحقة للموزعين (منفصلة عن الدين)
  const totalCommissionsEarned = db.distributors
    .filter((d) => d.active)
    .reduce((sum, d) => sum + storage.getDistributorFinancials(d.id).totalCommissionsEarned, 0);

  // تنبيهات المنتجات المنخفضة
  const lowStockProducts = db.products.filter(
    (p) => p.active && p.stockQty <= p.minimumQty
  );

  // تنبيهات المواد الخام المنخفضة
  const lowStockRawMaterials = db.rawMaterials.filter(
    (r) => r.active && r.stockQty <= r.minimumQty
  );

  // تنبيهات الموزعين متجاوزي سقف الدين
  const overLimitDistributors = db.distributors.filter((d) => {
    if (!d.active || d.debtLimitYER <= 0) return false;
    const fin = storage.getDistributorFinancials(d.id);
    return fin.currentDebt > d.debtLimitYER;
  });

  const recentDistributions = db.distributions.slice(0, 6);
  const recentCollections = db.collections.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Quick Factory Banner */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 border border-amber-600/30 rounded-3xl p-5 sm:p-7 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-3 py-1 rounded-full font-bold">
              <span>معمل حلويات مذاق MADHAQ</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>نظام تشغيل محلي 100%</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
              لوحة التحكم والمؤشرات المالية
            </h1>
            <p className="text-stone-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              إدارة شاملة لتوزيع أصناف الحلويات، تحصيل النقد والآجل، قيود كشف الخميس، ومخزون المواد الخام وتكاليف الإنتاج.
            </p>
          </div>

          {/* Quick Operations Button Bar */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={onOpenDistribution}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-lg transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>فاتورة توزيع</span>
            </button>

            <button
              onClick={onOpenCollection}
              className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/40 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95"
            >
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>سند تحصيل</span>
            </button>

            <button
              onClick={onOpenProduction}
              className="flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-semibold px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm transition active:scale-95"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>دفعة إنتاج</span>
            </button>

            <button
              onClick={() => onSelectTab('thursday')}
              className="flex items-center justify-center gap-2 bg-amber-950/60 hover:bg-amber-900/60 text-amber-200 border border-amber-600/40 font-semibold px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm transition active:scale-95"
            >
              <CalendarCheck className="w-4 h-4 text-amber-400" />
              <span>كشف الخميس</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* إجمالي ديون الموزعين */}
        <div 
          onClick={() => onSelectTab('distributors')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              إجمالي ديون الموزعين (مستحق للمعمل)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {formatYER(totalDistributorDebt)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>{db.distributors.filter((d) => d.active).length} موزعين نشطين</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
              عرض الحسابات <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* إجمالي مستحقات الموردين */}
        <div 
          onClick={() => onSelectTab('suppliers')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              مستحقات الموردين (التزامات المعمل)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tracking-tight">
            {formatYER(totalSupplierPayables)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>{db.suppliers.filter((s) => s.active).length} موردين معتمدين</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-0.5">
              عرض المشتريات <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* رصيد الصندوق النقدي */}
        <div 
          onClick={() => onSelectTab('expenses')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              صافي السيولة النقدية (الصندوق)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono tracking-tight ${
            cashSummary.netCashBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
          }`}>
            {formatYER(cashSummary.netCashBalance)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>وارد: {formatYER(cashSummary.totalCashIn)}</span>
            <span className="text-stone-400">منصرف: {formatYER(cashSummary.totalCashOut)}</span>
          </div>
        </div>

        {/* عمولات الموزعين المستحقة (منفصلة عن الدين) */}
        <div 
          onClick={() => onSelectTab('thursday')}
          className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              عمولات الموزعين المستحقة (حساب مستقل)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">
            {formatYER(totalCommissionsEarned)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
            <span>تحسب منفصلة عن دين البضاعة</span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
              كشف الخميس <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>

      {/* Warning & Alerts Section (if any alerts exist) */}
      {(overLimitDistributors.length > 0 || lowStockProducts.length > 0 || lowStockRawMaterials.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>تنبيهات هامة تحتاج متابعة:</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* تجاوز سقف الدين */}
            {overLimitDistributors.length > 0 && (
              <div className="bg-white dark:bg-stone-900/80 p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <ShieldAlert className="w-4 h-4" />
                  <span>تجاوز سقف الدين ({overLimitDistributors.length} موزع)</span>
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-300">
                  {overLimitDistributors.map((d) => d.name).join('، ')}
                </div>
              </div>
            )}

            {/* نقص المنتجات الجاهزة */}
            {lowStockProducts.length > 0 && (
              <div className="bg-white dark:bg-stone-900/80 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Package className="w-4 h-4" />
                  <span>انخفاض منتجات تامة ({lowStockProducts.length} صنف)</span>
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-300">
                  {lowStockProducts.map((p) => `${p.name} (${p.stockQty} ${p.unit})`).join('، ')}
                </div>
              </div>
            )}

            {/* نقص المواد الخام */}
            {lowStockRawMaterials.length > 0 && (
              <div className="bg-white dark:bg-stone-900/80 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <Boxes className="w-4 h-4" />
                  <span>مواد خام قاربت على النفاد ({lowStockRawMaterials.length} مادة)</span>
                </div>
                <div className="text-[11px] text-stone-600 dark:text-stone-300">
                  {lowStockRawMaterials.map((r) => `${r.name} (${r.stockQty} ${r.unit})`).join('، ')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid: Recent Distributions & Recent Collections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* فواتير التوزيع الأخيرة */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  فواتير التوزيع الأخيرة
                </h3>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">المبيعات للموزعين والمحلات</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('distributions')}
              className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1"
            >
              عرض الكل ({db.distributions.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentDistributions.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">لا توجد فواتير توزيع مسجلة بعد.</div>
            ) : (
              recentDistributions.map((dist) => (
                <div key={dist.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <span className="font-mono text-amber-600 dark:text-amber-400 text-[11px]">{dist.displayNumber}</span>
                      <span>{dist.distributorName}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                      <span>{dist.date}</span>
                      <span>•</span>
                      <span>{dist.items.length} أصناف</span>
                      {dist.cashPaidYER > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          نقداً: {formatYER(dist.cashPaidYER)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-left font-mono">
                      <div className="font-bold text-stone-900 dark:text-stone-100">{formatYER(dist.grossYER)}</div>
                      <div className="text-[10px] text-amber-600 dark:text-amber-400">آجل: {formatYER(dist.creditYER)}</div>
                    </div>
                    <button
                      onClick={() => onPrintDistribution(dist)}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                      title="طباعة الفاتورة"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* سندات التحصيل الأخيرة */}
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100">
                  سندات التحصيل الأخيرة
                </h3>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">سدادات الموزعين الصادرة</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('collections')}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              عرض الكل ({db.collections.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentCollections.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">لا توجد سندات تحصيل مسجلة بعد.</div>
            ) : (
              recentCollections.map((col) => (
                <div key={col.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">{col.displayNumber}</span>
                      <span>{col.distributorName}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2">
                      <span>{col.date}</span>
                      <span>•</span>
                      <span className="bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[10px]">
                        {col.method === 'CASH' ? 'نقدًا' : col.method === 'TRANSFER' ? 'حوالة' : 'شيك'}
                      </span>
                      {col.reference && <span>مرجع: {col.reference}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatYER(col.amountYER)}
                    </div>
                    <button
                      onClick={() => onPrintCollection(col)}
                      className="p-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
                      title="طباعة سند القبض"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
