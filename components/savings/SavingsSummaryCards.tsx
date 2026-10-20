'use client';

import React from 'react';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { useApp } from '@/context/AppContext';
import { PiggyBank, Target, TrendingUp, Coins } from 'lucide-react';

export function SavingsSummaryCards() {
  const { savingsSummary, formatMoney } = useApp();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Total Saved */}
      <div className="col-span-2 sm:col-span-1">
        <SummaryCard
          title="Total Saved"
          amount={formatMoney(savingsSummary.totalSaved)}
          supportingText={
            savingsSummary.combinedTarget > 0
              ? `${savingsSummary.overallProgressPercentage}% of combined target`
              : 'Across all goals'
          }
          icon={PiggyBank}
          iconBgColor="bg-indigo-50"
          iconColor="text-indigo-700"
        />
      </div>

      {/* 2. Active Goals */}
      <div className="col-span-1">
        <SummaryCard
          title="Active Goals"
          amount={String(savingsSummary.activeGoalsCount)}
          supportingText={`${savingsSummary.completedGoalsCount} completed, ${savingsSummary.archivedGoalsCount} archived`}
          icon={Target}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />
      </div>

      {/* 3. Combined Target */}
      <div className="col-span-1">
        <SummaryCard
          title="Combined Target"
          amount={formatMoney(savingsSummary.combinedTarget)}
          supportingText="Total target for active goals"
          icon={TrendingUp}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-700"
        />
      </div>

      {/* 4. Remaining to Target */}
      <div className="col-span-2 sm:col-span-1">
        <SummaryCard
          title="Remaining to Target"
          amount={formatMoney(savingsSummary.remainingToTarget)}
          supportingText="Needed to reach active targets"
          icon={Coins}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
        />
      </div>
    </div>
  );
}
