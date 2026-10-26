import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LockKeyhole, LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { createManager, getAuthState, login, logout, LocalUser } from '../services/auth';

interface MadhaqEntryFlowProps {
  children: (user: LocalUser, onLogout: () => void) => ReactNode;
}

type Screen = 'splash' | 'welcome' | 'setup' | 'login';

export function MadhaqEntryFlow({ children }: MadhaqEntryFlowProps) {
  const initial = getAuthState();
  const [screen, setScreen] = useState<Screen>('splash');
  const [user, setUser] = useState<LocalUser | null>(initial.currentUser);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('madhaq-authenticated', Boolean(user));
    return () => document.body.classList.remove('madhaq-authenticated');
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => setScreen('welcome'), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const start = () => {
    setError('');
    setScreen(getAuthState().hasAccount ? 'login' : 'setup');
  };

  const handleSetup = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }
    setBusy(true);
    const result = await createManager({ displayName, username, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? 'تعذر إنشاء الحساب.');
      return;
    }
    setPassword('');
    setConfirmPassword('');
    setScreen('login');
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const result = await login(username, password);
    setBusy(false);
    if (!result.ok || !result.user) {
      setError(result.error ?? 'تعذر تسجيل الدخول.');
      return;
    }
    setPassword('');
    setUser(result.user);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setError('');
    setScreen('login');
  };

  if (user) return <>{children(user, handleLogout)}</>;

  if (screen === 'splash') {
    return (
      <div className="madhaq-entry madhaq-entry-splash" dir="rtl" role="status" aria-live="polite">
        <div className="madhaq-entry-orb orb-one" />
        <div className="madhaq-entry-orb orb-two" />
        <div className="madhaq-entry-card">
          <div className="madhaq-entry-logo"><img src="/madhaq_logo.png" alt="شعار مذاق" /></div>
          <div className="madhaq-entry-brand">مذاق <span>MADHAQ</span></div>
          <p>نظام إدارة المعمل والتوزيع</p>
          <div className="madhaq-entry-progress"><span /></div>
        </div>
      </div>
    );
  }

  if (screen === 'welcome') {
    return (
      <div className="madhaq-entry" dir="rtl">
        <div className="madhaq-entry-orb orb-one" />
        <div className="madhaq-entry-orb orb-two" />
        <div className="madhaq-entry-panel">
          <div className="madhaq-entry-logo small"><img src="/madhaq_logo.png" alt="شعار مذاق" /></div>
          <span className="madhaq-entry-kicker">MADHAQ • FACTORY OS</span>
          <h1>مرحبًا بك في <strong>مذاق</strong></h1>
          <p>إدارة الإنتاج والمخزون والمشتريات والتوزيع والحسابات من مكان واحد.</p>
          <div className="madhaq-entry-points">
            <span><ShieldCheck /> يعمل محليًا بدون بريد إلكتروني</span>
            <span><LockKeyhole /> بياناتك التشغيلية تبقى على جهازك</span>
          </div>
          <button className="madhaq-entry-primary" onClick={start}>ابدأ الآن <ArrowLeft /></button>
        </div>
      </div>
    );
  }

  const isSetup = screen === 'setup';
  return (
    <div className="madhaq-entry" dir="rtl">
      <div className="madhaq-entry-orb orb-one" />
      <div className="madhaq-entry-orb orb-two" />
      <div className="madhaq-auth-card">
        <div className="madhaq-auth-brand">
          <div className="madhaq-entry-logo tiny"><img src="/madhaq_logo.png" alt="شعار مذاق" /></div>
          <div><strong>مذاق</strong><span>MADHAQ</span></div>
        </div>
        <div className="madhaq-auth-heading">
          <span>{isSetup ? 'التهيئة الأولى' : 'الدخول الآمن'}</span>
          <h1>{isSetup ? 'أنشئ مدير النظام' : 'تسجيل الدخول'}</h1>
          <p>{isSetup ? 'هذه الخطوة تظهر مرة واحدة على هذا الجهاز.' : 'أدخل اسم المستخدم وكلمة المرور التي أنشأتها.'}</p>
        </div>

        <form onSubmit={isSetup ? handleSetup : handleLogin} className="madhaq-auth-form">
          {isSetup && (
            <label>
              <span>اسم مدير النظام</span>
              <div className="madhaq-input"><UserRound /><input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="مثال: مدير المعمل" autoFocus /></div>
            </label>
          )}
          <label>
            <span>اسم المستخدم</span>
            <div className="madhaq-input"><UserRound /><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoComplete="username" /></div>
          </label>
          <label>
            <span>كلمة المرور</span>
            <div className="madhaq-input"><LockKeyhole /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isSetup ? 'new-password' : 'current-password'} /><button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}>{showPassword ? <EyeOff /> : <Eye />}</button></div>
          </label>
          {isSetup && (
            <label>
              <span>تأكيد كلمة المرور</span>
              <div className="madhaq-input"><LockKeyhole /><input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="أعد كتابة كلمة المرور" autoComplete="new-password" /></div>
            </label>
          )}
          {error && <div className="madhaq-auth-error" role="alert">{error}</div>}
          <button className="madhaq-entry-primary" disabled={busy}>{busy ? 'جارٍ التحقق…' : isSetup ? 'حفظ حساب المدير' : 'دخول إلى النظام'} {!isSetup && <LogIn />}</button>
        </form>

        {!isSetup && <div className="madhaq-auth-help">لا يوجد بريد إلكتروني مطلوب. الحساب محفوظ محليًا على هذا الجهاز.</div>}
      </div>
    </div>
  );
}
