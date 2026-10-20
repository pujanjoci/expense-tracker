'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SavingsGoalProgress } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useApp } from '@/context/AppContext';
import { SavingsGoalIcon } from '@/lib/icons';
import { getGoalDateStatus, cn } from '@/lib/utils';
import {
  Plus,
  ArrowUpRight,
  Pencil,
  MoreVertical,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
} from 'lucide-react';

interface SavingsGoalCardProps {
  goal: SavingsGoalProgress;
  onAddMoney: (goal: SavingsGoalProgress) => void;
  onWithdraw: (goal: SavingsGoalProgress) => void;
  onEdit: (goal: SavingsGoalProgress) => void;
  onViewHistory: (goal: SavingsGoalProgress) => void;
  onArchive: (goal: SavingsGoalProgress) => void;
  onUnarchive: (goal: SavingsGoalProgress) => void;
  onDelete: (goal: SavingsGoalProgress) => void;
}

export function SavingsGoalCard({
  goal,
  onAddMoney,
  onWithdraw,
  onEdit,
  onViewHistory,
  onArchive,
  onUnarchive,
  onDelete,
}: SavingsGoalCardProps) {
  const { formatMoney } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const dateStatus = getGoalDateStatus(goal.targetDate);
  const isCompleted = goal.computedStatus === 'completed';
  const isArchived = goal.computedStatus === 'archived';

  return (
    <Card
      className={cn(
        'relative transition-all duration-200 hover:shadow-md hover:border-slate-300 flex flex-col justify-between',
        isArchived && 'opacity-70 bg-slate-50/80 border-dashed border-slate-300',
        isCompleted && !isArchived && 'border-emerald-200/90 bg-emerald-50/20'
      )}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
        {/* Top Header: Icon, Name, Status Badge, More Actions */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs transition-colors',
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : isArchived
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                )}
              >
                <SavingsGoalIcon name={goal.icon} className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3
                    className="font-bold text-slate-900 truncate text-base tracking-tight"
                    title={goal.name}
                  >
                    {goal.name}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 mt-0.5">
                  {isArchived ? (
                    <Badge variant="secondary" icon={Archive} className="text-[10px] py-0">
                      Archived
                    </Badge>
                  ) : isCompleted ? (
                    <Badge variant="success" icon={CheckCircle2} className="text-[10px] py-0">
                      Target Reached
                    </Badge>
                  ) : (
                    <Badge variant="info" className="text-[10px] py-0">
                      Active
                    </Badge>
                  )}
                  {goal.transactionCount > 0 && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      &bull; {goal.transactionCount} transaction{goal.transactionCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* More Actions Dropdown */}
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Goal options"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-8 z-30 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onViewHistory(goal);
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>View History</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(goal);
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Goal</span>
                  </button>

                  {isArchived ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onUnarchive(goal);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <ArchiveRestore className="w-3.5 h-3.5 text-slate-400" />
                      <span>Unarchive Goal</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onArchive(goal);
                      }}
                      className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      <span>Archive Goal</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(goal);
                    }}
                    className="w-full text-left px-3.5 py-2 flex items-center gap-2 text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Goal</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Description (if provided) */}
          {goal.description && (
            <p className="text-xs text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
              {goal.description}
            </p>
          )}

          {/* Optional Target Date badge */}
          {dateStatus && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border',
                  isCompleted
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : dateStatus.isOverdue
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                )}
              >
                {dateStatus.isOverdue ? (
                  <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                ) : (
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                )}
                <span>Target: {dateStatus.formattedDate}</span>
                <span className="text-[10px] text-slate-400">&bull;</span>
                <span className="font-semibold">{dateStatus.label}</span>
              </span>
            </div>
          )}
        </div>

        {/* Middle: Amount & Progress Details */}
        <div className="space-y-2 pt-1">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Saved
              </span>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                {formatMoney(goal.currentSaved)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Target
              </span>
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {formatMoney(goal.targetAmount)}
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                {isCompleted ? (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Target accomplished
                  </span>
                ) : (
                  <span>
                    Remaining: <strong className="text-slate-700 dark:text-slate-200">{formatMoney(goal.remainingAmount)}</strong>
                  </span>
                )}
              </span>
              <span
                className={cn(
                  'font-bold text-xs',
                  isCompleted ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'
                )}
              >
                {goal.progressPercentage}%
              </span>
            </div>

            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  isCompleted
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : goal.progressPercentage >= 75
                    ? 'bg-gradient-to-r from-indigo-500 to-emerald-500'
                    : goal.progressPercentage >= 25
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    : 'bg-gradient-to-r from-slate-600 to-blue-500'
                )}
                style={{ width: `${Math.min(100, goal.progressPercentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions: Add Money, Withdraw, Edit */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => onAddMoney(goal)}
            className="flex-1 text-xs"
          >
            Add Money
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={ArrowUpRight}
            onClick={() => onWithdraw(goal)}
            disabled={goal.currentSaved <= 0}
            className="text-xs"
            title={goal.currentSaved <= 0 ? 'No funds available to withdraw' : 'Withdraw money'}
          >
            Withdraw
          </Button>

          <Button
            size="sm"
            variant="ghost"
            icon={Pencil}
            onClick={() => onEdit(goal)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
            title="Edit goal details"
            aria-label="Edit goal details"
          />
        </div>
      </CardContent>
    </Card>
  );
}
