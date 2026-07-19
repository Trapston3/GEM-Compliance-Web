'use client';

import React, { useEffect } from 'react';
import { X, Command, Keyboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInputFocused = activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || (activeEl as HTMLElement).isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        if (isInputFocused && !isOpen) return;
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles state
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutsList = [
    { key: 'Ctrl + K / Cmd + K', description: 'Open Quick Jump search (search tenders & bidders)' },
    { key: 'Ctrl + / / Cmd + /', description: 'Toggle Keyboard Shortcuts Cheat Sheet' },
    { key: 'Esc', description: 'Close active modal, search popover, or drawer' },
    { key: 'Arrow Up / Down / Left / Right', description: 'Navigate Compliance Matrix grid cells' },
    { key: '1 / 2 / 3', description: 'Toggle Submission / Acceptance status in focused cell' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-[rgb(15_27_45_/_0.65)] backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          className="relative w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden z-10 p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Keyboard size={20} className="text-[var(--brand-primary)]" />
              <h3 className="font-bold text-base">Keyboard Shortcuts Cheat Sheet</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3">
            {shortcutsList.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <span className="font-semibold text-[var(--text-primary)]">{s.description}</span>
                <kbd className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--brand-primary)] font-bold shrink-0">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="pt-2 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-[var(--radius-sm)] bg-[var(--brand-primary)] text-[var(--brand-primary-text)] hover:bg-[var(--brand-primary-hover)] cursor-pointer"
            >
              Got it (Esc)
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
