'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { FinancialHero } from '@/components/dashboard/FinancialHero';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';
import { DashboardSkeleton } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { ChevronRight, AlertTriangle, Repeat } from 'lucide-react';

export default function DashboardPage() {
  const {
    transactions,
    accounts,
    categories,
    categorySpending,
    monthlyTrends,
    budgetStatus,
    recurringTransactions,
    isLoading,
    error,
    refreshData,
  } = useApp();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error && transactions.length === 0) {
    return <ErrorState message={error} onRetry={refreshData} />;
  }

  const warningBudgets = budgetStatus.filter((b) => b.isWarning || b.isOverBudget);
  const activeSubsCount = recurringTransactions.filter((r) => r.active).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <DashboardHeader />

      {/* Financial Position Hero Anchor with Live Liquidity Rail & Monthly Flows */}
      <FinancialHero />

      {/* Contextual Insights Feed */}
      <InsightsFeed />

      {/* Budgets & Recurring Alerts Bar (Shown only when action is needed) */}
      {(warningBudgets.length > 0 || activeSubsCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {warningBudgets.length > 0 && (
            <Link
              href="/budgets"
              className="rounded-xl p-3 border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 flex items-center justify-between hover:border-rose-300 dark:hover:border-rose-800 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {warningBudgets.length} budget alert{warningBudgets.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {warningBudgets.map((b) => b.categoryName).join(', ')} near or over limit
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          )}

          {activeSubsCount > 0 && (
            <Link
              href="/recurring"
              className="rounded-xl p-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shrink-0">
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {activeSubsCount} active subscription{activeSubsCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Track recurring expenses & upcoming charges
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <IncomeExpenseChart data={monthlyTrends} />
        </div>
        <div className="lg:col-span-1">
          <CategoryDonutChart data={categorySpending} />
        </div>
      </div>

      {/* Recent Transactions List */}
      <div>
        <RecentTransactions
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          limit={6}
        />
      </div>
    </div>
  );
}
