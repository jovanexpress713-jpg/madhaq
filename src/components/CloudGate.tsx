import React, { useEffect, useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
import {
  getCloudSession,
  isCloudConfigured,
  signInWithPassword,
  signUpWithPassword,
  signOutCloud
} from '../services/cloudSync';
import {
  getCloudSyncSnapshot,
  startCloudSync,
  stopCloudSync,
  subscribeCloudSync,
  forceCloudSync
} from '../services/cloudCoordinator';

interface Props { children: React.ReactNode; }

type GateMode = 'signin' | 'signup';

function LoginScreen({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [mode, setMode] = useState<GateMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') {
        const result = await signUpWithPassword(email, password);
        if (!result.session) {
          setMessage(result.message || 'تحقق من بريدك الإلكتروني ثم سجل الدخول.');
          setMode('signin');
          return;
        }
      } else {
        await signInWithPassword(email, password);
      }
      await onAuthenticated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'تعذر تسجيل الدخول');
    } finally { setBusy(false); }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-5">
      <div className="w-full max-w-md rounded-[2rem] border border-stone-800 bg-stone-900/95 p-7 shadow-2xl">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center"><ShieldCheck /></div>
          <div><h1 className="text-2xl font-black">مذاق MADHAQ</h1><p className="text-sm text-stone-400">الدخول الآمن للنظام السحابي</p></div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-bold">البريد الإلكتروني<input dir="ltr" type="email" required value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-2xl bg-stone-800 border border-stone-700 px-4 py-3 outline-none focus:border-amber-500" /></label>
          <label className="block text-sm font-bold">كلمة المرور<input dir="ltr" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl bg-stone-800 border border-stone-700 px-4 py-3 outline-none focus:border-amber-500" /></label>
          {message && <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 p-3 text-sm">{message}</div>}
          <button disabled={busy} className="w-full rounded-2xl bg-amber-500 text-stone-950 font-black py-3.5 disabled:opacity-50 flex items-center justify-center gap-2">
            {mode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {busy ? 'جارٍ الاتصال…' : mode === 'signin' ? 'دخول' : 'إنشاء الحساب'}
          </button>
        </form>
        <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(''); }} className="w-full mt-4 text-sm text-stone-400 hover:text-amber-300">
          {mode === 'signin' ? 'إنشاء حساب جديد' : 'لدي حساب بالفعل'}
        </button>
      </div>
    </div>
  );
}

function SyncBar({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [, rerender] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => subscribeCloudSync(() => rerender(v => v + 1)), []);
  const snapshot = getCloudSyncSnapshot();
  const label = snapshot.status === 'SYNCED' ? 'متزامن' : snapshot.status === 'SYNCING' ? 'جارٍ المزامنة' : snapshot.status === 'OFFLINE' ? 'بدون إنترنت' : snapshot.status === 'CONFLICT' ? 'تعارض يحتاج مراجعة' : snapshot.status === 'ERROR' ? 'خطأ في المزامنة' : 'سحابي';
  const Icon = snapshot.status === 'OFFLINE' ? CloudOff : Cloud;
  return (
    <div dir="rtl" className="fixed bottom-3 right-3 z-[80] flex items-center gap-2 rounded-full border border-stone-700 bg-stone-950/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <Icon className="w-4 h-4 text-amber-400" />
      <span className="text-stone-200">{label}</span>
      {snapshot.errorMessage && <span className="hidden sm:inline text-stone-500 max-w-[260px] truncate">{snapshot.errorMessage}</span>}
      <button disabled={busy} title="مزامنة الآن" onClick={async () => { setBusy(true); try { await forceCloudSync(); } finally { setBusy(false); } }} className="p-1.5 rounded-full hover:bg-stone-800"><RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} /></button>
      <button title="تسجيل الخروج" onClick={onSignOut} className="p-1.5 rounded-full hover:bg-stone-800"><LogOut className="w-4 h-4" /></button>
    </div>
  );
}

export function CloudGate({ children }: Props) {
  const [configured] = useState(isCloudConfigured());
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const boot = async () => {
    setError('');
    const session = await getCloudSession();
    if (!session) { setAuthenticated(false); setReady(true); return; }
    try {
      await startCloudSync();
      setAuthenticated(true);
      setReady(true);
    } catch (err) {
      setAuthenticated(false);
      setReady(true);
      setError(err instanceof Error ? err.message : 'تعذر تهيئة المزامنة السحابية');
    }
  };

  useEffect(() => {
    if (!configured) { setReady(true); return; }
    void boot();
    return () => stopCloudSync();
  }, [configured]);

  if (!configured) return <>{children}</>;
  if (!ready) return <div dir="rtl" className="min-h-screen bg-stone-950 text-white flex items-center justify-center">جارٍ التحقق من الحساب…</div>;
  if (!authenticated) {
    if (error) return <div dir="rtl" className="min-h-screen bg-stone-950 text-white flex items-center justify-center p-6"><div className="max-w-lg rounded-3xl bg-stone-900 border border-red-500/20 p-6 text-center"><CloudOff className="mx-auto mb-3 text-red-400"/><p className="font-bold mb-2">تعذر ربط الحساب</p><p className="text-sm text-stone-400 mb-5">{error}</p><button onClick={() => setError('')} className="rounded-xl bg-amber-500 text-stone-950 px-5 py-2 font-bold">العودة لتسجيل الدخول</button></div></div>;
    return <LoginScreen onAuthenticated={boot} />;
  }
  return <><SyncBar onSignOut={async () => { await signOutCloud(); stopCloudSync(); setAuthenticated(false); }} />{children}</>;
}
