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
  sparklineColor?: string;
}

export function SummaryCard({
  title,
  amount,
  supportingText,
  changePercentage,
  changeType,
  icon: Icon,
  iconBgColor = 'bg-violet-500/15',
  iconColor = 'text-violet-600 dark:text-violet-400',
  sparklineColor,
}: SummaryCardProps) {
  const hasPercentage = changePercentage !== undefined && !isNaN(changePercentage);
  const isPositive = hasPercentage && changePercentage > 0;

  // Stroke color for subtle mini sparkline
  const stroke = sparklineColor || (
    changeType === 'positive'
      ? '#10b981'
      : changeType === 'negative'
      ? '#f43f5e'
      : '#8b5cf6'
  );

  return (
    <Card className="relative overflow-hidden group">
      {/* Subtle background glow */}
      <div
        className="absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-10 dark:opacity-20 pointer-events-none group-hover:opacity-25 transition-opacity"
        style={{ backgroundColor: stroke }}
      />

      <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full relative z-10">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </span>
          <div className={cn('p-2 rounded-xl border border-slate-200 dark:border-white/10 shadow-2xs shrink-0', iconBgColor, iconColor)}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>

        <div className="mt-2 sm:mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xl sm:text-2xl lg:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate tabular-nums privacy-sensitive">
              {amount}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              {hasPercentage && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded text-[10px] shrink-0 border',
                    changeType === 'positive'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : changeType === 'negative'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {changePercentage.toFixed(0)}%
                </span>
              )}
              {supportingText && <span className="truncate">{supportingText}</span>}
            </div>
          </div>

          {/* Mini elegant SVG Sparkline */}
          <div className="w-16 h-8 shrink-0 opacity-50 dark:opacity-60 group-hover:opacity-90 transition-opacity">
            <svg viewBox="0 0 64 32" className="w-full h-full overflow-visible">
              <path
                d={
                  changeType === 'positive'
                    ? 'M2 26 C 15 22, 28 25, 42 12 C 50 6, 58 8, 62 4'
                    : changeType === 'negative'
                    ? 'M2 6 C 16 10, 30 14, 44 20 C 52 24, 58 26, 62 28'
                    : 'M2 20 C 14 10, 26 24, 40 14 C 50 8, 56 16, 62 10'
                }
                fill="none"
                stroke={stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
