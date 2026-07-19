import React from 'react';
import { Card, Skeleton } from '@/components/ui/primitives';

export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <Card className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    </div>
  );
}
