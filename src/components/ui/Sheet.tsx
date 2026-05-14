import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        style={{ animation: 'backdropIn 200ms ease-out both' }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-[460px] bg-bg rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
        style={{ animation: 'sheetIn 320ms cubic-bezier(0.32, 0.72, 0, 1) both' }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-divider flex-shrink-0">
          {title && (
            <h2 className="font-display font-bold text-xl tracking-tight">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="ml-auto w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-ink-secondary hover:text-ink transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 pb-8 pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}
