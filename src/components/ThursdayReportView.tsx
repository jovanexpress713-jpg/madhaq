import React, { useState } from 'react';
import { storage, formatYER, formatNumber } from '../services/storage';
import { ThursdayReportRow } from '../types';
import { getLatestThursdayWeekRange } from '../services/thursdayWeekRange';
import {
  CalendarCheck,
  Printer,
  Download,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const ThursdayReportView: React.FC = () => {
  // الافتراضي هو آخر أسبوع عمل كامل من الجمعة إلى الخميس، بالتاريخ المحلي.
  const defaultDates = getLatestThursdayWeekRange();

  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [selectedDistributorFilter, setSelectedDistributorFilter] = useState('ALL');

  const allRows = storage.getThursdayReport(startDate, endDate);
  const rows = allRows.filter(
    (r) => selectedDistributorFilter === 'ALL' || r.distributorId === selectedDistributorFilter
  );

  // إجماليات الكشف
  const totalOpening = rows.reduce((s, r) => s + r.openingDebtYER, 0);
  const totalDistributions = rows.reduce((s, r) => s + r.weeklyDistributionsYER, 0);
  const totalCashPaid = rows.reduce((s, r) => s + r.weeklyCashPaidYER, 0);
  const totalCredit = rows.reduce((s, r) => s + r.weeklyCreditYER, 0);
  const totalCollections = rows.reduce((s, r) => s + r.weeklyCollectionsYER, 0);
  const totalReturns = rows.reduce((s, r) => s + r.weeklyReturnsYER, 0);
  const totalClosing = rows.reduce((s, r) => s + r.closingDebtYER, 0);
  const totalCommissions = rows.reduce((s, r) => s + r.weeklyCommissionYER, 0);

  const distributors = storage.getDistributors().filter((d) => d.active);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'اسم الموزع',
      'رقم الهاتف',
      'رصيد أول المدة',
      'إجمالي التوزيعات',
      'المقبوض نقدًا',
      'الآجل المضاف',
      'التحصيلات',
      'المرتجعات',
      'رصيد آخر المدة (الدين الصافي)',
      'العمولة المستحقة'
    ];

    const csvContent =
      '\uFEFF' +
      headers.join(',') +
      '\n' +
      rows
        .map((r) =>
          [
            `"${r.distributorName}"`,
            `"${r.phone}"`,
            r.openingDebtYER,
            r.weeklyDistributionsYER,
            r.weeklyCashPaidYER,
            r.weeklyCreditYER,
            r.weeklyCollectionsYER,
            r.weeklyReturnsYER,
            r.closingDebtYER,
            r.weeklyCommissionYER
          ].join(',')
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `كشف_الخميس_مذاق_${startDate}_إلى_${endDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>كشف الخميس الأسبوعي المعتمد</span>
              <span className="text-xs font-normal bg-amber-500/20 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                تسوية أسبوعية
              </span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              تقرير المطابقة الشامل لحسابات وتوزيعات وتحصيلات الموزعين مع فصل العمولات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 px-3.5 py-2 rounded-2xl text-xs font-bold transition"
            title="تصدير ملف إكسل"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تصدير Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-4 py-2 rounded-2xl text-xs font-bold shadow-md transition active:scale-95"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الكشف</span>
          </button>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs print:hidden">
        <div>
          <label className="block font-bold mb-1 text-stone-600 dark:text-stone-300">من تاريخ:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
          />
        </div>

        <div>
          <label className="block font-bold mb-1 text-stone-600 dark:text-stone-300">إلى تاريخ:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
          />
        </div>

        <div>
          <label className="block font-bold mb-1 text-stone-600 dark:text-stone-300">تصفية حسب الموزع:</label>
          <select
            value={selectedDistributorFilter}
            onChange={(e) => setSelectedDistributorFilter(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs font-semibold"
          >
            <option value="ALL">جميع الموزعين المعتمدين</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-900 text-white p-5 rounded-3xl shadow-lg border border-amber-800/40 font-mono">
        <div>
          <span className="text-[11px] text-stone-400 block font-sans">إجمالي بضاعة الأسبوع:</span>
          <span className="text-base sm:text-lg font-bold text-amber-400">{formatYER(totalDistributions)}</span>
        </div>
        <div>
          <span className="text-[11px] text-stone-400 block font-sans">إجمالي المقبوضات والتحصيل:</span>
          <span className="text-base sm:text-lg font-bold text-emerald-400">{formatYER(totalCollections + totalCashPaid)}</span>
        </div>
        <div>
          <span className="text-[11px] text-stone-400 block font-sans">صافي الديون المتبقية:</span>
          <span className="text-base sm:text-lg font-black text-rose-400">{formatYER(totalClosing)}</span>
        </div>
        <div>
          <span className="text-[11px] text-stone-400 block font-sans">عمولات الأسبوع المستحقة:</span>
          <span className="text-base sm:text-lg font-bold text-blue-400">{formatYER(totalCommissions)}</span>
        </div>
      </div>

      {/* Printable Report Header for print mode */}
      <div className="hidden print:block text-center space-y-1 mb-6 border-b pb-4">
        <h1 className="text-2xl font-black">معمل حلويات مذاق - MADHAQ</h1>
        <h2 className="text-lg font-bold">كشف الخميس الأسبوعي ومطابقة حسابات الموزعين</h2>
        <p className="text-xs text-stone-600">
          عن الفترة من {startDate} إلى {endDate} • طبع بتاريخ: {new Date().toLocaleDateString('ar-YE')}
        </p>
      </div>

      {/* Report Table */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold border-b border-stone-200 dark:border-stone-700">
              <tr>
                <th className="p-3.5">اسم الموزع</th>
                <th className="p-3 text-left">رصيد أول المدة</th>
                <th className="p-3 text-left">التوزيعات (إجمالي)</th>
                <th className="p-3 text-left">المسدد نقدًا</th>
                <th className="p-3 text-left">الآجل المضاف</th>
                <th className="p-3 text-left">التحصيلات</th>
                <th className="p-3 text-left">المرتجعات</th>
                <th className="p-3 text-left bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
                  رصيد آخر المدة (الدين)
                </th>
                <th className="p-3 text-left bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200">
                  عمولة الأسبوع
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-mono">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-stone-400 font-sans">
                    لا توجد بيانات مطابقة لهذه الفترة.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.distributorId} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                    <td className="p-3.5 font-sans font-bold text-stone-900 dark:text-stone-100 whitespace-nowrap">
                      {row.distributorName}
                    </td>
                    <td className="p-3 text-left text-stone-600 dark:text-stone-400">
                      {formatYER(row.openingDebtYER)}
                    </td>
                    <td className="p-3 text-left text-stone-800 dark:text-stone-200">
                      {formatYER(row.weeklyDistributionsYER)}
                    </td>
                    <td className="p-3 text-left text-emerald-600 dark:text-emerald-400">
                      {row.weeklyCashPaidYER > 0 ? formatYER(row.weeklyCashPaidYER) : '-'}
                    </td>
                    <td className="p-3 text-left text-amber-600 dark:text-amber-400 font-semibold">
                      {formatYER(row.weeklyCreditYER)}
                    </td>
                    <td className="p-3 text-left text-emerald-600 dark:text-emerald-400 font-semibold">
                      {row.weeklyCollectionsYER > 0 ? formatYER(row.weeklyCollectionsYER) : '-'}
                    </td>
                    <td className="p-3 text-left text-rose-500">
                      {row.weeklyReturnsYER > 0 ? formatYER(row.weeklyReturnsYER) : '-'}
                    </td>
                    <td className="p-3 text-left font-black text-amber-600 dark:text-amber-400 text-sm bg-amber-50/50 dark:bg-amber-950/20">
                      {formatYER(row.closingDebtYER)}
                    </td>
                    <td className="p-3 text-left font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
                      {formatYER(row.weeklyCommissionYER)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-stone-100 dark:bg-stone-800 font-bold font-mono border-t-2 border-stone-300 dark:border-stone-600">
                <tr>
                  <td className="p-3.5 font-sans">الإجمالي العام</td>
                  <td className="p-3 text-left">{formatYER(totalOpening)}</td>
                  <td className="p-3 text-left">{formatYER(totalDistributions)}</td>
                  <td className="p-3 text-left text-emerald-600">{formatYER(totalCashPaid)}</td>
                  <td className="p-3 text-left text-amber-600">{formatYER(totalCredit)}</td>
                  <td className="p-3 text-left text-emerald-600">{formatYER(totalCollections)}</td>
                  <td className="p-3 text-left text-rose-500">{formatYER(totalReturns)}</td>
                  <td className="p-3 text-left text-amber-600 text-sm bg-amber-100/50 dark:bg-amber-900/30">
                    {formatYER(totalClosing)}
                  </td>
                  <td className="p-3 text-left text-blue-600 bg-blue-100/50 dark:bg-blue-900/30">
                    {formatYER(totalCommissions)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Accounting Guidelines Note */}
      <div className="p-4 bg-stone-100 dark:bg-stone-800/60 rounded-2xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300 space-y-1 leading-relaxed">
        <div className="font-bold text-stone-800 dark:text-stone-200">ملاحظات محاسبية هامة:</div>
        <p>• دين البضاعة محسوب من: (رصيد أول المدة + الآجل المضاف - التحصيلات - المرتجعات المعتمدة).</p>
        <p>• العمولات المكتسبة تسجل كبند مستقل مستحق للموزع ولا تدمج أو تخصم آليًا من دين البضاعة إلا بعد الاتفاق على تسوية صريحة بين الطرفين.</p>
      </div>
    </div>
  );
};
