import React, { useState, useEffect } from 'react';
import { storage, formatYER } from './services/storage';
import { Navbar } from './components/Navbar';
import { NavigationTabs } from './components/NavigationTabs';
import { BottomNav } from './components/BottomNav';
import { MobileMoreModal } from './components/MobileMoreModal';
import { Dashboard } from './components/Dashboard';
import { DistributorsView } from './components/DistributorsView';
import { CustomerOperationsView } from './components/CustomerOperationsView';
import { ProductsView } from './components/ProductsView';
import { RawMaterialsView } from './components/RawMaterialsView';
import { SuppliersView } from './components/SuppliersView';
import { PurchasesView } from './components/PurchasesView';
import { ProductionView } from './components/ProductionView';
import { ThursdayReportView } from './components/ThursdayReportView';
import { ExpensesView } from './components/ExpensesView';
import { DistributionInvoiceModal } from './components/DistributionInvoiceModal';
import { CollectionModal } from './components/CollectionModal';
import { ReturnsModal } from './components/ReturnsModal';
import { BackupSettingsModal } from './components/BackupSettingsModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { Distribution, CollectionEntry, Distributor, DistributorLedgerItem } from './types';
import {
  Truck,
  Receipt,
  Plus,
  Printer,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    const welcomeTimer = window.setTimeout(() => setShowWelcome(false), 1850);
    return () => window.clearTimeout(welcomeTimer);
  }, []);

  // Modals state
  const [isDistributionOpen, setIsDistributionOpen] = useState(false);
  const [targetDistributorForDist, setTargetDistributorForDist] = useState<string | undefined>(undefined);

  const [isCollectionOpen, setIsCollectionOpen] = useState(false);
  const [targetDistributorForCol, setTargetDistributorForCol] = useState<string | undefined>(undefined);

  const [isProductionBatchOpen, setIsProductionBatchOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isReturnsOpen, setIsReturnsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // Print modal state
  const [printDistribution, setPrintDistribution] = useState<Distribution | null>(null);
  const [printCollection, setPrintCollection] = useState<CollectionEntry | null>(null);
  const [printDistributorLedger, setPrintDistributorLedger] = useState<{
    distributor: Distributor;
    items: DistributorLedgerItem[];
  } | null>(null);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const openDistributionFor = (distId?: string) => {
    setTargetDistributorForDist(distId);
    setIsDistributionOpen(true);
  };

  const openCollectionFor = (distId?: string) => {
    setTargetDistributorForCol(distId);
    setIsCollectionOpen(true);
  };

  const handlePrintLedger = (distributor: Distributor, items: DistributorLedgerItem[]) => {
    setPrintDistribution(null);
    setPrintCollection(null);
    setPrintDistributorLedger({ distributor, items });
  };

  const handlePrintDistribution = (dist: Distribution) => {
    setPrintCollection(null);
    setPrintDistributorLedger(null);
    setPrintDistribution(dist);
  };

  const handlePrintCollection = (col: CollectionEntry) => {
    setPrintDistribution(null);
    setPrintDistributorLedger(null);
    setPrintCollection(col);
  };

  const closePrintModal = () => {
    setPrintDistribution(null);
    setPrintCollection(null);
    setPrintDistributorLedger(null);
  };

  const db = storage.getDatabase();

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col font-sans pb-20 md:pb-6 selection:bg-amber-500/30">
      {showWelcome && (
        <div className="madhaq-splash fixed inset-0 z-[100] flex items-center justify-center overflow-hidden" role="status" aria-live="polite">
          <div className="madhaq-splash-glow madhaq-splash-glow-one" />
          <div className="madhaq-splash-glow madhaq-splash-glow-two" />
          <div className="relative z-10 flex flex-col items-center text-center px-6">
            <div className="madhaq-splash-logo-wrap"><img src="/madhaq_logo.png" alt="شعار مذاق" className="madhaq-splash-logo" /></div>
            <div className="madhaq-splash-title">مذاق <span>MADHAQ</span></div>
            <p className="madhaq-splash-subtitle">كل تفاصيل المعمل… في مكان واحد</p>
            <div className="madhaq-splash-track"><span /></div>
            <p className="mt-3 text-[10px] tracking-wide text-amber-100/55">نظام إدارة الإنتاج والمخزون والتوزيع</p>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Navbar
        onOpenDistribution={() => openDistributionFor()}
        onOpenCollection={() => openCollectionFor()}
        onOpenProduction={() => setIsProductionBatchOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onSelectTab={setActiveTab}
        activeTab={activeTab}
      />

      {/* Desktop Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenDistribution={() => openDistributionFor()}
            onOpenCollection={() => openCollectionFor()}
            onOpenProduction={() => setIsProductionBatchOpen(true)}
            onOpenPurchase={() => setIsPurchaseOpen(true)}
            onSelectTab={setActiveTab}
            onPrintDistribution={handlePrintDistribution}
            onPrintCollection={handlePrintCollection}
          />
        )}

        {/* DISTRIBUTORS */}
        {activeTab === 'distributors' && (
          <DistributorsView
            onOpenDistributionFor={openDistributionFor}
            onOpenCollectionFor={openCollectionFor}
            onPrintLedger={handlePrintLedger}
          />
        )}

        {/* DISTRIBUTIONS LIST */}
        {activeTab === 'distributions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">سجل فواتير التوزيع والمبيعات</h2>
                  <p className="text-xs text-stone-500">فواتير بضاعة الحلويات الصادرة للموزعين والمحلات</p>
                </div>
              </div>
              <button
                onClick={() => openDistributionFor()}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>فاتورة توزيع جديدة</span>
              </button>
            </div>

            <div className="space-y-3">
              {db.distributions.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-sm bg-white dark:bg-stone-900 border rounded-3xl">
                  لا توجد فواتير توزيع مسجلة بعد.
                </div>
              ) : (
                db.distributions.map((dist) => (
                  <div
                    key={dist.id}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-stone-100 dark:border-stone-800">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-sm text-amber-600 dark:text-amber-400">
                          {dist.displayNumber}
                        </span>
                        <span className="font-bold text-stone-900 dark:text-stone-100">
                          {dist.distributorName}
                        </span>
                        <span className="text-xs text-stone-400">({dist.date})</span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-mono">
                        <span>
                          إجمالي: <strong className="text-stone-900 dark:text-stone-100 text-sm">{formatYER(dist.grossYER)}</strong>
                        </span>
                        {dist.cashPaidYER > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            نقداً: {formatYER(dist.cashPaidYER)}
                          </span>
                        )}
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          آجل: {formatYER(dist.creditYER)}
                        </span>
                        <button
                          onClick={() => handlePrintDistribution(dist)}
                          className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 font-sans font-semibold flex items-center gap-1 text-[11px]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>طباعة</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {dist.items.map((it, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700">
                          <div className="font-semibold">{it.productName}</div>
                          <div className="text-[11px] text-stone-500 flex items-center justify-between mt-1 font-mono">
                            <span>{it.quantity} {it.unit} × {formatYER(it.unitPriceYER)}</span>
                            <span className="font-bold text-amber-600">{formatYER(it.totalYER)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {dist.note && (
                      <div className="text-[11px] text-stone-500">
                        ملاحظة: {dist.note}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COLLECTIONS LIST */}
        {activeTab === 'collections' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">سجل سندات التحصيل والقبض</h2>
                  <p className="text-xs text-stone-500">المبالغ المقبوضة نقدًا أو بحوالات لتخفيض ديون الموزعين</p>
                </div>
              </div>
              <button
                onClick={() => openCollectionFor()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>سند تحصيل جديد</span>
              </button>
            </div>

            <div className="space-y-3">
              {db.collections.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-sm bg-white dark:bg-stone-900 border rounded-3xl">
                  لا توجد سندات تحصيل مسجلة بعد.
                </div>
              ) : (
                db.collections.map((col) => (
                  <div
                    key={col.id}
                    className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {col.displayNumber}
                        </span>
                        <span className="font-bold text-base text-stone-900 dark:text-stone-100">
                          {col.distributorName}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 flex items-center gap-3">
                        <span>{col.date}</span>
                        <span>•</span>
                        <span className="bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                          {col.method === 'CASH' ? 'نقدًا كاش' : col.method === 'TRANSFER' ? 'حوالة / صرافة' : 'شيك'}
                        </span>
                        {col.reference && <span>مرجع: {col.reference}</span>}
                      </div>
                      {col.note && <div className="text-[11px] text-stone-400">{col.note}</div>}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="font-mono font-black text-xl text-emerald-600 dark:text-emerald-400">
                        {formatYER(col.amountYER)}
                      </div>
                      <button
                        onClick={() => handlePrintCollection(col)}
                        className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 flex items-center gap-1 text-xs font-semibold"
                      >
                        <Printer className="w-4 h-4" />
                        <span>طباعة السند</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* CUSTOMER LEDGER AND SUPPLY REQUESTS */}
        {activeTab === 'customers' && <CustomerOperationsView />}

        {/* THURSDAY REPORT */}
        {activeTab === 'thursday' && <ThursdayReportView />}

        {/* PRODUCTION & RECIPES */}
        {activeTab === 'production' && (
          <ProductionView
            isOpenBatchModal={isProductionBatchOpen}
            onCloseBatchModal={() => setIsProductionBatchOpen(false)}
            onOpenBatchModal={() => setIsProductionBatchOpen(true)}
            onSuccessBatch={() => setTick((t) => t + 1)}
          />
        )}

        {/* PRODUCTS */}
        {activeTab === 'products' && <ProductsView />}

        {/* RAW MATERIALS */}
        {activeTab === 'rawMaterials' && <RawMaterialsView />}

        {/* SUPPLIERS & PURCHASES */}
        {activeTab === 'suppliers' && (
          <div className="space-y-8">
            <SuppliersView onOpenNewPurchase={() => setIsPurchaseOpen(true)} />
            <PurchasesView
              isOpenModal={isPurchaseOpen}
              onCloseModal={() => setIsPurchaseOpen(false)}
            />
          </div>
        )}

        {/* EXPENSES & CASHBOX */}
        {activeTab === 'expenses' && <ExpensesView />}
      </main>

      {/* Bottom Navigation for Mobile Phone Screens */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenMore={() => setIsMoreMenuOpen(true)}
      />

      {/* Mobile Drawer / More Sections Modal */}
      <MobileMoreModal
        isOpen={isMoreMenuOpen}
        onClose={() => setIsMoreMenuOpen(false)}
        onSelectTab={setActiveTab}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenReturns={() => setIsReturnsOpen(true)}
      />

      {/* Distribution Invoice Modal */}
      <DistributionInvoiceModal
        isOpen={isDistributionOpen}
        onClose={() => {
          setIsDistributionOpen(false);
          setTargetDistributorForDist(undefined);
        }}
        initialDistributorId={targetDistributorForDist}
        onSuccess={(dist) => {
          handlePrintDistribution(dist);
        }}
      />

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isCollectionOpen}
        onClose={() => {
          setIsCollectionOpen(false);
          setTargetDistributorForCol(undefined);
        }}
        initialDistributorId={targetDistributorForCol}
        onSuccess={(col) => {
          handlePrintCollection(col);
        }}
      />

      {/* Returns Modal */}
      <ReturnsModal
        isOpen={isReturnsOpen}
        onClose={() => setIsReturnsOpen(false)}
        onSuccess={(entry) => {
          // returns saved
        }}
      />

      {/* Backup and Local Data Modal */}
      <BackupSettingsModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onDataChanged={() => setTick((t) => t + 1)}
      />

      {/* Printable Invoice / Receipt Modal */}
      <InvoicePrintModal
        isOpen={!!printDistribution || !!printCollection || !!printDistributorLedger}
        onClose={closePrintModal}
        distribution={printDistribution}
        collection={printCollection}
        distributorLedger={printDistributorLedger}
      />
    </div>
  );
}
