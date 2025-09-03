import { clsx } from 'clsx';
import React from 'react';

/** Shared max-width wrapper */
export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export default Container;
