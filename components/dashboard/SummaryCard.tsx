'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { LucideIcon, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown } from 'lucide-react';
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
  const isNegative = hasPercentage && changePercentage < 0;

  return (
    <Card className="hover:border-slate-300 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">
            {title}
          </span>
          <div className={cn('p-2 rounded-lg border border-slate-200/60 shadow-2xs', iconBgColor, iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {amount}
          </div>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium min-h-[20px]">
            {hasPercentage && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded text-[11px]',
                  // For income: positive change is good (emerald), negative is bad (rose)
                  // For expense: positive change is more expenses (rose), negative is less expenses (emerald)
                  changeType === 'positive'
                    ? 'bg-emerald-50 text-emerald-700'
                    : changeType === 'negative'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-700'
                )}
              >
                {isPositive ? '+' : ''}
                {changePercentage.toFixed(1)}%
              </span>
            )}
            {supportingText && <span>{supportingText}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
