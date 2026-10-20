'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { InsightsFeed } from '@/components/dashboard/InsightsFeed';
import { DashboardSkeleton } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Repeat,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    transactions,
    accounts,
    categories,
    totalBalance,
    monthlyOverview,
    categorySpending,
    monthlyTrends,
    budgetStatus,
    recurringTransactions,
    isLoading,
    error,
    refreshData,
    formatMoney,
  } = useApp();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error && transactions.length === 0) {
    return <ErrorState message={error} onRetry={refreshData} />;
  }

  const activeAccountsCount = accounts.filter((a) => a.active).length;
  const warningBudgets = budgetStatus.filter((b) => b.isWarning || b.isOverBudget);
  const activeSubsCount = recurringTransactions.filter((r) => r.active).length;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <DashboardHeader />

      {/* Plain-Language Insights Feed */}
      <InsightsFeed />

      {/* Summary Cards Grid: 2 columns on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Balance */}
        <div className="col-span-2 sm:col-span-1">
          <SummaryCard
            title="Total Balance"
            amount={formatMoney(totalBalance)}
            supportingText={`${activeAccountsCount} active account${activeAccountsCount !== 1 ? 's' : ''}`}
            icon={WalletCards}
            iconBgColor="bg-violet-500/15"
            iconColor="text-violet-600 dark:text-violet-400"
          />
        </div>

        {/* Monthly Income */}
        <div className="col-span-1">
          <SummaryCard
            title="Income"
            amount={formatMoney(monthlyOverview.totalIncome)}
            supportingText={
              monthlyOverview.incomeChangePercentage !== undefined
                ? 'this month'
                : 'current month'
            }
            changePercentage={monthlyOverview.incomeChangePercentage}
            changeType="positive"
            icon={ArrowDownLeft}
            iconBgColor="bg-emerald-500/15"
            iconColor="text-emerald-600 dark:text-emerald-400"
          />
        </div>

        {/* Monthly Expenses */}
        <div className="col-span-1">
          <SummaryCard
            title="Expenses"
            amount={formatMoney(monthlyOverview.totalExpenses)}
            supportingText={
              monthlyOverview.expenseChangePercentage !== undefined
                ? 'vs last month'
                : 'current month'
            }
            changePercentage={monthlyOverview.expenseChangePercentage}
            changeType="negative"
            icon={ArrowUpRight}
            iconBgColor="bg-rose-500/15"
            iconColor="text-rose-600 dark:text-rose-400"
          />
        </div>

        {/* Savings / Remaining */}
        <div className="col-span-2 sm:col-span-1">
          <SummaryCard
            title="Savings / Net"
            amount={formatMoney(monthlyOverview.netSavings)}
            supportingText={
              monthlyOverview.totalIncome > 0
                ? `${monthlyOverview.savingsRate.toFixed(0)}% savings rate`
                : 'net cash flow'
            }
            icon={PiggyBank}
            iconBgColor="bg-amber-500/15"
            iconColor="text-amber-600 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Budgets & Recurring Quick Alerts Bar (if any alerts) */}
      {(warningBudgets.length > 0 || activeSubsCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {warningBudgets.length > 0 && (
            <Link
              href="/budgets"
              className="aurora-glass rounded-xl p-3 border border-rose-300 dark:border-rose-500/25 bg-rose-50/50 dark:bg-rose-500/[0.04] flex items-center justify-between hover:border-rose-400 dark:hover:border-rose-500/40 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {warningBudgets.length} Budget Alert{warningBudgets.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {warningBudgets.map((b) => b.categoryName).join(', ')} near or over limit
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          )}

          {activeSubsCount > 0 && (
            <Link
              href="/recurring"
              className="aurora-glass rounded-xl p-3 border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 flex items-center justify-between hover:border-violet-300 dark:hover:border-violet-500/30 transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400 shrink-0">
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {activeSubsCount} Active Subscription{activeSubsCount > 1 ? 's' : ''}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Track recurring expenses & upcoming charges
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
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
