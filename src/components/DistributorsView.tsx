import React, { useState } from 'react';
import { storage, formatYER } from '../services/storage';
import { Distributor, DistributorLedgerItem } from '../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  ShieldAlert,
  Percent,
  Receipt,
  Truck,
  FileText,
  Edit2,
  X,
  Printer,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

interface DistributorsViewProps {
  onOpenDistributionFor: (distributorId: string) => void;
  onOpenCollectionFor: (distributorId: string) => void;
  onPrintLedger: (distributor: Distributor, ledger: DistributorLedgerItem[]) => void;
}

export const DistributorsView: React.FC<DistributorsViewProps> = ({
  onOpenDistributionFor,
  onOpenCollectionFor,
  onPrintLedger
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDist, setEditingDist] = useState<Distributor | null>(null);
  const [selectedLedgerDist, setSelectedLedgerDist] = useState<Distributor | null>(null);

  // فورم إضافة / تعديل
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [debtLimitYER, setDebtLimitYER] = useState<number>(500000);
  const [commissionType, setCommissionType] = useState<'PER_PIECE' | 'PERCENT'>('PER_PIECE');
  const [commissionValue, setCommissionValue] = useState<number>(50);
  const [openingDebtYER, setOpeningDebtYER] = useState<number>(0);
  const [formError, setFormError] = useState('');

  const distributors = storage.getDistributors().filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm)
  );

  const openAdd = () => {
    setEditingDist(null);
    setName('');
    setPhone('');
    setAddress('');
    setDebtLimitYER(500000);
    setCommissionType('PER_PIECE');
    setCommissionValue(50);
    setOpeningDebtYER(0);
    setFormError('');
    setShowAddModal(true);
  };

  const openEdit = (d: Distributor) => {
    setEditingDist(d);
    setName(d.name);
    setPhone(d.phone);
    setAddress(d.address || '');
    setDebtLimitYER(d.debtLimitYER || 0);
    setCommissionType(d.commissionType);
    setCommissionValue(d.commissionValue);
    setOpeningDebtYER(d.openingDebtYER || 0);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('يرجى إدخال اسم الموزع');
      return;
    }

    storage.saveDistributor({
      id: editingDist ? editingDist.id : undefined,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      debtLimitYER: Number(debtLimitYER) || 0,
      commissionType,
      commissionValue: Number(commissionValue) || 0,
      openingDebtYER: Number(openingDebtYER) || 0,
      active: true
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              دليل الموزعين والمحلات
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              متابعة ديون البضاعة، سقف الدين، نسب العمولات، وكشوفات الحساب
            </p>
          </div>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة موزع جديد</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute right-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          className="w-full pr-11 pl-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500 transition"
        />
      </div>

      {/* Distributors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {distributors.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-sm">
            لا يوجد موزعون مطابقون للبحث.
          </div>
        ) : (
          distributors.map((dist) => {
            const fin = storage.getDistributorFinancials(dist.id);
            const percentUsed =
              dist.debtLimitYER > 0
                ? Math.min(100, Math.round((fin.currentDebt / dist.debtLimitYER) * 100))
                : 0;

            return (
              <div
                key={dist.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-amber-400/50 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Distributor Name & Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {dist.name}
                      </h3>
                      {dist.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span dir="ltr">{dist.phone}</span>
                        </div>
                      )}
                      {dist.address && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{dist.address}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openEdit(dist)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                      title="تعديل بيانات الموزع"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Financial Status Box */}
                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-100 dark:border-stone-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">رصيد الدين الحالي:</span>
                      <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                        {formatYER(fin.currentDebt)}
                      </span>
                    </div>

                    {dist.debtLimitYER > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span>سقف الدين: {formatYER(dist.debtLimitYER)}</span>
                          <span className={percentUsed >= 90 ? 'text-rose-500 font-bold' : ''}>
                            {percentUsed}% مستخدم
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percentUsed >= 100
                                ? 'bg-rose-500'
                                : percentUsed >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Commission Info & Total Earned */}
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-[11px]">
                      <span className="text-stone-500 dark:text-stone-400">
                        العمولة: {dist.commissionType === 'PER_PIECE' ? `${formatYER(dist.commissionValue)} / قطعة` : `${dist.commissionValue}% نسبية`}
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        مستحق له: {formatYER(fin.totalCommissionsEarned)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onOpenDistributionFor(dist.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>توزيع</span>
                  </button>

                  <button
                    onClick={() => onOpenCollectionFor(dist.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 py-2 rounded-xl text-xs font-bold transition active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>تحصيل</span>
                  </button>

                  <button
                    onClick={() => setSelectedLedgerDist(dist)}
                    className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700"
                    title="عرض كشف الحساب التفصيلي"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: كشف حساب الموزع التفصيلي */}
      {selectedLedgerDist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">كشف حساب الموزع: {selectedLedgerDist.name}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    هاتف: {selectedLedgerDist.phone || 'غير مسجل'} • سقف الدين: {formatYER(selectedLedgerDist.debtLimitYER)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const ledger = storage.getDistributorLedger(selectedLedgerDist.id);
                    onPrintLedger(selectedLedgerDist, ledger);
                  }}
                  className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 px-3 py-1.5 rounded-xl text-xs font-semibold"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الكشف</span>
                </button>

                <button
                  onClick={() => setSelectedLedgerDist(null)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Financial Summary Strip */}
            {(() => {
              const fin = storage.getDistributorFinancials(selectedLedgerDist.id);
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 dark:bg-stone-800/50 p-4 rounded-2xl text-xs">
                  <div>
                    <span className="text-stone-400 block">رصيد أول المدة:</span>
                    <span className="font-bold text-sm font-mono">{formatYER(fin.openingDebt)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">إجمالي الآجل المسحوب:</span>
                    <span className="font-bold text-sm font-mono text-amber-600 dark:text-amber-400">{formatYER(fin.totalCreditTaken)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">إجمالي التحصيلات:</span>
                    <span className="font-bold text-sm font-mono text-emerald-600 dark:text-emerald-400">{formatYER(fin.totalCollected)}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">صافي الدين الحالي:</span>
                    <span className="font-bold text-base font-mono text-amber-600 dark:text-amber-400">{formatYER(fin.currentDebt)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Detailed Table */}
            <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold">
                    <tr>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">الرقم المرجعي</th>
                      <th className="p-3">البيان</th>
                      <th className="p-3 text-left">مدين (بضاعة آجلة)</th>
                      <th className="p-3 text-left">دائن (سداد/تحصيل)</th>
                      <th className="p-3 text-left">الرصيد التراكمي</th>
                      <th className="p-3 text-left">عمولة مكتسبة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 dark:divide-stone-800 font-mono">
                    {storage.getDistributorLedger(selectedLedgerDist.id).map((row) => (
                      <tr key={row.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                        <td className="p-3 text-stone-500 whitespace-nowrap">{row.date}</td>
                        <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">{row.refNumber}</td>
                        <td className="p-3 font-sans font-medium text-stone-800 dark:text-stone-200">{row.description}</td>
                        <td className="p-3 text-left font-bold text-amber-600 dark:text-amber-400">
                          {row.debitYER > 0 ? formatYER(row.debitYER) : '-'}
                        </td>
                        <td className="p-3 text-left font-bold text-emerald-600 dark:text-emerald-400">
                          {row.creditYER > 0 ? formatYER(row.creditYER) : '-'}
                        </td>
                        <td className="p-3 text-left font-black text-stone-900 dark:text-stone-100">
                          {formatYER(row.balanceYER)}
                        </td>
                        <td className="p-3 text-left text-blue-600 dark:text-blue-400 font-semibold">
                          {row.commissionEarnedYER > 0 ? formatYER(row.commissionEarnedYER) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLedgerDist(null)}
                className="bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 font-bold px-5 py-2.5 rounded-xl text-xs transition"
              >
                إغلاق الكشف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: إضافة / تعديل موزع */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 left-5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-1">
              {editingDist ? 'تعديل بيانات الموزع' : 'إضافة موزع جديد'}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              تسجيل بيانات الموزع وسقف الدين ونظام العمولات
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم الموزع / المحل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: الأخ عصام الشرعبي - جولة المصباحي"
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="77xxxxxxx"
                    dir="ltr"
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-right"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">العنوان / المنطقة</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="صنعاء - حدة"
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">سقف الدين المسموح (ر.ي)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={debtLimitYER}
                    onChange={(e) => setDebtLimitYER(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] text-stone-400">0 تعني بدون سقف</span>
                </div>

                <div>
                  <label className="block font-bold mb-1">الرصيد الافتتاحي السابق (ر.ي)</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={openingDebtYER}
                    onChange={(e) => setOpeningDebtYER(Number(e.target.value))}
                    disabled={!!editingDist}
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500 disabled:opacity-60"
                  />
                  <span className="text-[10px] text-stone-400">دين سابق قبل استخدام النظام</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
                <label className="block font-bold text-amber-800 dark:text-amber-300">نظام العمولة للموزع</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <input
                      type="radio"
                      name="commType"
                      checked={commissionType === 'PER_PIECE'}
                      onChange={() => setCommissionType('PER_PIECE')}
                    />
                    <span>مبلغ لكل قطعة (ر.ي)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                    <input
                      type="radio"
                      name="commType"
                      checked={commissionType === 'PERCENT'}
                      onChange={() => setCommissionType('PERCENT')}
                    />
                    <span>نسبة مئوية (%)</span>
                  </label>
                </div>

                <div className="mt-2">
                  <label className="block text-stone-600 dark:text-stone-400 mb-1">
                    {commissionType === 'PER_PIECE' ? 'قيمة العمولة بالريال لكل قطعة/صحن:' : 'نسبة العمولة من إجمالي الفاتورة (%):'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step={commissionType === 'PER_PIECE' ? '5' : '0.5'}
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
