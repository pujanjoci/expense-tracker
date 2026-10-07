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
  iconBgColor = 'bg-slate-100',
  iconColor = 'text-slate-700',
}: SummaryCardProps) {
  // Format percentage if available
  const hasPercentage = changePercentage !== undefined && !isNaN(changePercentage);
  const isPositive = hasPercentage && changePercentage > 0;

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardContent className="p-3 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 tracking-wider uppercase truncate">
            {title}
          </span>
          <div className={cn('p-1.5 sm:p-2 rounded-lg border border-slate-200/60 shadow-2xs shrink-0', iconBgColor, iconColor)}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="mt-1.5 sm:mt-3">
          <div className="text-lg sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 truncate">
            {amount}
          </div>

          <div className="mt-0.5 sm:mt-2 flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500 font-medium min-h-[18px]">
            {hasPercentage && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold px-1 sm:px-1.5 py-0.2 rounded text-[9px] sm:text-[11px] shrink-0',
                  changeType === 'positive'
                    ? 'bg-emerald-50 text-emerald-700'
                    : changeType === 'negative'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-700'
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
