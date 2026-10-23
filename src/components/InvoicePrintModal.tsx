import React from 'react';
import { formatYER, formatNumber } from '../services/storage';
import { Distribution, CollectionEntry, Distributor, DistributorLedgerItem } from '../types';
import { Printer, X, Download } from 'lucide-react';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  distribution?: Distribution | null;
  collection?: CollectionEntry | null;
  distributorLedger?: {
    distributor: Distributor;
    items: DistributorLedgerItem[];
  } | null;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  distribution,
  collection,
  distributorLedger
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white text-stone-900 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[95vh] overflow-y-auto">
        {/* Controls - Hidden in Print */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-amber-700">معاينة للطباعة والمشاركة</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs shadow transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة المستند</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-sm text-xs font-sans space-y-4 print:border-none print:p-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-amber-800">معمل حلويات مذاق MADHAQ</h1>
              <p className="text-[11px] text-stone-500">صنعاء - الجمهورية اليمنية • هاتف: 771234567</p>
            </div>
            <div className="w-14 h-14 bg-stone-950 rounded-xl p-1 flex items-center justify-center overflow-hidden">
              <img src="/madhaq_logo.png" alt="شعار مذاق" className="h-full w-full object-contain" />
            </div>
          </div>

          {/* DISTRIBUTION INVOICE PRINT */}
          {distribution && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between font-bold">
                <span className="text-amber-900">فاتورة توزيع بضاعة</span>
                <span className="font-mono text-amber-800">{distribution.displayNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-500 block">الموزع المستلم:</span>
                  <span className="font-bold text-sm">{distribution.distributorName}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-stone-500 block font-sans">تاريخ الفاتورة:</span>
                  <span className="font-semibold">{distribution.date}</span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-right text-[11px] border border-stone-200 rounded-xl overflow-hidden">
                <thead className="bg-stone-100 font-bold border-b">
                  <tr>
                    <th className="p-2">الصنف</th>
                    <th className="p-2 text-center">الكمية</th>
                    <th className="p-2 text-left">السعر</th>
                    <th className="p-2 text-left">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {distribution.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-sans font-medium">{it.productName}</td>
                      <td className="p-2 text-center font-bold">{it.quantity} {it.unit}</td>
                      <td className="p-2 text-left">{formatYER(it.unitPriceYER)}</td>
                      <td className="p-2 text-left font-bold">{formatYER(it.totalYER)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div className="bg-stone-50 p-3 rounded-xl border space-y-1.5 font-mono text-xs">
                <div className="flex justify-between font-bold">
                  <span className="font-sans">إجمالي الفاتورة:</span>
                  <span>{formatYER(distribution.grossYER)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span className="font-sans">المقبوض نقدًا:</span>
                  <span>{formatYER(distribution.cashPaidYER)}</span>
                </div>
                <div className="flex justify-between font-bold text-amber-800 pt-1 border-t">
                  <span className="font-sans">المتبقي آجل على الحساب:</span>
                  <span className="text-sm">{formatYER(distribution.creditYER)}</span>
                </div>
              </div>

              {distribution.note && (
                <div className="text-[11px] text-stone-500">
                  ملاحظة: {distribution.note}
                </div>
              )}
            </div>
          )}

          {/* COLLECTION RECEIPT PRINT */}
          {collection && (
            <div className="space-y-4">
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center justify-between font-bold">
                <span className="text-emerald-900">سند قبض تحصيل نقدي</span>
                <span className="font-mono text-emerald-800">{collection.displayNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-500 block">وصلنا من الأخ الموزع:</span>
                  <span className="font-bold text-sm">{collection.distributorName}</span>
                </div>
                <div className="text-left font-mono">
                  <span className="text-stone-500 block font-sans">تاريخ القبض:</span>
                  <span className="font-semibold">{collection.date}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl text-center space-y-1">
                <span className="text-xs text-emerald-800 block">المبلغ المقبوض:</span>
                <span className="text-2xl font-black font-mono text-emerald-700">{formatYER(collection.amountYER)}</span>
                <div className="text-[11px] text-stone-500">
                  طريقة السداد: {collection.method === 'CASH' ? 'نقدًا' : collection.method === 'TRANSFER' ? 'حوالة' : 'شيك'}
                  {collection.reference && ` • رقم المرجع: ${collection.reference}`}
                </div>
              </div>

              {collection.note && (
                <div className="text-[11px] text-stone-500">
                  بيان السند: {collection.note}
                </div>
              )}
            </div>
          )}

          {/* DISTRIBUTOR LEDGER STATEMENT PRINT */}
          {distributorLedger && (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between font-bold">
                <span className="text-amber-900">كشف حساب موزع معتمد</span>
                <span>{distributorLedger.distributor.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-500">هاتف الموزع:</span> {distributorLedger.distributor.phone}
                </div>
                <div className="text-left">
                  <span className="text-stone-500">سقف الدين:</span> {formatYER(distributorLedger.distributor.debtLimitYER)}
                </div>
              </div>

              <table className="w-full text-right text-[10px] border border-stone-200 rounded-xl overflow-hidden font-mono">
                <thead className="bg-stone-100 font-bold border-b font-sans">
                  <tr>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">المرجع</th>
                    <th className="p-2">البيان</th>
                    <th className="p-2 text-left">مدين</th>
                    <th className="p-2 text-left">دائن</th>
                    <th className="p-2 text-left">الرصيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {distributorLedger.items.map((row) => (
                    <tr key={row.id}>
                      <td className="p-2 whitespace-nowrap">{row.date}</td>
                      <td className="p-2 font-bold text-amber-700">{row.refNumber}</td>
                      <td className="p-2 font-sans">{row.description}</td>
                      <td className="p-2 text-left">{row.debitYER > 0 ? formatYER(row.debitYER) : '-'}</td>
                      <td className="p-2 text-left text-emerald-700">{row.creditYER > 0 ? formatYER(row.creditYER) : '-'}</td>
                      <td className="p-2 text-left font-black">{formatYER(row.balanceYER)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Signature Strip */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t text-[11px] text-center font-bold text-stone-600">
            <div>
              <span className="block mb-6">توقيع المستلم:</span>
              <span className="border-b border-stone-400 w-32 inline-block"></span>
            </div>
            <div>
              <span className="block mb-6">توقيع المحاسب / إدارة المعمل:</span>
              <span className="border-b border-stone-400 w-32 inline-block"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
