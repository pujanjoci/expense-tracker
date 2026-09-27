'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AnalyticsPeriod, Transaction, Account, Category } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  filterTransactionsByPeriod,
  calculateCategoryBreakdown,
  calculateMonthlyTrends,
  calculateAccountBalances,
  parseAmountSafe,
} from '@/lib/utils';
import { CategoryIcon } from '@/lib/icons';
import { AccountBadge } from '@/components/accounts/AccountBadge';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Percent,
  WalletCards,
  Building2,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = [
  '#0f172a',
  '#3b82f6',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#64748b',
];

interface AnalyticsChartsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
}

export function AnalyticsCharts({ transactions, accounts, categories }: AnalyticsChartsProps) {
  const { formatMoney } = useApp();

  const [period, setPeriod] = useState<AnalyticsPeriod>('this-month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Calculate live account balance summaries
  const accountSummaries = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  // Filter transactions according to selected period
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByPeriod(transactions, period, customStart, customEnd);
  }, [transactions, period, customStart, customEnd]);

  // Aggregate metrics
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + parseAmountSafe(t.amount), 0);
  }, [filteredTransactions]);

  const totalExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + parseAmountSafe(t.amount), 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Category breakdowns
  const categoryExpenses = useMemo(() => {
    return calculateCategoryBreakdown(filteredTransactions, categories, 'expense');
  }, [filteredTransactions, categories]);

  const categoryIncomes = useMemo(() => {
    return calculateCategoryBreakdown(filteredTransactions, categories, 'income');
  }, [filteredTransactions, categories]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(transactions, 6);
  }, [transactions]);

  // Account flow metrics for selected period
  const accountFlows = useMemo(() => {
    const flows: Record<string, { income: number; expense: number; transferIn: number; transferOut: number }> = {};
    accounts.forEach((a) => {
      flows[a.id] = { income: 0, expense: 0, transferIn: 0, transferOut: 0 };
    });

    filteredTransactions.forEach((tx) => {
      const amt = parseAmountSafe(tx.amount);
      if (flows[tx.accountId]) {
        if (tx.type === 'income') flows[tx.accountId].income += amt;
        if (tx.type === 'expense') flows[tx.accountId].expense += amt;
        if (tx.type === 'transfer') flows[tx.accountId].transferOut += amt;
      }
      if (tx.type === 'transfer' && tx.transferToAccountId && flows[tx.transferToAccountId]) {
        flows[tx.transferToAccountId].transferIn += amt;
      }
    });

    return flows;
  }, [accounts, filteredTransactions]);

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <CategoryIcon name={item.icon} className="w-3.5 h-3.5" />
            <span>{item.categoryName}</span>
          </div>
          <p className="text-slate-600 font-medium">
            {formatMoney(item.total)} ({item.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Account Balances Section in Analytics */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <WalletCards className="w-4 h-4 text-slate-600" />
            <span>Account Holdings & Balances</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountSummaries
            .filter((acc) => acc.active)
            .map((acc) => {
              const flow = accountFlows[acc.id] || { income: 0, expense: 0, transferIn: 0, transferOut: 0 };
              const isBank = acc.type === 'bank' || /bank/i.test(acc.name);
              const Icon = isBank ? Building2 : Smartphone;

              return (
                <Card key={acc.id} className="relative overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'p-2 rounded-lg border shadow-2xs',
                            isBank
                              ? 'bg-blue-50 text-blue-700 border-blue-200/80'
                              : 'bg-purple-50 text-purple-700 border-purple-200/80'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{acc.name}</h4>
                          <span className="text-xs text-slate-500 capitalize">{acc.type}</span>
                        </div>
                      </div>
                      <AccountBadge account={acc} />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-medium">Current Balance:</span>
                      <span
                        className={cn(
                          'text-base font-bold',
                          acc.currentBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                        )}
                      >
                        {formatMoney(acc.currentBalance)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-500">
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-400 block text-[10px]">Period Inflow:</span>
                        <span className="font-semibold text-emerald-600">
                          +{formatMoney(flow.income + flow.transferIn)}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-400 block text-[10px]">Period Outflow:</span>
                        <span className="font-semibold text-rose-600">
                          -{formatMoney(flow.expense + flow.transferOut)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Period Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <Button
            variant={period === 'this-month' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('this-month')}
          >
            This Month
          </Button>
          <Button
            variant={period === 'last-month' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('last-month')}
          >
            Last Month
          </Button>
          <Button
            variant={period === 'last-3-months' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('last-3-months')}
          >
            Last 3M
          </Button>
          <Button
            variant={period === 'last-6-months' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('last-6-months')}
          >
            Last 6M
          </Button>
          <Button
            variant={period === 'this-year' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('this-year')}
          >
            This Year
          </Button>
          <Button
            variant={period === 'all' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('all')}
          >
            All Time
          </Button>
          <Button
            variant={period === 'custom' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setPeriod('custom')}
          >
            Custom Range
          </Button>
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            <Input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-8 text-xs"
            />
            <span className="text-slate-400 text-xs">to</span>
            <Input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        )}
      </div>

      {/* Summary Row for Period */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Income
              </span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">{formatMoney(totalIncome)}</div>
              <p className="mt-1 text-xs text-slate-500">Earned in selected period</p>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Expenses
              </span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">{formatMoney(totalExpense)}</div>
              <p className="mt-1 text-xs text-slate-500">Spent in selected period</p>
            </div>
          </CardContent>
        </Card>

        {/* Net Savings */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Net Savings
              </span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                <PiggyBank className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={cn('text-2xl font-bold', netSavings >= 0 ? 'text-slate-900' : 'text-rose-600')}>
                {formatMoney(netSavings)}
              </div>
              <p className="mt-1 text-xs text-slate-500">Income minus expenses</p>
            </div>
          </CardContent>
        </Card>

        {/* Savings Rate */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Savings Rate
              </span>
              <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/80">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900">
                {savingsRate.toFixed(1)}%
              </div>
              <p className="mt-1 text-xs text-slate-500">Of total income saved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Spending Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Where your money went in this period</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {categoryExpenses.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                No expense transactions found for this period.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={categoryExpenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="total"
                      >
                        {categoryExpenses.map((entry, index) => (
                          <Cell
                            key={`exp-${entry.categoryId}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 max-h-56 overflow-y-auto">
                  {categoryExpenses.map((item, idx) => (
                    <div key={item.categoryId} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <CategoryIcon name={item.icon} className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-medium text-slate-800">{item.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{formatMoney(item.total)}</span>
                          <span className="text-slate-400 w-10 text-right font-medium">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income by Category */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Income Sources</CardTitle>
            <CardDescription>Income breakdown by category</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {categoryIncomes.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                No income transactions found for this period.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={categoryIncomes}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="total"
                      >
                        {categoryIncomes.map((entry, index) => (
                          <Cell
                            key={`inc-${entry.categoryId}`}
                            fill={COLORS[index % COLORS.length]}
                            stroke="none"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 max-h-56 overflow-y-auto">
                  {categoryIncomes.map((item, idx) => (
                    <div key={item.categoryId} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <CategoryIcon name={item.icon} className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-medium text-slate-800">{item.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{formatMoney(item.total)}</span>
                          <span className="text-slate-400 w-10 text-right font-medium">
                            {item.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cash Flow History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Trend (Last 6 Months)</CardTitle>
          <CardDescription>Comparison of income vs expenses across previous months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyTrends}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                barGap={6}
                barSize={16}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="monthLabel"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => formatMoney(Number(val))}
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
