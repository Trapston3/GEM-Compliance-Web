'use client';

import React, { useEffect, useRef } from 'react';
import { Check, Info, X, Loader2 } from 'lucide-react';
import type { StatusPresentation } from '@/lib/statusPresentation';

// ==========================================
// BUTTON COMPONENT
// ==========================================
export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  buttonState?: 'idle' | 'loading' | 'success';
  children: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  buttonState = 'idle',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 rounded-[var(--radius-sm)] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none';

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'min-h-9 px-3 text-xs',
    md: 'min-h-11 px-4 text-sm',
    lg: 'min-h-12 px-5 text-base',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--brand-primary)] text-[var(--brand-primary-text)] hover:bg-[var(--brand-primary-hover)] shadow-xs',
    secondary: 'bg-[var(--brand-secondary)] text-[var(--brand-secondary-text)] border border-[var(--border-strong)] hover:bg-[var(--brand-secondary-hover)]',
    quiet: 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
    ghost: 'text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]',
    danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[var(--status-danger)]/30 hover:bg-[var(--status-danger)]/15',
  };

  const isActuallyLoading = isLoading || buttonState === 'loading';
  const isSuccess = buttonState === 'success';

  return (
    <button
      {...props}
      disabled={disabled || isActuallyLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${
        isSuccess ? 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success)]/30' : ''
      } ${className}`}
    >
      {isActuallyLoading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin text-current shrink-0" />}
      {isSuccess && <Check size={size === 'sm' ? 14 : 16} className="text-[var(--status-success-text)] shrink-0 animate-in zoom-in-50" />}
      {children}
    </button>
  );
}

// ==========================================
// BADGE COMPONENT
// ==========================================
export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'note';

export function Badge({
  children,
  tone = 'neutral',
  className = ''
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  const tones: Record<BadgeTone, string> = {
    neutral: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)] border border-[var(--border-subtle)]',
    success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border border-[var(--status-success)]/30',
    warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border border-[var(--status-warning)]/30',
    danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[var(--status-danger)]/30',
    note: 'bg-[var(--status-note-bg)] text-[var(--status-note-text)] border border-[var(--status-note)]/30',
  };

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-bold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

// ==========================================
// CARD COMPONENT
// ==========================================
export function Card({
  children,
  className = '',
  hoverable = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hoverable?: boolean }) {
  const hoverClasses = hoverable ? 'transition-all duration-150 hover:border-[var(--brand-primary)] hover:shadow-md' : '';
  return (
    <div {...props} className={`mrpl-surface ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
}

// ==========================================
// EMPTY STATE COMPONENT
// ==========================================
export function EmptyState({
  title,
  description,
  action,
  icon: Icon = Info,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="mrpl-surface flex min-h-48 flex-col items-center justify-center p-8 text-center">
      <div className="mb-3 rounded-full bg-[var(--bg-subtle)] p-3 text-[var(--brand-primary)]">
        <Icon size={24} aria-hidden="true" />
      </div>
      <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-[var(--text-muted)] leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ==========================================
// PAGE HEADER COMPONENT
// ==========================================
export function PageHeader({
  title,
  description,
  actions,
  tag,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  tag?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-[var(--border-subtle)] pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {title}
          </h1>
          {tag}
        </div>
        {description && (
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ==========================================
// SECTION HEADER COMPONENT
// ==========================================
export function SectionHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

// ==========================================
// TABS COMPONENT
// ==========================================
export function Tabs({
  items,
  active,
  onChange
}: {
  items: { id: string; label: string; icon?: React.ComponentType<{ size?: number }> }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" className="flex w-full gap-1 overflow-x-auto rounded-[var(--radius-md)] bg-[var(--bg-subtle)] p-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            type="button"
            role="tab"
            aria-selected={isActive}
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`min-h-11 shrink-0 flex items-center gap-2 rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition-colors cursor-pointer ${
              isActive
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            {Icon && <Icon size={16} />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ==========================================
// SKELETON COMPONENT
// ==========================================
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-shimmer rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] ${className}`} />
  );
}

// ==========================================
// LOADING COMPONENT
// ==========================================
export function Loading({ text = 'Loading...', className = '' }: { text?: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center text-[var(--text-muted)] ${className}`}>
      <Loader2 size={28} className="animate-spin text-[var(--brand-primary)] mb-3" />
      <span className="text-sm font-semibold">{text}</span>
    </div>
  );
}

// ==========================================
// FORM INPUT COMPONENTS
// ==========================================
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({ label, error, helperText, className = '', id, ...props }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-primary)] ${
          error ? 'border-[var(--status-danger)]' : ''
        } ${className}`}
      />
      {error && <p className="text-xs text-[var(--status-danger-text)] font-semibold mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({ label, error, helperText, className = '', id, ...props }: TextareaProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        {...props}
        className={`w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-primary)] ${
          error ? 'border-[var(--status-danger)]' : ''
        } ${className}`}
      />
      {error && <p className="text-xs text-[var(--status-danger-text)] font-semibold mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export function Select({ label, error, helperText, children, className = '', id, ...props }: SelectProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={`min-h-11 w-full rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand-primary)] cursor-pointer ${
          error ? 'border-[var(--status-danger)]' : ''
        } ${className}`}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[var(--status-danger-text)] font-semibold mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-[var(--text-muted)] mt-1">{helperText}</p>}
    </div>
  );
}

// ==========================================
// SHEET / STATUS HELPER COMPONENTS
// ==========================================
export function StatusLegend({ items }: { items: StatusPresentation[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)]" aria-label="Status legend">
      {items.map((item) => (
        <span key={item.tone} className="inline-flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${item.className}`} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function Sheet({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    ref.current?.querySelector<HTMLElement>('button, input, select, textarea, [href]')?.focus();
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(15_27_45_/_0.62)] p-0 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-t-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5 shadow-2xl sm:rounded-[var(--radius-lg)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusIcon({ tone }: { tone: StatusPresentation['tone'] }) {
  return tone === 'submitted' ? <Check size={14} aria-hidden="true" /> : tone === 'note-added' ? <Info size={14} aria-hidden="true" /> : null;
}

export { Dialog } from './dialog';

