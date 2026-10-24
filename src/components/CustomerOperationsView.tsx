import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, MapPin, Plus, ReceiptText, Store, Wallet } from 'lucide-react';
import { storage, formatYER } from '../services/storage';
import { CustomerSale, ShopCustomer, SupplyRequestStatus } from '../types';

type SaleLine = { productId: string; quantity: number; unitPriceYER: number };

const field = 'w-full rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 px-3 py-2.5 text-sm outline-none focus:border-amber-500';
const card = 'rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5';

export const CustomerOperationsView: React.FC = () => {
  const [, setRevision] = useState(0);
  const [section, setSection] = useState<'customers'|'sales'|'requests'|'returns'|'weekly'|'alerts'>('customers');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [governorate, setGovernorate] = useState('البيضاء');
  const [district, setDistrict] = useState('');
  const [locality, setLocality] = useState('');
  const [address, setAddress] = useState('');
  const [openingDebt, setOpeningDebt] = useState('0');
  const [notes, setNotes] = useState('');
  const [saleCustomerId, setSaleCustomerId] = useState('');
  const [saleDistributorId, setSaleDistributorId] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0,10));
  const [saleLines, setSaleLines] = useState<SaleLine[]>([{productId:'',quantity:1,unitPriceYER:0}]);
  const [salePaid, setSalePaid] = useState('0');
  const [saleDueDate, setSaleDueDate] = useState('');
  const [paymentCustomerId, setPaymentCustomerId] = useState('');
  const [paymentDistributorId, setPaymentDistributorId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH'|'TRANSFER'>('CASH');
  const [requestDistributorId, setRequestDistributorId] = useState('');
  const [requestCustomerId, setRequestCustomerId] = useState('');
  const [requestDate, setRequestDate] = useState(new Date().toISOString().slice(0,10));
  const [requestLines, setRequestLines] = useState<{productId:string;quantity:number}[]>([{productId:'',quantity:1}]);
  const [requestNote, setRequestNote] = useState('');
  const [returnCustomerId, setReturnCustomerId] = useState('');
  const [returnDistributorId, setReturnDistributorId] = useState('');
  const [returnSaleId, setReturnSaleId] = useState('');
  const [returnProductId, setReturnProductId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState('1');
  const [returnDisposition, setReturnDisposition] = useState<'DAMAGED'|'RETURNED'|'EXCHANGE'>('DAMAGED');
  const [returnReason, setReturnReason] = useState('تالف عند العميل');
  const [returnNote, setReturnNote] = useState('');
  const [weekKey, setWeekKey] = useState(() => {
    const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.toISOString().slice(0,10);
  });

  useEffect(() => storage.subscribe(() => setRevision(v => v + 1)), []);
  const db = storage.getDatabase();
  const customers = db.customers.filter(c => c.active);
  const distributors = db.distributors.filter(d => d.active);
  const products = db.products.filter(p => p.active);
  const returnSales = db.customerSales.filter(s => s.customerId === returnCustomerId).sort((a,b)=>b.createdAt-a.createdAt);
  const returnSale = returnSales.find(s => s.id === returnSaleId);
  const filteredCustomers = useMemo(() => customers.filter(c =>
    [c.name,c.phone,c.district,c.locality,c.address].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))
  ), [customers,search]);
  const balance = (id: string) => storage.getCustomerBalance(id);
  const currentSaleTotal = saleLines.reduce((sum,line) => {
    const p = products.find(x => x.id === line.productId);
    return sum + (p ? line.quantity * (line.unitPriceYER || p.distributorPriceYER) : 0);
  },0);

  const resetNotice = () => { setMessage(''); setError(''); };
  const submitCustomer = (e: React.FormEvent) => {
    e.preventDefault(); resetNotice();
    const result = storage.saveCustomer({
      name: customerName, contactName, phone, governorate, district, locality, address,
      assignedDistributorId: distributorId, openingDebtYER: Number(openingDebt || 0),
      active: true, notes
    });
    if (!result.success) { setError(result.error || 'تعذر حفظ البقالة'); return; }
    setMessage('تم حفظ البقالة وربطها بالموزع والمنطقة.'); setCustomerName(''); setContactName(''); setPhone(''); setAddress(''); setDistrict(''); setLocality(''); setNotes(''); setOpeningDebt('0');
  };
  const submitSale = (e: React.FormEvent) => {
    e.preventDefault(); resetNotice();
    const result = storage.createCustomerSale({
      customerId: saleCustomerId, distributorId: saleDistributorId, date: saleDate,
      items: saleLines.filter(x=>x.productId && x.quantity>0).map(x=>({productId:x.productId,quantity:Number(x.quantity),unitPriceYER:x.unitPriceYER>0?Number(x.unitPriceYER):undefined})),
      paidYER: Number(salePaid || 0), dueDate: saleDueDate || undefined, note: 'بيع بقالة'
    });
    if (!result.success) { setError(result.error || 'تعذر حفظ البيع'); return; }
    setMessage('تم تسجيل الفاتورة ' + result.sale?.displayNumber + ' وتحديث رصيد البقالة.'); setSaleLines([{productId:'',quantity:1,unitPriceYER:0}]); setSalePaid('0'); setSaleDueDate('');
  };
  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault(); resetNotice();
    const customer = storage.getCustomerById(paymentCustomerId);
    const result = storage.createCustomerPayment({
      customerId: paymentCustomerId, distributorId: paymentDistributorId || customer?.assignedDistributorId || '',
      date: new Date().toISOString().slice(0,10), amountYER: Number(paymentAmount), method: paymentMethod
    });
    if (!result.success) { setError(result.error || 'تعذر تسجيل التحصيل'); return; }
    setMessage('تم تسجيل سند التحصيل ' + result.payment?.displayNumber + ' وتخفيض الدين.'); setPaymentAmount('');
  };
  const submitRequest = (e: React.FormEvent) => {
    e.preventDefault(); resetNotice();
    const customer = storage.getCustomerById(requestCustomerId);
    const result = storage.createSupplyRequest({
      distributorId: requestDistributorId, customerId: requestCustomerId || undefined,
      governorate: customer?.governorate || governorate, district: customer?.district || district,
      locality: customer?.locality || locality, requestedDate: requestDate,
      items: requestLines.filter(x=>x.productId && x.quantity>0).map(x=>({productId:x.productId,quantity:Number(x.quantity)})), note: requestNote
    });
    if (!result.success) { setError(result.error || 'تعذر إرسال الطلب'); return; }
    setMessage('تم إرسال الطلب ' + result.request?.displayNumber + ' إلى قائمة مراجعة المدير.'); setRequestLines([{productId:'',quantity:1}]); setRequestNote('');
  };
  const statusLabel: Record<SupplyRequestStatus,string> = {SUBMITTED:'بانتظار المدير',APPROVED:'معتمد',REJECTED:'مرفوض',IN_PRODUCTION:'قيد الإنتاج',READY:'جاهز للتسليم',FULFILLED:'تم التسليم',CANCELLED:'ملغي'};
  const submitCustomerReturn = (e: React.FormEvent) => {
    e.preventDefault(); resetNotice();
    const customer=storage.getCustomerById(returnCustomerId);
    const result=storage.createCustomerReturn({
      customerId:returnCustomerId, distributorId:returnDistributorId || customer?.assignedDistributorId || '',
      date:new Date().toISOString().slice(0,10), saleId:returnSaleId || undefined,
      items:[{productId:returnProductId,quantity:Number(returnQuantity),disposition:returnDisposition}],
      reason:returnReason,note:returnNote
    });
    if(!result.success){setError(result.error||'تعذر تسجيل الحركة');return;}
    setMessage('تم تسجيل الحركة '+result.customerReturn?.displayNumber+' وهي بانتظار اعتماد المدير.');
    setReturnProductId('');setReturnQuantity('1');setReturnNote('');
  };
  const closeWeek = () => {
    resetNotice();
    const result=storage.closeCustomerWeek(weekKey);
    if(!result.success){setError(result.error||'تعذر إقفال الأسبوع');return;}
    setMessage('تم حفظ إقفال الأسبوع '+weekKey+' بعدد '+(result.close?.customerCount||0)+' بقالة. الرصيد المرحل ظاهر في كشف الأسبوع.');
  };
  const setStatus = (id:string,status:SupplyRequestStatus) => { resetNotice(); const result=storage.updateSupplyRequestStatus(id,status); if(!result.success)setError(result.error||'تعذر تحديث الطلب'); else setMessage('تم تحديث حالة الطلب.'); };

  return <div className="space-y-5" dir="rtl">
    <header className="rounded-3xl bg-stone-900 text-white p-5 sm:p-7 border border-amber-700/30 shadow-sm">
      <div className="flex items-start gap-3"><div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center"><Store className="w-6 h-6"/></div><div><h2 className="text-xl sm:text-2xl font-black">البقالات وحسابات العملاء</h2><p className="text-sm text-stone-300 mt-1">تسجيل البقالات حسب مناطق البيضاء، مبيعات الآجل، التحصيلات وطلبات الموزعين.</p></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <div className="rounded-2xl bg-white/5 p-3"><p className="text-xs text-stone-300">البقالات النشطة</p><strong className="text-2xl">{customers.length}</strong></div>
        <div className="rounded-2xl bg-white/5 p-3"><p className="text-xs text-stone-300">إجمالي ديون العملاء</p><strong className="text-lg">{formatYER(customers.reduce((s,c)=>s+balance(c.id),0))}</strong></div>
        <div className="rounded-2xl bg-white/5 p-3"><p className="text-xs text-stone-300">طلبات تنتظر المدير</p><strong className="text-2xl">{db.supplyRequests.filter(r=>r.status==='SUBMITTED').length}</strong></div>
        <div className="rounded-2xl bg-white/5 p-3"><p className="text-xs text-stone-300">المنطقة الافتراضية</p><strong className="text-lg">محافظة البيضاء</strong></div>
      </div>
    </header>
    {(message || error) && <div className={`rounded-xl px-4 py-3 text-sm flex gap-2 items-center ${error?'bg-red-50 text-red-700 border border-red-200':'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>{error?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>}{error||message}</div>}
    <div className="flex gap-2 overflow-x-auto">
      {([{id:'customers',label:'البقالات والعملاء',icon:Store},{id:'sales',label:'بيع وتحصيل',icon:Wallet},{id:'requests',label:'طلبات الموزعين',icon:ClipboardList},{id:'returns',label:'التالف والمرتجعات',icon:ReceiptText},{id:'weekly',label:'الإقفال الأسبوعي',icon:CheckCircle2},{id:'alerts',label:'التنبيهات',icon:AlertCircle}] as const).map(t=><button key={t.id} onClick={()=>{setSection(t.id);resetNotice();}} className={`shrink-0 rounded-xl px-4 py-3 text-sm font-bold flex gap-2 items-center border ${section===t.id?'bg-amber-500 text-stone-950 border-amber-500':'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700'}`}><t.icon className="w-4 h-4"/>{t.label}</button>)}
    </div>
    {section==='customers' && <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-4">
      <form onSubmit={submitCustomer} className={card+' space-y-3'}>
        <h3 className="font-black flex gap-2 items-center"><Plus className="w-4 h-4 text-amber-500"/>إضافة بقالة جديدة</h3>
        <input className={field} placeholder="اسم البقالة *" value={customerName} onChange={e=>setCustomerName(e.target.value)} required/>
        <div className="grid grid-cols-2 gap-2"><input className={field} placeholder="اسم المسؤول" value={contactName} onChange={e=>setContactName(e.target.value)}/><input className={field} placeholder="رقم الهاتف" value={phone} onChange={e=>setPhone(e.target.value)}/></div>
        <div className="grid grid-cols-2 gap-2"><input className={field} value={governorate} onChange={e=>setGovernorate(e.target.value)} placeholder="المحافظة" required/><input className={field} value={district} onChange={e=>setDistrict(e.target.value)} placeholder="المديرية *" required/></div>
        <input className={field} value={locality} onChange={e=>setLocality(e.target.value)} placeholder="المنطقة / الحي / القرية *" required/>
        <input className={field} value={address} onChange={e=>setAddress(e.target.value)} placeholder="العنوان التفصيلي أو علامة مميزة"/>
        <select className={field} value={distributorId} onChange={e=>setDistributorId(e.target.value)} required><option value="">اختر الموزع المسؤول *</option>{distributors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <input className={field} type="number" min="0" value={openingDebt} onChange={e=>setOpeningDebt(e.target.value)} placeholder="الدين الافتتاحي إن وجد"/>
        <textarea className={field} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="ملاحظات" rows={2}/>
        <button className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black py-3">حفظ البقالة</button>
        <p className="text-[11px] text-stone-500">قائمة المديريات والقرى قابلة للإدخال والتوسعة؛ لم نثبت قائمة إدارية غير موثقة داخل التطبيق.</p>
      </form>
      <div className={card+' space-y-3'}>
        <div className="flex items-center justify-between gap-3"><h3 className="font-black">سجل البقالات</h3><span className="text-xs text-stone-500">{filteredCustomers.length} سجل</span></div>
        <input className={field} value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف أو المنطقة..."/>
        <div className="space-y-2 max-h-[640px] overflow-y-auto">{filteredCustomers.length===0?<p className="text-sm text-stone-500 text-center py-8">لا توجد بقالات مسجلة.</p>:filteredCustomers.map(c=><div key={c.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3">
          <div className="flex items-start justify-between gap-2"><div><strong>{c.name}</strong><p className="text-xs text-stone-500 mt-1 flex gap-1 items-center"><MapPin className="w-3 h-3"/>{c.governorate} / {c.district} / {c.locality}</p><p className="text-xs text-stone-500">{c.phone||'بدون هاتف'} · {distributors.find(d=>d.id===c.assignedDistributorId)?.name||'غير محدد'}</p></div><strong className={balance(c.id)>0?'text-red-600':'text-emerald-600'}>{formatYER(balance(c.id))}</strong></div>
          <div className="flex gap-2 mt-3"><button onClick={()=>{setSection('sales');setSaleCustomerId(c.id);setSaleDistributorId(c.assignedDistributorId);}} className="text-xs rounded-lg bg-amber-100 text-amber-900 px-3 py-2 font-bold">تسجيل بيع</button><button onClick={()=>{setSection('sales');setPaymentCustomerId(c.id);setPaymentDistributorId(c.assignedDistributorId);}} className="text-xs rounded-lg bg-emerald-100 text-emerald-900 px-3 py-2 font-bold">تسجيل سداد</button></div>
        </div>)}</div>
      </div>
    </div>}
    {section==='sales' && <div className="grid lg:grid-cols-2 gap-4">
      <form onSubmit={submitSale} className={card+' space-y-3'}>
        <h3 className="font-black flex gap-2 items-center"><ReceiptText className="w-4 h-4 text-amber-500"/>فاتورة بيع للبقالة</h3>
        <select className={field} value={saleCustomerId} onChange={e=>{setSaleCustomerId(e.target.value);const c=storage.getCustomerById(e.target.value);if(c)setSaleDistributorId(c.assignedDistributorId);}} required><option value="">اختر البقالة</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} — {c.district}/{c.locality}</option>)}</select>
        <select className={field} value={saleDistributorId} onChange={e=>setSaleDistributorId(e.target.value)} required><option value="">الموزع</option>{distributors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <input className={field} type="date" value={saleDate} onChange={e=>setSaleDate(e.target.value)} required/>
        {saleLines.map((line,i)=><div key={i} className="grid grid-cols-[1fr_76px_100px_auto] gap-2 items-center"><select className={field} value={line.productId} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setSaleLines(prev=>prev.map((l,j)=>j===i?{...l,productId:e.target.value,unitPriceYER:p?.distributorPriceYER||0}:l));}} required><option value="">الصنف</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input className={field} type="number" min="1" value={line.quantity} onChange={e=>setSaleLines(prev=>prev.map((l,j)=>j===i?{...l,quantity:Number(e.target.value)}:l))} required/><input className={field} aria-label="سعر الوحدة" type="number" min="0" value={line.unitPriceYER} onChange={e=>setSaleLines(prev=>prev.map((l,j)=>j===i?{...l,unitPriceYER:Number(e.target.value)}:l))}/><button type="button" className="text-red-600 px-2" onClick={()=>setSaleLines(prev=>prev.filter((_,j)=>j!==i))}>×</button></div>)}
        <button type="button" onClick={()=>setSaleLines(prev=>[...prev,{productId:'',quantity:1,unitPriceYER:0}])} className="text-sm text-amber-700 font-bold">+ إضافة صنف آخر</button>
        <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3 flex justify-between"><span>إجمالي الفاتورة</span><strong>{formatYER(currentSaleTotal)}</strong></div>
        <div className="grid grid-cols-2 gap-2"><input className={field} type="number" min="0" value={salePaid} onChange={e=>setSalePaid(e.target.value)} placeholder="المدفوع نقداً"/><input className={field} type="date" value={saleDueDate} onChange={e=>setSaleDueDate(e.target.value)} aria-label="تاريخ الاستحقاق"/></div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 flex justify-between"><span>المتبقي آجل</span><strong>{formatYER(Math.max(0,currentSaleTotal-Number(salePaid||0)))}</strong></div>
        <button className="w-full rounded-xl bg-amber-500 text-stone-950 font-black py-3">حفظ الفاتورة وتحديث الدين</button>
      </form>
      <form onSubmit={submitPayment} className={card+' space-y-3'}>
        <h3 className="font-black flex gap-2 items-center"><Wallet className="w-4 h-4 text-emerald-600"/>تحصيل من بقالة</h3>
        <select className={field} value={paymentCustomerId} onChange={e=>{setPaymentCustomerId(e.target.value);const c=storage.getCustomerById(e.target.value);if(c)setPaymentDistributorId(c.assignedDistributorId);}} required><option value="">اختر البقالة</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name} — الرصيد {formatYER(balance(c.id))}</option>)}</select>
        <select className={field} value={paymentDistributorId} onChange={e=>setPaymentDistributorId(e.target.value)} required><option value="">الموزع المسؤول</option>{distributors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        {paymentCustomerId&&<div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3 flex justify-between"><span>الدين الحالي</span><strong>{formatYER(balance(paymentCustomerId))}</strong></div>}
        <input className={field} type="number" min="1" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)} placeholder="مبلغ السداد" required/>
        <select className={field} value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as 'CASH'|'TRANSFER')}><option value="CASH">نقداً</option><option value="TRANSFER">حوالة</option></select>
        <button className="w-full rounded-xl bg-emerald-600 text-white font-black py-3">تسجيل التحصيل</button>
        <p className="text-xs text-stone-500">السداد يسجل كسند مستقل، ويُرفض إذا تجاوز الدين الحالي حتى لا ينتج رصيد غير مفسر.</p>
      </form>
      <div className={card+' lg:col-span-2'}>
        <h3 className="font-black mb-3">سندات التحصيل الأخيرة</h3>
        <div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="text-stone-500 border-b border-stone-200 dark:border-stone-700"><th className="p-2">التاريخ</th><th className="p-2">رقم السند</th><th className="p-2">البقالة</th><th className="p-2">طريقة الدفع</th><th className="p-2">المبلغ</th><th className="p-2">توزيع السداد</th></tr></thead><tbody>{db.customerPayments.slice(0,30).map(p=><tr key={p.id} className="border-b border-stone-100 dark:border-stone-800"><td className="p-2">{p.date}</td><td className="p-2 font-bold">{p.displayNumber}</td><td className="p-2">{p.customerName}</td><td className="p-2">{p.method==='CASH'?'نقداً':'حوالة'}</td><td className="p-2 text-emerald-600 font-bold">{formatYER(p.amountYER)}</td><td className="p-2">{(p.allocations||[]).map(a=>a.saleNumber||db.customerSales.find(s=>s.id===a.saleId)?.displayNumber||'فاتورة').join('، ')||'رصيد افتتاحي / قيد قديم'}</td></tr>)}</tbody></table></div>
        {db.customerPayments.length===0&&<p className="text-xs text-stone-500 py-4 text-center">لا توجد سندات تحصيل مسجلة.</p>}
      </div>
      <div className={card+' lg:col-span-2'}>
        <h3 className="font-black mb-3">آخر فواتير العملاء والتحصيلات</h3>
        <div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="text-stone-500 border-b border-stone-200 dark:border-stone-700"><th className="p-2">التاريخ</th><th className="p-2">رقم الفاتورة</th><th className="p-2">البقالة</th><th className="p-2">الإجمالي</th><th className="p-2">المدفوع</th><th className="p-2">الآجل</th><th className="p-2">محصّل بعد الفاتورة</th><th className="p-2">المتبقي من الفاتورة</th></tr></thead><tbody>{db.customerSales.slice(0,40).map(s=><tr key={s.id} className="border-b border-stone-100 dark:border-stone-800"><td className="p-2">{s.date}</td><td className="p-2 font-bold">{s.displayNumber}</td><td className="p-2">{s.customerName}</td><td className="p-2">{formatYER(s.totalYER)}</td><td className="p-2 text-emerald-600">{formatYER(s.paidYER)}</td><td className="p-2 text-amber-600">{formatYER(s.creditYER)}</td><td className="p-2 text-emerald-600">{formatYER(storage.getCustomerInvoiceBalances(s.customerId).find(x=>x.saleId===s.id)?.paymentsYER || 0)}</td><td className="p-2 font-bold">{formatYER(storage.getCustomerSaleBalance(s.id))}</td></tr>)}</tbody></table></div>
      </div>
    </div>}

    {section==='returns' && <div className="grid lg:grid-cols-2 gap-4">
      <form onSubmit={submitCustomerReturn} className={card+' space-y-3'}>
        <h3 className="font-black">تسجيل تالف أو مرتجع أو استبدال</h3>
        <select className={field} value={returnCustomerId} onChange={e=>{setReturnCustomerId(e.target.value);setReturnSaleId('');setReturnProductId('');const c=storage.getCustomerById(e.target.value);if(c)setReturnDistributorId(c.assignedDistributorId);}} required><option value="">اختر البقالة</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <select className={field} value={returnDistributorId} onChange={e=>setReturnDistributorId(e.target.value)} required><option value="">الموزع المسؤول</option>{distributors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select className={field} value={returnSaleId} onChange={e=>{setReturnSaleId(e.target.value);setReturnProductId('');}}><option value="">الفاتورة الأصلية (اختياري — لحساب السعر والكمية بدقة)</option>{returnSales.map(s=><option key={s.id} value={s.id}>{s.displayNumber} · {s.date} · {formatYER(s.totalYER)}</option>)}</select>
        <select className={field} value={returnProductId} onChange={e=>setReturnProductId(e.target.value)} required><option value="">الصنف</option>{(returnSale ? returnSale.items.map(i=>products.find(p=>p.id===i.productId)).filter((p):p is typeof products[number]=>Boolean(p)) : products).map(p=><option key={p.id} value={p.id}>{p.name} — {formatYER(p.distributorPriceYER)}</option>)}</select>
        {returnSale && <p className="text-xs text-stone-500">الفاتورة المحددة: {returnSale.displayNumber} — سيستخدم النظام سعر الصنف المثبت في الفاتورة ويمنع تجاوز الكمية المباعة منها.</p>}
        <div className="grid grid-cols-2 gap-2"><input className={field} type="number" min="1" value={returnQuantity} onChange={e=>setReturnQuantity(e.target.value)} required/><select className={field} value={returnDisposition} onChange={e=>setReturnDisposition(e.target.value as 'DAMAGED'|'RETURNED'|'EXCHANGE')}><option value="DAMAGED">تالف — لا يعود للمخزون</option><option value="RETURNED">مرتجع صالح للفحص</option><option value="EXCHANGE">استبدال</option></select></div>
        <input className={field} value={returnReason} onChange={e=>setReturnReason(e.target.value)} placeholder="سبب الحركة" required/>
        <textarea className={field} value={returnNote} onChange={e=>setReturnNote(e.target.value)} placeholder="ملاحظات / رقم الفاتورة الأصلية" rows={2}/>
        <button className="w-full rounded-xl bg-amber-500 text-stone-950 font-black py-3">إرسال للمدير للمراجعة</button>
        <p className="text-xs text-stone-500">لا يُخفض الدين ولا يُعاد المنتج الصالح للمخزون قبل اعتماد المدير. المنتج التالف لا يعود للمخزون الصالح.</p>
      </form>
      <div className={card+' space-y-3'}><h3 className="font-black">حركات بانتظار المراجعة</h3>
        {storage.getCustomerReturns().length===0?<p className="text-sm text-stone-500">لا توجد حركات مرتجع.</p>:storage.getCustomerReturns().map(r=><div key={r.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 space-y-2">
          <div className="flex justify-between gap-2"><strong>{r.displayNumber} · {r.customerName}</strong><span className="text-xs rounded-lg px-2 py-1 bg-amber-100 text-amber-900">{r.status==='PENDING'?'بانتظار الاعتماد':r.status==='APPROVED'?'معتمد':'مرفوض'}</span></div>
          <p className="text-xs text-stone-500">{r.date} · {r.reason} · {formatYER(r.totalYER)}</p>
          <div className="text-xs">{r.items.map(i=>i.productName+' × '+i.quantity+' ('+(i.disposition==='DAMAGED'?'تالف':i.disposition==='RETURNED'?'مرتجع':'استبدال')+')').join('، ')}</div>
          {r.status==='PENDING'&&<div className="flex gap-2"><button onClick={()=>{const x=storage.reviewCustomerReturn(r.id,'APPROVED');resetNotice();if(x.success)setMessage('تم اعتماد الحركة وتحديث الرصيد.');else setError(x.error||'تعذر الاعتماد');}} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold">اعتماد</button><button onClick={()=>{const x=storage.reviewCustomerReturn(r.id,'REJECTED');resetNotice();if(x.success)setMessage('تم رفض الحركة.');else setError(x.error||'تعذر الرفض');}} className="rounded-lg bg-red-100 text-red-700 px-3 py-2 text-xs font-bold">رفض</button></div>}
        </div>)}
      </div>
    </div>}
    {section==='weekly' && <div className={card+' space-y-4'}>
      <h3 className="font-black">إقفال أسبوع العملاء وترحيل الأرصدة</h3>
      <p className="text-sm text-stone-500">يحفظ النظام لقطة أسبوعية لكل بقالة: رصيد أول الأسبوع + الآجل - التحصيلات - المرتجعات المعتمدة = رصيد آخر الأسبوع. الإقفال لا يمحو أو يكرر الحركات.</p>
      <div className="flex flex-wrap items-end gap-3"><label className="space-y-1 text-sm"><span>بداية الأسبوع (الاثنين)</span><input className={field} type="date" value={weekKey} onChange={e=>setWeekKey(e.target.value)} /></label><button onClick={closeWeek} className="rounded-xl bg-amber-500 px-5 py-3 font-black text-stone-950">إقفال الأسبوع</button></div>
      <div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="border-b border-stone-200 dark:border-stone-700 text-stone-500"><th className="p-2">الأسبوع</th><th className="p-2">عدد البقالات</th><th className="p-2">إجمالي البيع</th><th className="p-2">التحصيلات</th><th className="p-2">المرتجعات</th><th className="p-2">إجمالي الرصيد المرحل</th></tr></thead><tbody>{storage.getCustomerWeeklyCloses().map(w=><tr key={w.id} className="border-b border-stone-100 dark:border-stone-800"><td className="p-2">{w.weekKey}</td><td className="p-2">{w.customerCount}</td><td className="p-2">{formatYER(w.totalSalesYER)}</td><td className="p-2">{formatYER(w.totalCollectionsYER)}</td><td className="p-2">{formatYER(w.totalApprovedReturnsYER)}</td><td className="p-2 font-bold">{formatYER(w.customerBalances.reduce((n,x)=>n+x.closingYER,0))}</td></tr>)}</tbody></table></div>
      <p className="text-xs text-stone-500">الأرصدة المرحلة محفوظة في كشف الإقفال، وتبقى الحركات الأصلية كما هي. لا يمكن إقفال نفس الأسبوع مرتين.</p>
    </div>}
    {section==='alerts' && <div className={card+' space-y-3'}>
      <h3 className="font-black">مركز التنبيهات المبنية على البيانات</h3>
      {[
        ...customers.filter(c=>balance(c.id)>0).map(c=>({id:'debt-'+c.id,kind:'دين عميل',title:c.name,detail:'رصيد مستحق: '+formatYER(balance(c.id)),level:'warning'})),
        ...db.supplyRequests.filter(r=>['SUBMITTED','APPROVED','IN_PRODUCTION','READY'].includes(r.status)).map(r=>({id:'request-'+r.id,kind:'طلب توريد',title:r.displayNumber+' · '+(r.customerName||r.distributorName),detail:r.items.map(i=>i.productName+' × '+i.quantity).join('، ')+' — '+statusLabel[r.status],level:'info'})),
        ...storage.getCustomerReturns().filter(r=>r.status==='PENDING').map(r=>({id:'return-'+r.id,kind:'مراجعة مطلوبة',title:r.displayNumber+' · '+r.customerName,detail:r.reason+' — '+formatYER(r.totalYER),level:'warning'})),
        ...db.rawMaterials.filter(r=>r.active&&r.stockQty<=r.minimumQty).map(r=>({id:'raw-'+r.id,kind:'مخزون منخفض',title:r.name,detail:'المتاح '+r.stockQty+' '+r.unit,level:'warning'}))
      ].length===0?<p className="text-sm text-stone-500 py-6">لا توجد تنبيهات مفتوحة بحسب البيانات الحالية.</p>:[
        ...customers.filter(c=>balance(c.id)>0).map(c=>({id:'debt-'+c.id,kind:'دين عميل',title:c.name,detail:'رصيد مستحق: '+formatYER(balance(c.id)),level:'warning'})),
        ...db.supplyRequests.filter(r=>['SUBMITTED','APPROVED','IN_PRODUCTION','READY'].includes(r.status)).map(r=>({id:'request-'+r.id,kind:'طلب توريد',title:r.displayNumber+' · '+(r.customerName||r.distributorName),detail:r.items.map(i=>i.productName+' × '+i.quantity).join('، ')+' — '+statusLabel[r.status],level:'info'})),
        ...storage.getCustomerReturns().filter(r=>r.status==='PENDING').map(r=>({id:'return-'+r.id,kind:'مراجعة مطلوبة',title:r.displayNumber+' · '+r.customerName,detail:r.reason+' — '+formatYER(r.totalYER),level:'warning'})),
        ...db.rawMaterials.filter(r=>r.active&&r.stockQty<=r.minimumQty).map(r=>({id:'raw-'+r.id,kind:'مخزون منخفض',title:r.name,detail:'المتاح '+r.stockQty+' '+r.unit,level:'warning'}))
      ].map(a=><div key={a.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 flex gap-3"><AlertCircle className={a.level==='warning'?'text-amber-600':'text-blue-600'}/><div><p className="text-[11px] text-stone-500">{a.kind}</p><strong className="text-sm">{a.title}</strong><p className="text-xs text-stone-500 mt-1">{a.detail}</p></div></div>)}
    </div>}
    {section==='requests' && <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-4">
      <form onSubmit={submitRequest} className={card+' space-y-3'}>
        <h3 className="font-black flex gap-2 items-center"><ClipboardList className="w-4 h-4 text-amber-500"/>طلب توريد من الموزع</h3>
        <select className={field} value={requestDistributorId} onChange={e=>setRequestDistributorId(e.target.value)} required><option value="">الموزع مقدم الطلب</option>{distributors.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select>
        <select className={field} value={requestCustomerId} onChange={e=>setRequestCustomerId(e.target.value)}><option value="">طلب عام (بدون بقالة محددة)</option>{customers.filter(c=>!requestDistributorId||c.assignedDistributorId===requestDistributorId).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input className={field} type="date" value={requestDate} onChange={e=>setRequestDate(e.target.value)} required/>
        {requestLines.map((line,i)=><div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2"><select className={field} value={line.productId} onChange={e=>setRequestLines(prev=>prev.map((l,j)=>j===i?{...l,productId:e.target.value}:l))} required><option value="">الصنف المطلوب</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input className={field} type="number" min="1" value={line.quantity} onChange={e=>setRequestLines(prev=>prev.map((l,j)=>j===i?{...l,quantity:Number(e.target.value)}:l))} required/><button type="button" className="text-red-600 px-2" onClick={()=>setRequestLines(prev=>prev.filter((_,j)=>j!==i))}>×</button></div>)}
        <button type="button" onClick={()=>setRequestLines(prev=>[...prev,{productId:'',quantity:1}])} className="text-sm text-amber-700 font-bold">+ إضافة صنف آخر</button>
        <textarea className={field} value={requestNote} onChange={e=>setRequestNote(e.target.value)} placeholder="ملاحظات أو موعد مطلوب" rows={2}/>
        <button className="w-full rounded-xl bg-amber-500 text-stone-950 font-black py-3">إرسال للمدير للاعتماد</button>
      </form>
      <div className={card+' space-y-3'}>
        <h3 className="font-black">متابعة الطلبات وحالتها</h3>
        {db.supplyRequests.length===0?<p className="text-sm text-stone-500 py-8 text-center">لا توجد طلبات بعد.</p>:db.supplyRequests.map(r=><div key={r.id} className="rounded-xl border border-stone-200 dark:border-stone-700 p-3 space-y-2">
          <div className="flex items-start justify-between gap-2"><div><strong>{r.displayNumber} · {r.distributorName}</strong><p className="text-xs text-stone-500 mt-1">{r.customerName||'طلب عام'} · {r.governorate}/{r.district}/{r.locality} · {r.requestedDate}</p></div><span className="rounded-lg bg-amber-100 text-amber-900 px-2 py-1 text-[11px] font-bold">{statusLabel[r.status]}</span></div>
          <div className="flex flex-wrap gap-2">{r.items.map((it,i)=><span key={i} className="rounded-lg bg-stone-100 dark:bg-stone-800 px-2 py-1 text-xs">{it.productName}: {it.quantity} {it.unit}</span>)}</div>
          {r.note&&<p className="text-xs text-stone-500">{r.note}</p>}
          {r.status==='SUBMITTED'&&<div className="flex gap-2"><button onClick={()=>setStatus(r.id,'APPROVED')} className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs font-bold">اعتماد الطلب</button><button onClick={()=>setStatus(r.id,'REJECTED')} className="rounded-lg bg-red-100 text-red-700 px-3 py-2 text-xs font-bold">رفض</button></div>}
          {r.status==='APPROVED'&&<div className="flex gap-2"><button onClick={()=>setStatus(r.id,'IN_PRODUCTION')} className="rounded-lg bg-blue-100 text-blue-800 px-3 py-2 text-xs font-bold">تحويل للإنتاج</button><button onClick={()=>setStatus(r.id,'READY')} className="rounded-lg bg-emerald-100 text-emerald-800 px-3 py-2 text-xs font-bold">جاهز من المخزون</button></div>}
          {r.status==='IN_PRODUCTION'&&<button onClick={()=>setStatus(r.id,'READY')} className="rounded-lg bg-emerald-100 text-emerald-800 px-3 py-2 text-xs font-bold">تأكيد الجاهزية</button>}
          {r.status==='READY'&&<button onClick={()=>setStatus(r.id,'FULFILLED')} className="rounded-lg bg-stone-900 text-white px-3 py-2 text-xs font-bold">تأكيد التسليم</button>}
        </div>)}
      </div>
    </div>}
  </div>;
};
