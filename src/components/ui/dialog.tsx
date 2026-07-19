'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Dialog({ isOpen, onClose, title, children, size = 'md' }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(15_27_45_/_0.62)] p-4 backdrop-blur-xs transition-opacity duration-200">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 cursor-default" 
        onClick={onClose} 
      />
      {/* Modal Dialog Content */}
      <div 
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${sizeClasses[size]} rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-2xl flex max-h-[90vh] flex-col overflow-hidden transform transition-all duration-200 ease-out z-10`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="p-5 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
