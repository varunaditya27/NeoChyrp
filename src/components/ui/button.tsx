/* eslint-disable import/order */
/**
 * UI/Button:
 * - Basic accessible button component with variant system (extend later).
 * - Demonstrates co-located styling & composition pattern.
 */
import clsxFn from 'clsx';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', ...props },
  ref
) {
  return (
    <button
      ref={ref}
  className={clsxFn(
        'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:opacity-50',
        variant === 'primary' && 'bg-brand text-white hover:bg-brand/90',
        variant === 'secondary' && 'bg-neutral-200 hover:bg-neutral-300',
        variant === 'ghost' && 'hover:bg-neutral-100',
        className
      )}
      {...props}
    />
  );
});
