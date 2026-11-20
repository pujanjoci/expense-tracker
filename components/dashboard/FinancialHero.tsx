'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/Card';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import {
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Building2,
  Banknote,
  Smartphone,
  Layers,
} from 'lucide-react';

export function FinancialHero() {
  const {
    totalBalance,
    monthlyOverview,
    accountSummaries,
    accounts,
    formatMoney,
  } = useApp();

  const activeAccounts = useMemo(() => {
    return accounts.filter((a) => a.active);
  }, [accounts]);

  // Compute liquidity distribution across account types from real account summaries
  const distribution = useMemo(() => {
    const activeSummaries = accountSummaries.filter((a) => a.active);
    const positiveBalanceTotal = activeSummaries.reduce(
      (sum, a) => sum + (a.currentBalance > 0 ? a.currentBalance : 0),
      0
    );

    const typeGroups: Record<string, { label: string; icon: any; total: number; color: string }> = {
      bank: { label: 'Bank accounts', icon: Building2, total: 0, color: 'bg-indigo-500 dark:bg-indigo-400' },
      wallet: { label: 'Digital wallets', icon: Smartphone, total: 0, color: 'bg-teal-500 dark:bg-teal-400' },
      cash: { label: 'Physical cash', icon: Banknote, total: 0, color: 'bg-emerald-500 dark:bg-emerald-400' },
      other: { label: 'Other assets', icon: Layers, total: 0, color: 'bg-amber-500 dark:bg-amber-400' },
    };

    activeSummaries.forEach((a) => {
      const typeKey = a.type in typeGroups ? a.type : 'other';
      if (a.currentBalance > 0) {
        typeGroups[typeKey].total += a.currentBalance;
      }
    });

    const segments = Object.entries(typeGroups)
      .filter(([_, group]) => group.total > 0)
      .map(([type, group]) => ({
        type,
        label: group.label,
        icon: group.icon,
        total: group.total,
        percentage: positiveBalanceTotal > 0 ? (group.total / positiveBalanceTotal) * 100 : 0,
        color: group.color,
      }))
      .sort((a, b) => b.total - a.total);

    return {
      positiveBalanceTotal,
      segments,
    };
  }, [accountSummaries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
      {/* Primary Financial Position Anchor (Hero Card) */}
      <Card className="lg:col-span-5 relative overflow-hidden border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs">
        <CardContent className="p-5 sm:p-6 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Total liquid balance
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                <WalletCards className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>
                  {activeAccounts.length} active account{activeAccounts.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="mt-2.5">
              <div className="text-3xl sm:text-4xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums privacy-sensitive">
                {formatMoney(totalBalance)}
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Consolidated balance across checking, savings, and wallets
              </p>
            </div>
          </div>

          {/* Genuine Liquidity Allocation Rail */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">
              <span>Asset distribution</span>
              <span>
                {distribution.segments.length > 0
                  ? `${distribution.segments.length} source${distribution.segments.length !== 1 ? 's' : ''}`
                  : 'No active balances'}
              </span>
            </div>

            {distribution.segments.length > 0 ? (
              <>
                {/* Proportional Segment Bar */}
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                  {distribution.segments.map((seg) => (
                    <div
                      key={seg.type}
                      className={`${seg.color} h-full transition-all duration-300`}
                      style={{ width: `${Math.max(seg.percentage, 4)}%` }}
                      title={`${seg.label}: ${formatMoney(seg.total)} (${seg.percentage.toFixed(0)}%)`}
                    />
                  ))}
                </div>

                {/* Sub-label indicators */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  {distribution.segments.map((seg) => {
                    const Icon = seg.icon;
                    return (
                      <div key={seg.type} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${seg.color}`} />
                        <Icon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {seg.label}:
                        </span>
                        <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100 privacy-sensitive">
                          {seg.percentage.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400 italic">Add accounts and income to visualize liquidity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Velocity Metrics (3 Cards Grid) */}
      <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Monthly Income */}
        <SummaryCard
          title="Income this month"
          amount={formatMoney(monthlyOverview.totalIncome)}
          supportingText={
            monthlyOverview.incomeChangePercentage !== undefined
              ? 'vs last month'
              : 'current period'
          }
          changePercentage={monthlyOverview.incomeChangePercentage}
          changeType="positive"
          icon={ArrowDownLeft}
          iconBgColor="bg-emerald-500/10 dark:bg-emerald-500/15"
          iconColor="text-emerald-700 dark:text-emerald-400"
        />

        {/* Monthly Expenses */}
        <SummaryCard
          title="Expenses this month"
          amount={formatMoney(monthlyOverview.totalExpenses)}
          supportingText={
            monthlyOverview.expenseChangePercentage !== undefined
              ? 'vs last month'
              : 'current period'
          }
          changePercentage={monthlyOverview.expenseChangePercentage}
          changeType="negative"
          icon={ArrowUpRight}
          iconBgColor="bg-rose-500/10 dark:bg-rose-500/15"
          iconColor="text-rose-700 dark:text-rose-400"
        />

        {/* Net Savings & Savings Rate */}
        <SummaryCard
          title="Net savings"
          amount={formatMoney(monthlyOverview.netSavings)}
          supportingText={
            monthlyOverview.totalIncome > 0
              ? `${monthlyOverview.savingsRate.toFixed(0)}% savings rate`
              : 'net cash flow'
          }
          icon={PiggyBank}
          iconBgColor="bg-indigo-500/10 dark:bg-indigo-500/15"
          iconColor="text-indigo-700 dark:text-indigo-400"
        />
      </div>
    </div>
  );
}
