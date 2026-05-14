import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastContextValue {
  toast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-[380px] px-4 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-ink text-white px-4 py-3 rounded-2xl shadow-xl pointer-events-auto"
            style={{ animation: 'pageIn 200ms ease-out both' }}
          >
            {t.type === 'success'
              ? <CheckCircle size={16} className="text-success flex-shrink-0" />
              : <AlertCircle size={16} className="text-error flex-shrink-0" />
            }
            <span className="text-sm font-medium flex-1">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="opacity-60 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
