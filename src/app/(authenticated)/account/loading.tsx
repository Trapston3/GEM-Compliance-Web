import React from 'react';
import { Card, Skeleton } from '@/components/ui/primitives';

export default function AccountLoading() {
  return (
    <div className="p-4 sm:p-6 space-y-6 animate-pulse max-w-2xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Card className="p-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </Card>
    </div>
  );
}
