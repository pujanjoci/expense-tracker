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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Dynamic Header */}
      <DashboardHeader />

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <SummaryCard
          title="Total Balance"
          amount={formatMoney(totalBalance)}
          supportingText="Across active accounts"
          icon={WalletCards}
          iconBgColor="bg-slate-100"
          iconColor="text-slate-800"
        />

        {/* Monthly Income */}
        <SummaryCard
          title="Monthly Income"
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

        {/* Monthly Expenses */}
        <SummaryCard
          title="Monthly Expenses"
          amount={formatMoney(monthlyOverview.totalExpenses)}
          supportingText={
            monthlyOverview.expenseChangePercentage !== undefined
              ? 'compared with last month'
              : 'current month'
          }
          changePercentage={monthlyOverview.expenseChangePercentage}
          changeType="negative"
          icon={ArrowUpRight}
          iconBgColor="bg-rose-50"
          iconColor="text-rose-700"
        />

        {/* Savings / Remaining */}
        <SummaryCard
          title="Savings / Remaining"
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

      {/* Responsive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
