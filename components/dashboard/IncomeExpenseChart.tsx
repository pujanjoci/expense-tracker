'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { MonthlyTrend } from '@/types';
import { useApp } from '@/context/AppContext';

interface IncomeExpenseChartProps {
  data: MonthlyTrend[];
}

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const { formatMoney } = useApp();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = income - expense;

      return (
        <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-md text-xs space-y-1">
          <p className="font-semibold text-slate-900">{label}</p>
          <div className="flex items-center justify-between gap-3 text-emerald-600">
            <span>Income:</span>
            <span className="font-medium">{formatMoney(income)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-rose-600">
            <span>Expenses:</span>
            <span className="font-medium">{formatMoney(expense)}</span>
          </div>
          <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-3 text-slate-700 font-semibold">
            <span>Net:</span>
            <span className={net >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
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
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle>Income vs Expenses</CardTitle>
        <CardDescription>Monthly cash flow trends over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-3 sm:pb-4">
        <div className="h-52 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
              barGap={3}
              barSize={12}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="monthLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ paddingBottom: 8, fontSize: 11 }}
                formatter={(value) => (
                  <span className="text-slate-600 text-xs capitalize font-medium">{value}</span>
                )}
              />
              <Bar dataKey="income" fill="#10b981" radius={[3, 3, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#f43f5e" radius={[3, 3, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
