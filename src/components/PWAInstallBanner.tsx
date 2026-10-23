import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, X, HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // إذا تم تثبيته بالفعل كـ PWA يعمل كتطبيق مستقل
  if (isInstalled) {
    return null;
  }

  if (dismissed && !showIOSGuide) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 text-white px-4 py-3 shadow-md border-b border-amber-600/30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="font-bold text-base flex items-center gap-2">
                <span>تثبيت تطبيق مذاق على هاتفك المحمول</span>
                <span className="text-[11px] font-normal bg-amber-500/30 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/20">
                  يعمل بدون إنترنت 100%
                </span>
              </div>
              <p className="text-amber-100/90 text-xs">
                بياناتك خاصة ومحفوظة على جهازك فقط دون رفع لأي سيرفر. ثبّته ليعمل كتطبيق هاتف دائم.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>تثبيت على الهاتف الآن</span>
              </button>
            )}

            {isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <HelpCircle className="w-4 h-4" />
                <span>طريقة التثبيت على الآيفون</span>
              </button>
            )}

            {!isInstallable && !isIOS && (
              <button
                onClick={() => setShowIOSGuide(true)}
                className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
              >
                <Download className="w-4 h-4" />
                <span>تعليمات التثبيت</span>
              </button>
            )}

            <button
              onClick={() => setDismissed(true)}
              className="text-amber-200/70 hover:text-white p-1 rounded-lg"
              title="إغلاق التنبيه"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* نافذة إرشادات التثبيت على الهاتف */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-stone-900 border border-amber-600/40 rounded-2xl p-6 text-white shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 left-4 text-stone-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-300">كيف تثبت التطبيق على هاتفك؟</h3>
                <p className="text-xs text-stone-300">خطوات بسيطة ليظهر كأيقونة تطبيق مستقل</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-stone-200">
              <div className="bg-stone-800/80 p-3.5 rounded-xl border border-stone-700">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 text-xs flex items-center justify-center font-bold">1</span>
                  <span>على هواتف أندرويد (متصفح Chrome):</span>
                </div>
                <p className="text-xs text-stone-300 pr-6 leading-relaxed">
                  اضغط على زر القائمة (الثلاث نقاط ⋮ أعلى أو أسفل المتصفح) ثم اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"إضافة إلى الشاشة الرئيسية"</strong>.
                </p>
              </div>

              <div className="bg-stone-800/80 p-3.5 rounded-xl border border-stone-700">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 text-xs flex items-center justify-center font-bold">2</span>
                  <span>على هواتف آيفون (Safari):</span>
                </div>
                <p className="text-xs text-stone-300 pr-6 leading-relaxed">
                  اضغط على زر المشاركة <span className="inline-block px-1.5 py-0.5 bg-stone-700 rounded text-xs">⎋</span> أسفل الشاشة، ثم انزل للأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية"</strong> (Add to Home Screen).
                </p>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2 text-xs text-emerald-200">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>أمان وخصوصية تامة:</strong> التطبيق يعمل بالكامل دون الحاجة لشبكة الإنترنت؛ جميع سجلات الحسابات وفواتير التوزيع والمخزون مخزنة محلياً على جهازك.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-2.5 rounded-xl text-sm transition"
            >
              فهمت ذلك، تم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
