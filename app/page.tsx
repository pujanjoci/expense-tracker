'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { CategoryDonutChart } from '@/components/dashboard/CategoryDonutChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { DashboardSkeleton } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import {
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
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

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <DashboardHeader />

      {/* Summary Cards Grid: 2 columns on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Balance (Hero on mobile) */}
        <div className="col-span-2 sm:col-span-1">
          <SummaryCard
            title="Total Balance"
            amount={formatMoney(totalBalance)}
            supportingText={`${activeAccountsCount} active account${activeAccountsCount !== 1 ? 's' : ''}`}
            icon={WalletCards}
            iconBgColor="bg-slate-900"
            iconColor="text-white"
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
            iconBgColor="bg-emerald-50"
            iconColor="text-emerald-700"
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
            iconBgColor="bg-rose-50"
            iconColor="text-rose-700"
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
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-700"
          />
        </div>
      </div>

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
