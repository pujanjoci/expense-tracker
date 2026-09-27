'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common/PageHeader';
import { AnalyticsCharts } from '@/components/analytics/AnalyticsCharts';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChartNoAxesCombined } from 'lucide-react';

export default function AnalyticsPage() {
  const { transactions, accounts, categories, isLoading } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Spending Analytics"
        description="Comprehensive analysis of your income, expenses, and savings trends"
        icon={ChartNoAxesCombined}
      />

      {/* Analytics Main View */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-xl" />
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      ) : (
        <AnalyticsCharts
          transactions={transactions}
          accounts={accounts}
          categories={categories}
        />
      )}
    </div>
  );
}
