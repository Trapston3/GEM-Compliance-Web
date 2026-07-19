'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="alert"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className={`flex items-center justify-between p-4 rounded-[var(--radius-md)] shadow-xl border text-sm font-semibold pointer-events-auto ${
                t.type === 'success'
                  ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[var(--status-success)]/30'
                  : t.type === 'error'
                  ? 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[var(--status-danger)]/30'
                  : t.type === 'warning'
                  ? 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[var(--status-warning)]/30'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border-subtle)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {t.type === 'success' && <CheckCircle2 size={16} className="text-[var(--status-success)] shrink-0" />}
                {t.type === 'error' && <AlertCircle size={16} className="text-[var(--status-danger)] shrink-0" />}
                {t.type === 'warning' && <AlertCircle size={16} className="text-[var(--status-warning)] shrink-0" />}
                {t.type === 'info' && <Info size={16} className="text-[var(--brand-primary)] shrink-0" />}
                <span>{t.message}</span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="ml-4 p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] shrink-0 focus:outline-none cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
