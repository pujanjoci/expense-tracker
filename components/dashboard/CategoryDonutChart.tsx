'use client';

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { CategorySpending } from '@/types';
import { useApp } from '@/context/AppContext';
import { CategoryIcon } from '@/lib/icons';
import { PieChart as PieIcon } from 'lucide-react';
import { filterTransactionsByPeriod, calculateCategoryBreakdown, cn } from '@/lib/utils';

const COLORS = [
  '#0f172a', // Slate 900
  '#3b82f6', // Blue 500
  '#f59e0b', // Amber 500
  '#ec4899', // Pink 500
  '#8b5cf6', // Violet 500
  '#10b981', // Emerald 500
  '#06b6d4', // Cyan 500
  '#f97316', // Orange 500
  '#64748b', // Slate 500
];

interface CategoryDonutChartProps {
  data?: CategorySpending[];
}

export function CategoryDonutChart({ data }: CategoryDonutChartProps) {
  const { formatMoney, transactions, categories } = useApp();
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('month');

  // Calculate dynamic spending breakdown according to selected timeframe
  const spendingData = useMemo(() => {
    if (timeframe === 'week') {
      const weekTx = filterTransactionsByPeriod(transactions, 'this-week');
      return calculateCategoryBreakdown(weekTx, categories, 'expense');
    }
    if (timeframe === 'month') {
      const monthTx = filterTransactionsByPeriod(transactions, 'this-month');
      return calculateCategoryBreakdown(monthTx, categories, 'expense');
    }
    // 'all' time: use provided data or compute from all transactions
    if (data && data.length > 0) return data;
    return calculateCategoryBreakdown(transactions, categories, 'expense');
  }, [timeframe, transactions, categories, data]);

  const totalSpending = spendingData.reduce((sum, item) => sum + item.total, 0);
  const displayCategories = spendingData.slice(0, 5);
  const otherTotal = spendingData.slice(5).reduce((sum, item) => sum + item.total, 0);

  const chartData = [...displayCategories];
  if (otherTotal > 0) {
    chartData.push({
      categoryId: 'others',
      categoryName: 'Other Categories',
      icon: 'HelpCircle',
      type: 'expense',
      total: otherTotal,
      percentage: totalSpending > 0 ? (otherTotal / totalSpending) * 100 : 0,
      transactionCount: spendingData.slice(5).reduce((c, i) => c + i.transactionCount, 0),
    });
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as CategorySpending;
      return (
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <CategoryIcon name={item.icon} className="w-3.5 h-3.5 text-slate-700" />
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
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3">
        <div>
          <CardTitle>Spending by Category</CardTitle>
          <CardDescription>
            {timeframe === 'week' ? 'This week' : timeframe === 'month' ? 'This month' : 'All time'}
            {totalSpending > 0 && ` • ${formatMoney(totalSpending)}`}
          </CardDescription>
        </div>

        {/* Timeframe Pill Switch */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-xs font-medium shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTimeframe('week')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs',
              timeframe === 'week'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            By Week
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('month')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs',
              timeframe === 'month'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            By Month
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('all')}
            className={cn(
              'px-2.5 py-1 rounded-md transition-all cursor-pointer text-xs',
              timeframe === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            All
          </button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-between">
        {spendingData.length === 0 || totalSpending === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-4">
            <div className="p-3 bg-slate-100 rounded-full text-slate-400 mb-2">
              <PieIcon className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">
              No expenses {timeframe === 'week' ? 'this week' : timeframe === 'month' ? 'this month' : 'recorded yet'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Expenses you add for this period will show here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Donut / Ring Chart */}
            <div className="h-44 sm:h-48 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.categoryId}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Total
                </span>
                <span className="text-sm font-bold text-slate-900">{formatMoney(totalSpending)}</span>
              </div>
            </div>

            {/* Category Breakdown Items */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {chartData.map((item, idx) => (
                <div
                  key={item.categoryId}
                  className="flex items-center justify-between text-xs py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <CategoryIcon name={item.icon} className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-medium text-slate-700 truncate">{item.categoryName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-slate-900">{formatMoney(item.total)}</span>
                    <span className="text-slate-400 w-9 text-right font-medium">
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
