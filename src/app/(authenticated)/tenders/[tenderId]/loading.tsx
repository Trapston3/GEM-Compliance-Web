import React from 'react';
import { Card, Skeleton } from '@/components/ui/primitives';

export default function TenderDetailLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      {/* Stats Skeletons */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <Card className="p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
    </div>
  );
}
