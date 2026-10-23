import React, { useState } from 'react';
import { storage, formatYER } from '../services/storage';
import { Supplier, Purchase, SupplierPayment } from '../types';
import {
  Building2,
  Plus,
  Search,
  Phone,
  MapPin,
  CreditCard,
  Receipt,
  Edit2,
  X,
  CheckCircle2,
  AlertCircle,
  Truck
} from 'lucide-react';

interface SuppliersViewProps {
  onOpenNewPurchase: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ onOpenNewPurchase }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // فورم إضافة مورد
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalanceYER, setOpeningBalanceYER] = useState<number>(0);
  const [error, setError] = useState('');

  // فورم سداد مورد
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [payAmountYER, setPayAmountYER] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'TRANSFER'>('TRANSFER');
  const [payRef, setPayRef] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState('');
  const [payError, setPayError] = useState('');

  const suppliers = storage.getSuppliers().filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm)
  );

  const purchases = storage.getPurchases();
  const payments = storage.getSupplierPayments();

  const openAdd = () => {
    setEditingSupplier(null);
    setName('');
    setPhone('');
    setAddress('');
    setOpeningBalanceYER(0);
    setError('');
    setShowAddSupplierModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setPhone(s.phone);
    setAddress(s.address || '');
    setOpeningBalanceYER(s.openingBalanceYER);
    setError('');
    setShowAddSupplierModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('يرجى إدخال اسم المورد أو الشركة');
      return;
    }

    storage.saveSupplier({
      id: editingSupplier ? editingSupplier.id : undefined,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      openingBalanceYER: Number(openingBalanceYER) || 0,
      active: true
    });

    setShowAddSupplierModal(false);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier) return;
    const num = Number(payAmountYER);
    if (!num || num <= 0) {
      setPayError('يرجى إدخال مبلغ سداد صحيح');
      return;
    }

    const res = storage.createSupplierPayment({
      supplierId: payingSupplier.id,
      amountYER: num,
      method: payMethod,
      date: payDate,
      reference: payRef.trim(),
      note: payNote.trim()
    });

    if (!res.success) {
      setPayError(res.error || 'حدث خطأ أثناء حفظ السداد');
      return;
    }

    setPayingSupplier(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              الموردون وفواتير المشتريات
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              أرصدة موردي الدقيق والسمن والمكسرات ومتابعة السدادات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewPurchase}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>فاتورة شراء مواد خام</span>
          </button>

          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm transition"
          >
            <span>إضافة مورد</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-400 absolute right-4 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="ابحث باسم المورد أو رقم الهاتف..."
          className="w-full pr-11 pl-4 py-2.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl text-sm focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-stone-400 text-sm">
            لا يوجد موردون مسجلون مطابقون.
          </div>
        ) : (
          suppliers.map((supp) => {
            const fin = storage.getSupplierFinancials(supp.id);

            return (
              <div
                key={supp.id}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm space-y-4 hover:border-purple-400/50 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-stone-900 dark:text-stone-100">
                        {supp.name}
                      </h3>
                      {supp.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span dir="ltr">{supp.phone}</span>
                        </div>
                      )}
                      {supp.address && (
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          <span>{supp.address}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openEdit(supp)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-2xl border border-stone-100 dark:border-stone-700 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 dark:text-stone-400">الرصيد المستحق للمورد:</span>
                      <span className="font-mono font-bold text-lg text-purple-600 dark:text-purple-400">
                        {formatYER(fin.currentBalance)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-stone-700 text-[11px]">
                      <div>
                        <span className="text-stone-400 block">إجمالي مشترياتنا منه:</span>
                        <span className="font-bold font-mono text-stone-700 dark:text-stone-300">
                          {formatYER(fin.totalPurchases)}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-400 block">إجمالي المسدد له:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {formatYER(fin.totalPaid)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPayingSupplier(supp);
                      setPayAmountYER('');
                      setPayRef('');
                      setPayNote('');
                      setPayError('');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>سداد مستحقات</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: سداد مورد */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-base">سداد دفعة للمورد: {payingSupplier.name}</h3>
              <button onClick={() => setPayingSupplier(null)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {payError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold">
                {payError}
              </div>
            )}

            <form onSubmit={handleSavePayment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                <span>الرصيد المستحق له حالياً:</span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                  {formatYER(storage.getSupplierFinancials(payingSupplier.id).currentBalance)}
                </span>
              </div>

              <div>
                <label className="block font-bold mb-1">المبلغ المسدد (ر.ي) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="500"
                  value={payAmountYER}
                  onChange={(e) => setPayAmountYER(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="مثال: 50000"
                  className="w-full px-3.5 py-2 bg-white dark:bg-stone-800 border rounded-xl text-sm font-mono font-bold text-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">طريقة السداد</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs font-semibold"
                  >
                    <option value="CASH">نقدًا من الصندوق</option>
                    <option value="TRANSFER">حوالة بنكية / صرافة</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">تاريخ السداد</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">الرقم المرجعي / رقم السند أو الحوالة</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="مثال: إشعار تحويل رقم 7612"
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">ملاحظات</label>
                <input
                  type="text"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  placeholder="سداد دفعة من توريد السمن"
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="flex-1 py-2.5 rounded-xl border font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  تأكيد وقيد السداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: إضافة أو تعديل مورد */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 text-stone-900 dark:text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <h3 className="font-bold text-base">
                {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد مواد خام جديد'}
              </h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold mb-1">اسم المورد أو الشركة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: شركة البركة لتجارة الدقيق"
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-semibold"
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
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm text-right"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">العنوان / المحافظة</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="صنعاء - باب اليمن"
                    className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">الرصيد الافتتاحي المستحق له (ر.ي)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={openingBalanceYER}
                  onChange={(e) => setOpeningBalanceYER(Number(e.target.value))}
                  disabled={!!editingSupplier}
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-stone-800 border rounded-xl text-sm font-mono disabled:opacity-60"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  رصيد سابق للمورد قبل بدء إدخال الفواتير
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 py-2.5 rounded-xl border font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  حفظ المورد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
