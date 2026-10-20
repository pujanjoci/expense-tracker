'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BudgetModal } from '@/components/budgets/BudgetModal';
import { Budget, CategoryBudgetStatus } from '@/types';
import { CategoryIcon } from '@/lib/icons';
import { format, subMonths, addMonths, parse } from 'date-fns';
import {
  Target,
  Plus,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import { calculateBudgetsStatus, cn } from '@/lib/utils';

export default function BudgetsPage() {
  const { budgets, transactions, categories, formatMoney } = useApp();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => format(new Date(), 'yyyy-MM'));
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Month navigation
  const currentMonthDate = useMemo(() => {
    try {
      return parse(selectedMonth, 'yyyy-MM', new Date());
    } catch {
      return new Date();
    }
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    setSelectedMonth(format(subMonths(currentMonthDate, 1), 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    setSelectedMonth(format(addMonths(currentMonthDate, 1), 'yyyy-MM'));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(format(new Date(), 'yyyy-MM'));
  };

  // Status for the selected month
  const monthBudgetStatus = useMemo(() => {
    return calculateBudgetsStatus(budgets, transactions, categories, selectedMonth);
  }, [budgets, transactions, categories, selectedMonth]);

  // Overall totals
  const totalBudgeted = monthBudgetStatus.reduce((acc, b) => acc + b.monthlyLimit, 0);
  const totalSpent = monthBudgetStatus.reduce((acc, b) => acc + b.currentSpent, 0);
  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overallPercentage = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;
  const overBudgetCount = monthBudgetStatus.filter((b) => b.isOverBudget).length;
  const warningCount = monthBudgetStatus.filter((b) => b.isWarning).length;

  const handleOpenAdd = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Category Budgets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set monthly guardrails and prevent overspending with real-time alerts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Month Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer tabular-nums"
            >
              {format(currentMonthDate, 'MMMM yyyy')}
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button
            onClick={handleOpenAdd}
            icon={Plus}
            size="md"
            className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
          >
            New Budget
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Budgeted</span>
          <p className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1 tabular-nums privacy-sensitive">
            {formatMoney(totalBudgeted)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {monthBudgetStatus.length} categories planned
          </span>
        </div>

        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Spent</span>
          <p className="text-xl sm:text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-1 tabular-nums privacy-sensitive">
            {formatMoney(totalSpent)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {overallPercentage}% of total limit
          </span>
        </div>

        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Remaining</span>
          <p className="text-xl sm:text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums privacy-sensitive">
            {formatMoney(totalRemaining)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Available to spend
          </span>
        </div>

        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Alerts</span>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-slate-100 tabular-nums">
              {overBudgetCount + warningCount}
            </p>
            {overBudgetCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                {overBudgetCount} Over limit
              </span>
            ) : warningCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {warningCount} Near limit
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                All healthy
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {overBudgetCount > 0 ? 'Action needed' : 'Under control'}
          </span>
        </div>
      </div>

      {/* Category Budgets Grid */}
      {monthBudgetStatus.length === 0 ? (
        <div className="aurora-card rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100">
            No budgets for {format(currentMonthDate, 'MMMM yyyy')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Set monthly limits for your frequent expense categories like Groceries, Dining, or Shopping to stay on track.
          </p>
          <div className="mt-5">
            <Button
              onClick={handleOpenAdd}
              icon={Plus}
              className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
            >
              Set First Budget
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {monthBudgetStatus.map((item) => {
            const isOver = item.isOverBudget;
            const isWarn = item.isWarning;

            return (
              <div
                key={item.budget.id}
                onClick={() => handleOpenEdit(item.budget)}
                className={cn(
                  'aurora-card p-4 rounded-2xl cursor-pointer hover:border-violet-500/40 transition-all group relative overflow-hidden',
                  isOver && 'border-rose-300 dark:border-rose-500/40 bg-rose-50/30 dark:bg-rose-500/[0.02]',
                  isWarn && !isOver && 'border-amber-300 dark:border-amber-500/40 bg-amber-50/30 dark:bg-amber-500/[0.02]'
                )}
              >
                {/* Header: Icon & Category & Percentage */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs',
                        isOver
                          ? 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400'
                          : isWarn
                          ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-violet-50 dark:bg-violet-500/15 border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400'
                      )}
                    >
                      <CategoryIcon name={item.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                        {item.categoryName}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Limit: {formatMoney(item.monthlyLimit)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={cn(
                        'text-xs font-bold font-display tabular-nums px-2 py-0.5 rounded-full border',
                        isOver
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : isWarn
                          ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      )}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar with glowing indicator */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden my-3">
                  <div
                    className={cn(
                      'h-full transition-all duration-500 rounded-full',
                      isOver
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                        : isWarn
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    )}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>

                {/* Footer details: Spent vs Remaining */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Spent: </span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums privacy-sensitive">
                      {formatMoney(item.currentSpent)}
                    </span>
                  </div>
                  <div>
                    {isOver ? (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold tabular-nums privacy-sensitive flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 inline" />
                        +{formatMoney(item.currentSpent - item.monthlyLimit)} over
                      </span>
                    ) : (
                      <span className="text-slate-600 dark:text-slate-400 tabular-nums privacy-sensitive">
                        {formatMoney(item.remaining)} left
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingBudget={editingBudget}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
