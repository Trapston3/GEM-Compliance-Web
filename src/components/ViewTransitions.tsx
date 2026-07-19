'use client';

import React, { ViewTransition } from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <ViewTransition default="none" enter="auto" exit="auto">
      {children}
    </ViewTransition>
  );
}
