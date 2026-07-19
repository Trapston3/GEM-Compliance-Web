'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

export default function AppLoader({ message = 'Loading Tender Compliance Portal...' }: { message?: string }) {
  return (
    <div className="flex h-full w-full min-h-[300px] flex-col items-center justify-center space-y-4 bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-200">
      <div className="rounded-full bg-[var(--brand-primary)]/10 p-4 text-[var(--brand-primary)] shadow-sm">
        <Loader2 size={32} className="animate-spin" />
      </div>
      <p className="text-xs font-semibold text-[var(--text-muted)] animate-pulse">
        {message}
      </p>
    </div>
  );
}
