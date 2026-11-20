'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  amount: string;
  supportingText?: string;
  changePercentage?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export function SummaryCard({
  title,
  amount,
  supportingText,
  changePercentage,
  changeType,
  icon: Icon,
  iconBgColor = 'bg-slate-100 dark:bg-slate-800',
  iconColor = 'text-slate-700 dark:text-slate-300',
}: SummaryCardProps) {
  const hasPercentage = changePercentage !== undefined && !isNaN(changePercentage);
  const isPositive = hasPercentage && changePercentage > 0;

  return (
    <Card className="relative overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs">
      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
          <div className={cn('p-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shrink-0', iconBgColor, iconColor)}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate tabular-nums privacy-sensitive">
            {amount}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {hasPercentage && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded text-[11px] shrink-0 border',
                  changeType === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : changeType === 'negative'
                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                )}
              >
                {isPositive ? '+' : ''}
                {changePercentage.toFixed(0)}%
              </span>
            )}
            {supportingText && <span className="truncate">{supportingText}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
