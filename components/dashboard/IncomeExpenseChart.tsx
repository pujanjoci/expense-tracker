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
  ComposedChart,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { MonthlyTrend } from '@/types';
import { useApp } from '@/context/AppContext';
import { calculateForecast } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface IncomeExpenseChartProps {
  data: MonthlyTrend[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const { formatMoney, transactions } = useApp();
  const [showForecast, setShowForecast] = useState<boolean>(true);

  const forecast = useMemo(() => {
    return calculateForecast(transactions);
  }, [transactions]);

  // Augment current month in trend data with projected forecast if enabled
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((item, idx) => {
      const isCurrentMonth = idx === data.length - 1;
      return {
        ...item,
        projectedExpense: isCurrentMonth && showForecast ? forecast.projectedMonthEnd : undefined,
      };
    });
  }, [data, showForecast, forecast]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const projected = payload.find((p: any) => p.dataKey === 'projectedExpense')?.value;
      const net = income - expense;

      return (
        <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xl text-xs space-y-2 min-w-[170px] z-50">
          <p className="font-semibold text-slate-900 dark:text-slate-100 font-display tracking-wide border-b border-slate-100 dark:border-slate-800 pb-1">
            {label}
          </p>
          <div className="flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Income:</span>
            <span className="tabular-nums privacy-sensitive">{formatMoney(income)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400 font-medium">
            <span>Expenses:</span>
            <span className="tabular-nums privacy-sensitive">{formatMoney(expense)}</span>
          </div>
          {projected !== undefined && (
            <div className="flex items-center justify-between gap-3 text-violet-600 dark:text-violet-400 font-medium border-t border-slate-100 dark:border-slate-800/80 pt-1">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Projected:
              </span>
              <span className="tabular-nums privacy-sensitive">{formatMoney(projected)}</span>
            </div>
          )}
          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-slate-900 dark:text-slate-100 font-bold">
            <span>Net:</span>
            <span
              className={`tabular-nums privacy-sensitive ${
                net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatMoney(net)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 sm:pb-4">
        <div>
          <CardTitle>Cash Flow & Trends</CardTitle>
          <CardDescription>
            Monthly income vs expenses over the last 6 months
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowForecast((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showForecast
                ? 'bg-violet-50 dark:bg-violet-500/20 border-violet-300 dark:border-violet-500/40 text-violet-700 dark:text-violet-300 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Toggle month-end spending forecast"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Forecast: {formatMoney(forecast.projectedMonthEnd)}</span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3 sm:pb-4">
        <div className="h-56 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 12, right: 12, left: -18, bottom: 0 }}
              barGap={5}
              barSize={16}
            >
              <defs>
                <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                </linearGradient>
                <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#cbd5e1"
                className="opacity-30 dark:opacity-20"
              />
              <XAxis
                dataKey="monthLabel"
                axisLine={false}
                tickLine={false}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold capitalize ml-1">
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="income"
                fill="url(#incomeBarGrad)"
                radius={[4, 4, 0, 0]}
                name="Income"
              />
              <Bar
                dataKey="expense"
                fill="url(#expenseBarGrad)"
                radius={[4, 4, 0, 0]}
                name="Expenses"
              />
              {showForecast && (
                <Bar
                  dataKey="projectedExpense"
                  fill="#8b5cf6"
                  opacity={0.45}
                  radius={[4, 4, 0, 0]}
                  name="Projected"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
