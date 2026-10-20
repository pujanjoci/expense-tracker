'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useApp } from '@/context/AppContext';
import { SavingsGoalProgress, SavingsTransaction } from '@/types';
import { SavingsGoalIcon } from '@/lib/icons';
import { formatDate, cn } from '@/lib/utils';
import { Plus, ArrowUpRight, Trash2, Calendar, WalletCards, History } from 'lucide-react';

interface SavingsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoalProgress | null;
}

export function SavingsHistoryModal({
  isOpen,
  onClose,
  goal,
}: SavingsHistoryModalProps) {
  const { savingsTransactions, deleteSavingsTransaction, accounts, formatMoney } = useApp();
  const [deletingTx, setDeletingTx] = useState<SavingsTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!goal) return null;

  // Filter transactions for this goal and sort newest first
  const goalTransactions = savingsTransactions
    .filter((tx) => tx.goalId === goal.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return;
    setIsDeleting(true);
    try {
      await deleteSavingsTransaction(deletingTx.id);
      setDeletingTx(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Savings History"
        description={`Transaction ledger for "${goal.name}"`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Header Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-800 shadow-2xs">
                <SavingsGoalIcon name={goal.icon} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">{goal.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span>Target: {formatMoney(goal.targetAmount)}</span>
                  <span>&bull;</span>
                  <span>Current: <strong className="text-slate-800">{formatMoney(goal.currentSaved)}</strong></span>
                </div>
              </div>
            </div>

            <div className="text-right shrink-0 text-xs">
              <div className="text-emerald-700 font-semibold">
                Deposited: +{formatMoney(goal.totalDeposited)}
              </div>
              {goal.totalWithdrawn > 0 && (
                <div className="text-rose-700 font-semibold">
                  Withdrawn: -{formatMoney(goal.totalWithdrawn)}
                </div>
              )}
            </div>
          </div>

          {/* Ledger List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {/* Initial Starting Balance Row (if set) */}
            {goal.initialAmount > 0 && (
              <div className="p-3 bg-slate-50/70 border border-dashed border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 block">Initial Saved Balance</span>
                    <span className="text-[11px] text-slate-400">Created with goal on {formatDate(goal.createdAt)}</span>
                  </div>
                </div>
                <div className="text-right font-bold text-slate-800 text-sm">
                  +{formatMoney(goal.initialAmount)}
                </div>
              </div>
            )}

            {goalTransactions.length === 0 && goal.initialAmount === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-1">
                <History className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No deposits or withdrawals recorded yet.</p>
                <p className="text-[11px] text-slate-400">Use "Add Money" on the goal card to start tracking savings.</p>
              </div>
            ) : (
              goalTransactions.map((tx) => {
                const isDeposit = tx.type === 'deposit';
                const linkedAccount = accounts.find((a) => a.id === tx.accountId);

                return (
                  <div
                    key={tx.id}
                    className="p-3 bg-white border border-slate-200/80 rounded-xl hover:border-slate-300 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border',
                          isDeposit
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            : 'bg-rose-50 text-rose-700 border-rose-200/60'
                        )}
                      >
                        {isDeposit ? <Plus className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900">
                            {isDeposit ? 'Deposit' : 'Withdrawal'}
                          </span>
                          {linkedAccount && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                              <WalletCards className="w-2.5 h-2.5" />
                              {linkedAccount.name}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(tx.date)}
                          </span>
                          {tx.notes && (
                            <>
                              <span>&bull;</span>
                              <span className="text-slate-600 truncate max-w-[200px]" title={tx.notes}>
                                {tx.notes}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={cn(
                          'text-sm font-bold tracking-tight',
                          isDeposit ? 'text-emerald-700' : 'text-rose-700'
                        )}
                      >
                        {isDeposit ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>

                      <button
                        type="button"
                        onClick={() => setDeletingTx(tx)}
                        title="Delete transaction"
                        aria-label="Delete transaction"
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Dialog for Transaction Deletion */}
      <ConfirmDialog
        isOpen={Boolean(deletingTx)}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        title="Delete Savings Transaction"
        description={`Are you sure you want to delete this ${
          deletingTx?.type === 'deposit' ? 'deposit' : 'withdrawal'
        } of ${deletingTx ? formatMoney(deletingTx.amount) : ''}? Your savings goal total will be recalculated automatically.`}
        confirmLabel="Delete"
      />
    </>
  );
}
