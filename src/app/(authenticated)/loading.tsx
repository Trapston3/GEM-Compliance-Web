import React from 'react';
import { Card, Skeleton } from '@/components/ui/primitives';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--bg-app)] p-6 space-y-6">
      {/* Skeleton Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Skeleton Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-5 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>

      {/* Skeleton Content Section */}
      <Card className="p-6 flex-1 flex flex-col space-y-4">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-3 w-96" />
        
        {/* Fake Matrix Rows */}
        <div className="flex-1 space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-7 w-1/3" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-7 w-16" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
