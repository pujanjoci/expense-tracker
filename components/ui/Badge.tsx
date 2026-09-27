import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'danger' | 'warning' | 'info';
  icon?: LucideIcon;
}

export function Badge({
  className,
  variant = 'default',
  icon: Icon,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-slate-900 text-white',
    secondary: 'bg-slate-100 text-slate-800 border border-slate-200/80',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/80',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}
