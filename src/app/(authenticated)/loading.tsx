import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-950 p-6 space-y-6">
      
      {/* Skeleton Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-zinc-800 animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
          <div className="h-3 w-32 bg-slate-200 dark:bg-zinc-850 rounded"></div>
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-zinc-800 rounded-xl"></div>
      </div>

      {/* Skeleton Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-5 rounded-2xl space-y-2">
            <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Skeleton Content Section */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 p-6 rounded-2xl flex-1 flex flex-col space-y-4 animate-pulse">
        <div className="h-4 w-64 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
        <div className="h-3 w-96 bg-slate-200 dark:bg-zinc-850 rounded"></div>
        
        {/* Fake Matrix Rows */}
        <div className="flex-1 space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="h-7 w-1/3 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
              <div className="h-7 w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
              <div className="h-7 w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
              <div className="h-7 w-16 bg-slate-200 dark:bg-zinc-800 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
