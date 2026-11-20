'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { RecurringModal } from '@/components/recurring/RecurringModal';
import { RecurringTransaction } from '@/types';
import { CategoryIcon } from '@/lib/icons';
import { AccountBadge } from '@/components/accounts/AccountBadge';
import { format, differenceInDays } from 'date-fns';
import {
  Repeat,
  Plus,
  Play,
  Pause,
} from 'lucide-react';
import { cn, parseDateSafe, parseAmountSafe } from '@/lib/utils';

export default function RecurringPage() {
  const {
    recurringTransactions,
    accounts,
    categories,
    updateRecurringTransaction,
    formatMoney,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  const accountMap = useMemo(() => {
    const map = new Map<string, any>();
    accounts.forEach((a) => map.set(a.id, a));
    return map;
  }, [accounts]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, any>();
    categories.forEach((c) => map.set(c.id, c));
    return map;
  }, [categories]);

  // Normalized monthly and annual spending calculations
  const { monthlyTotal, yearlyTotal, activeCount, upcomingNearest } = useMemo<{
    monthlyTotal: number;
    yearlyTotal: number;
    activeCount: number;
    upcomingNearest: { title: string; daysLeft: number; date: string } | null;
  }>(() => {
    let monthly = 0;
    let yearly = 0;
    let active = 0;
    let nearest: { title: string; daysLeft: number; date: string } | null = null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    recurringTransactions.forEach((rec) => {
      if (!rec.active) return;
      active++;
      const amt = parseAmountSafe(rec.amount);

      let normalizedMonthly = 0;
      if (rec.frequency === 'daily') normalizedMonthly = amt * 30;
      else if (rec.frequency === 'weekly') normalizedMonthly = amt * 4.33;
      else if (rec.frequency === 'monthly') normalizedMonthly = amt;
      else if (rec.frequency === 'yearly') normalizedMonthly = amt / 12;

      monthly += normalizedMonthly;
      yearly += normalizedMonthly * 12;

      // Find nearest upcoming due date
      try {
        const dueDate = parseDateSafe(rec.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);
        const days = differenceInDays(dueDate, today);
        if (days >= 0 && (!nearest || days < nearest.daysLeft)) {
          nearest = { title: rec.title, daysLeft: days, date: rec.nextDueDate };
        }
      } catch {}
    });

    return {
      monthlyTotal: Math.round(monthly),
      yearlyTotal: Math.round(yearly),
      activeCount: active,
      upcomingNearest: nearest,
    };
  }, [recurringTransactions]);

  const handleToggleActive = async (e: React.MouseEvent, rec: RecurringTransaction) => {
    e.stopPropagation();
    await updateRecurringTransaction(rec.id, { active: !rec.active });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: RecurringTransaction) => {
    setEditingItem(rec);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Subscriptions & Recurring
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep track of all fixed commitments, renewal dates, and recurring bills in one place
          </p>
        </div>

        <Button
          onClick={handleOpenAdd}
          icon={Plus}
          size="md"
          className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer self-start sm:self-auto"
        >
          Add Subscription
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Cost</span>
          <p className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1 tabular-nums privacy-sensitive">
            {formatMoney(monthlyTotal)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Across {activeCount} active subscriptions
          </span>
        </div>

        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Annual Projected</span>
          <p className="text-xl sm:text-2xl font-bold font-display text-violet-600 dark:text-violet-400 mt-1 tabular-nums privacy-sensitive">
            {formatMoney(yearlyTotal)}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total 12-month commitment
          </span>
        </div>

        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Subscriptions</span>
          <p className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
            {activeCount}
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {recurringTransactions.length - activeCount} paused
          </span>
        </div>

        <div className="aurora-card p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Next Renewal</span>
          <div className="mt-1">
            {upcomingNearest ? (
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {upcomingNearest.title}
                </p>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                  {upcomingNearest.daysLeft === 0
                    ? 'Due today!'
                    : upcomingNearest.daysLeft === 1
                    ? 'Tomorrow'
                    : `In ${upcomingNearest.daysLeft} days`}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">No upcoming charges</p>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Auto-recorded on due date
          </span>
        </div>
      </div>

      {/* Subscriptions List */}
      {recurringTransactions.length === 0 ? (
        <div className="aurora-card rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto mb-3">
            <Repeat className="w-6 h-6" />
          </div>
          <h3 className="text-base font-display font-semibold text-slate-900 dark:text-slate-100">
            No subscriptions tracked yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Add your recurring Netflix, Spotify, gym memberships, house rent, or internet bills to auto-generate transactions.
          </p>
          <div className="mt-5">
            <Button
              onClick={handleOpenAdd}
              icon={Plus}
              className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
            >
              Add First Subscription
            </Button>
          </div>
        </div>
      ) : (
        <div className="aurora-card rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {recurringTransactions.map((rec) => {
            const acc = accountMap.get(rec.account);
            const cat = rec.category ? categoryMap.get(rec.category) : null;

            return (
              <div
                key={rec.id}
                onClick={() => handleOpenEdit(rec)}
                className={cn(
                  'p-4 flex items-center justify-between hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group',
                  !rec.active && 'opacity-60'
                )}
              >
                {/* Left: Info & Badges */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-xs',
                      rec.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-violet-50 dark:bg-violet-500/15 border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400'
                    )}
                  >
                    <CategoryIcon name={cat?.icon || 'Repeat'} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors truncate">
                        {rec.title}
                      </h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 capitalize">
                        {rec.frequency}
                      </span>
                      {!rec.active && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          Paused
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                      <AccountBadge account={acc} name={acc?.name || 'Account'} />
                      {cat && <span>• {cat.name}</span>}
                      <span>• Next: {rec.nextDueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Pause/Play */}
                <div className="flex items-center gap-3 shrink-0 pl-3">
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold font-display text-slate-900 dark:text-slate-100 tabular-nums privacy-sensitive">
                      {formatMoney(rec.amount)}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      per {rec.frequency.replace('ly', '')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleActive(e, rec)}
                    className={cn(
                      'p-2 rounded-xl border transition-colors cursor-pointer',
                      rec.active
                        ? 'border-slate-200 dark:border-slate-700 hover:border-amber-500/40 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 bg-slate-50 dark:bg-slate-800/40'
                        : 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                    )}
                    title={rec.active ? 'Pause subscription' : 'Activate subscription'}
                  >
                    {rec.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <RecurringModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingItem={editingItem}
      />
    </div>
  );
}
