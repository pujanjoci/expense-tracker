'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import {
  TrendingDown,
  TrendingUp,
  Sparkles,
  AlertCircle,
  Lightbulb,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function InsightsFeed() {
  const { insights } = useApp();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const visibleInsights = insights.filter((i) => !dismissedIds.includes(i.id));

  if (visibleInsights.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'decrease':
        return <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'increase':
        return <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'milestone':
        return <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Lightbulb className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
    }
  };

  const getCardStyle = (type: string) => {
    switch (type) {
      case 'decrease':
        return 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/[0.04]';
      case 'increase':
        return 'border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/[0.04]';
      case 'milestone':
        return 'border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/[0.04]';
      case 'warning':
        return 'border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/[0.04]';
      default:
        return 'border-violet-200 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/[0.04]';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {visibleInsights.map((insight) => (
        <div
          key={insight.id}
          className={cn(
            'relative group rounded-xl p-3.5 border transition-all duration-150',
            getCardStyle(insight.type)
          )}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-2xs border border-slate-200/60 dark:border-slate-700/60 shrink-0 mt-0.5">
              {getIcon(insight.type)}
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                  {insight.title}
                </h4>
                {insight.metric && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 tabular-nums">
                    {insight.metric}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {insight.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDismiss(insight.id)}
              className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Dismiss"
              aria-label="Dismiss insight"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
