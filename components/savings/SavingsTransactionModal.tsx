'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { SavingsGoalProgress, SavingsTransactionType } from '@/types';
import { SavingsGoalIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Plus, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

interface SavingsTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoalProgress | null;
  defaultType?: SavingsTransactionType;
}

export function SavingsTransactionModal({
  isOpen,
  onClose,
  goal,
  defaultType = 'deposit',
}: SavingsTransactionModalProps) {
  const { createSavingsTransaction, accounts, formatMoney, settings } = useApp();

  const [type, setType] = useState<SavingsTransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [accountId, setAccountId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setType(defaultType);
    setAmount('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setAccountId('');
    setNotes('');
    setErrors({});
  }, [defaultType, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (type === 'withdraw' && goal && numAmount > goal.currentSaved) {
      newErrors.amount = `Withdrawal cannot exceed currently saved amount (${formatMoney(goal.currentSaved)})`;
    }

    if (!date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal || !validate()) return;

    setIsSubmitting(true);
    try {
      await createSavingsTransaction({
        goalId: goal.id,
        type,
        amount: parseFloat(amount),
        date: date.trim(),
        accountId: accountId ? accountId : undefined,
        notes: notes.trim() ? notes.trim() : undefined,
      });

      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to record savings transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'deposit' ? 'Add Money to Goal' : 'Withdraw Money from Goal'}
      description={`Record a ${type === 'deposit' ? 'deposit' : 'withdrawal'} for "${goal.name}".`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Goal Info Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-800 shadow-2xs">
              <SavingsGoalIcon name={goal.icon} className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{goal.name}</h4>
              <p className="text-[11px] text-slate-500">
                Target: {formatMoney(goal.targetAmount)}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">
              Currently Saved
            </span>
            <span className="text-sm font-extrabold text-slate-900">
              {formatMoney(goal.currentSaved)}
            </span>
          </div>
        </div>

        {/* Transaction Type Segmented Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setType('deposit');
              setErrors({});
            }}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer',
              type === 'deposit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Add Money (Deposit)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setType('withdraw');
              setErrors({});
            }}
            disabled={goal.currentSaved <= 0}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
              type === 'withdraw'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            <span>Withdraw Money</span>
          </button>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label={`Amount (${settings.currencySymbol || 'Rs.'}) *`}
            type="number"
            step="any"
            min="1"
            placeholder="e.g. 5000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            autoFocus
          />

          {/* Quick Amount Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400 font-medium mr-1">Quick:</span>
            {quickAmounts.map((q) => (
              <button
                type="button"
                key={q}
                onClick={() => setAmount(String(q))}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200/60 transition-colors cursor-pointer"
              >
                +{formatMoney(q)}
              </button>
            ))}
          </div>
        </div>

        {/* Date and Optional Linked Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Transaction Date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={errors.date}
          />

          <Select
            label="From / To Account (Optional)"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">No linked account (Direct tracking)</option>
            {accounts
              .filter((a) => a.active)
              .map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
          </Select>
        </div>

        {/* Notes */}
        <Input
          label="Notes / Description (Optional)"
          placeholder="e.g. Monthly salary savings, festival bonus, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            icon={type === 'deposit' ? Plus : ArrowUpRight}
          >
            {type === 'deposit' ? 'Confirm Deposit' : 'Confirm Withdrawal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
