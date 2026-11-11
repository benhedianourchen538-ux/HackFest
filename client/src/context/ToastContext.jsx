import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const STYLES = {
  success: { icon: CircleCheck, className: 'border-menthe/40 bg-white text-texte', iconClass: 'text-menthe' },
  error: { icon: CircleAlert, className: 'border-sup/40 bg-white text-texte', iconClass: 'text-sup' },
  info: { icon: Info, className: 'border-tech/40 bg-white text-texte', iconClass: 'text-tech' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const notify = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, message, type }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3" aria-live="polite">
        {toasts.map((t) => {
          const style = STYLES[t.type] ?? STYLES.info;
          const Icon = style.icon;
          return (
            <div key={t.id} role="status" className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${style.className}`}>
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} aria-hidden="true" />
              <p className="flex-1 text-sm">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-texte" aria-label="Fermer la notification">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans <ToastProvider>');
  return ctx;
}
