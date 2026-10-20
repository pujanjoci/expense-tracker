'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { calculateDailySpendingHeatmap, cn } from '@/lib/utils';
import { Flame } from 'lucide-react';

export function SpendingHeatmap() {
  const { transactions, formatMoney } = useApp();
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    amount: number;
    count: number;
  } | null>(null);

  const heatmapData = useMemo(() => {
    return calculateDailySpendingHeatmap(transactions, 84); // 12 weeks
  }, [transactions]);

  // Group into weeks (columns of 7 days)
  const weeks = useMemo(() => {
    const cols: typeof heatmapData[] = [];
    for (let i = 0; i < heatmapData.length; i += 7) {
      cols.push(heatmapData.slice(i, i + 7));
    }
    return cols;
  }, [heatmapData]);

  // Overall stats
  const { totalSpend, activeDays, maxDay } = useMemo(() => {
    let total = 0;
    let days = 0;
    let max = { date: '', amount: 0 };
    heatmapData.forEach((d) => {
      if (d.amount > 0) {
        total += d.amount;
        days++;
        if (d.amount > max.amount) {
          max = { date: d.date, amount: d.amount };
        }
      }
    });
    return { totalSpend: total, activeDays: days, maxDay: max };
  }, [heatmapData]);

  const getCellColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-emerald-500/30 hover:bg-emerald-500/60 border-emerald-500/40';
      case 2:
        return 'bg-teal-500/50 hover:bg-teal-500/80 border-teal-500/60';
      case 3:
        return 'bg-violet-500/60 hover:bg-violet-500/90 border-violet-500/70';
      case 4:
        return 'bg-rose-500/80 hover:bg-rose-500 border-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
      default:
        return 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700/60';
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Daily Spending Rhythm</span>
          </CardTitle>
          <CardDescription>
            Activity across the last 12 weeks ({activeDays} active spend days)
          </CardDescription>
        </div>

        {/* Hover info badge */}
        <div className="text-xs self-start sm:self-auto min-h-[24px]">
          {hoveredDay ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium">
              <span className="text-slate-500 dark:text-slate-400">{hoveredDay.date}:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums privacy-sensitive">
                {formatMoney(hoveredDay.amount)}
              </span>
              <span className="text-slate-500 dark:text-slate-400">({hoveredDay.count} tx)</span>
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Hover over a day to view details</span>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-1.5 min-w-[560px] justify-between">
            {weeks.map((week, wIdx) => (
              <div key={`week-${wIdx}`} className="flex flex-col gap-1.5">
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={cn(
                      'w-4 h-4 sm:w-5 sm:h-5 rounded-md border transition-all cursor-pointer',
                      getCellColor(day.level)
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-[11px]">
            Peak day: <strong className="text-slate-900 dark:text-slate-100">{maxDay.date || 'N/A'}</strong> (
            <span className="tabular-nums privacy-sensitive font-medium">{formatMoney(maxDay.amount)}</span>)
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Less</span>
            <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
            <span className="w-3 h-3 rounded-sm bg-emerald-500/30 border border-emerald-500/40" />
            <span className="w-3 h-3 rounded-sm bg-teal-500/50 border border-teal-500/60" />
            <span className="w-3 h-3 rounded-sm bg-violet-500/60 border border-violet-500/70" />
            <span className="w-3 h-3 rounded-sm bg-rose-500/80 border border-rose-400" />
            <span className="text-[10px]">More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
