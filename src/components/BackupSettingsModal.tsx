import React, { useRef, useState } from 'react';
import { storage } from '../services/storage';
import { validateDatabaseIntegrity } from '../services/dataIntegrity';
import {
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Lock
} from 'lucide-react';

interface BackupSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged: () => void;
}

export const BackupSettingsModal: React.FC<BackupSettingsModalProps> = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const jsonStr = storage.exportBackupJSON();
    const dateStr = new Date().toISOString().slice(0, 10);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `نسخة_احتياطية_معمل_مذاق_${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('تم تنزيل ملف النسخة الاحتياطية بنجاح إلى جهازك.');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('ملف النسخة الاحتياطية كبير جداً. الحد الأقصى 10 ميجابايت.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const audit = validateDatabaseIntegrity(parsed);

        if (!audit.valid) {
          const details = audit.issues
            .filter(issue => issue.severity === 'ERROR')
            .slice(0, 3)
            .map(issue => `${issue.area}: ${issue.message}`)
            .join(' | ');
          setErrorMessage(`تم رفض النسخة الاحتياطية لوجود ${audit.errors} أخطاء في البيانات. ${details}`);
          setTimeout(() => setErrorMessage(''), 8000);
          return;
        }

        const res = storage.importBackupJSON(content);
        if (res.success) {
          const warningText = audit.warnings > 0 ? ` مع ${audit.warnings} تنبيهات غير حرجة.` : '';
          setSuccessMessage(`تم فحص النسخة واسترجاعها بنجاح.${warningText}`);
          onDataChanged();
          setTimeout(() => setSuccessMessage(''), 5000);
        } else {
          setErrorMessage(res.error || 'فشل استرجاع الملف');
          setTimeout(() => setErrorMessage(''), 5000);
        }
      } catch {
        setErrorMessage('ملف النسخة الاحتياطية غير صالح أو تالف ولا يمكن قراءته.');
        setTimeout(() => setErrorMessage(''), 6000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    storage.resetToDefault();
    setConfirmReset(false);
    setSuccessMessage('تمت استعادة البيانات الافتراضية التجريبية لمعمل مذاق.');
    onDataChanged();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-stone-900 border border-amber-800/40 rounded-3xl p-6 text-white max-h-[92vh] overflow-y-auto shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300">النسخ الاحتياطي وأمان البيانات</h3>
              <p className="text-xs text-stone-400">فحص النسخة قبل الاستعادة لحماية سجلات المعمل</p>
            </div>
          </div>
          <button onClick={onClose} className="touch-target p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white" aria-label="إغلاق">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMessage && (
          <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-2xl text-rose-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>حماية البيانات محلياً:</span>
          </div>
          <p className="text-stone-300 leading-relaxed text-[11px]">
            البيانات التشغيلية محفوظة محلياً على الجهاز. عند استعادة نسخة، يقوم النظام أولاً بفحص الهيكل والمراجع والكميات والمبالغ لمنع إدخال نسخة تالفة أو غير متوافقة.
          </p>
        </div>

        <div className="space-y-3">
          <div className="font-bold text-xs text-stone-300">العمليات على البيانات:</div>

          <button
            onClick={handleDownloadBackup}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-right transition active:scale-[0.99] touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-100">تنزيل نسخة احتياطية كاملة (.json)</div>
                <div className="text-[11px] text-stone-400">احفظ جميع الموزعين والفواتير والمخزون والمشتريات على هاتفك</div>
              </div>
            </div>
          </button>

          <input type="file" accept=".json,application/json" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-750 border border-stone-700 text-right transition active:scale-[0.99] touch-target"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-stone-100">استرجاع نسخة احتياطية من ملف</div>
                <div className="text-[11px] text-stone-400">سيتم فحص الملف قبل استبدال بيانات الجهاز</div>
              </div>
            </div>
          </button>

          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl border border-stone-800 text-stone-400 hover:text-stone-200 text-xs transition touch-target"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>استعادة البيانات التجريبية الأولية</span>
            </button>
          ) : (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-2xl space-y-2 text-xs">
              <p className="text-rose-200 font-bold">هل أنت متأكد من استبدال البيانات الحالية بالبيانات التجريبية؟</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)} className="flex-1 py-2 rounded-xl border border-stone-700 text-xs touch-target">تراجع</button>
                <button onClick={handleResetData} className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-xs touch-target">نعم، استعد الافتراضي</button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-stone-800">
          <button onClick={onClose} className="w-full py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-xs font-bold text-stone-200 touch-target">إغلاق</button>
        </div>
      </div>
    </div>
  );
};
