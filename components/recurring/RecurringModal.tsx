'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { RecurringTransaction, RecurringFrequency, TransactionType } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

interface RecurringModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: RecurringTransaction | null;
}

export function RecurringModal({
  isOpen,
  onClose,
  editingItem,
}: RecurringModalProps) {
  const {
    accounts,
    categories,
    createRecurringTransaction,
    updateRecurringTransaction,
    deleteRecurringTransaction,
  } = useApp();

  const [title, setTitle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<string>('');
  const [account, setAccount] = useState<string>('');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [active, setActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => a.active);
  const filteredCategories = categories.filter((c) => c.type === type);

  useEffect(() => {
    if (editingItem) {
      setTitle(editingItem.title);
      setAmount(editingItem.amount.toString());
      setType(editingItem.type);
      setCategory(editingItem.category || '');
      setAccount(editingItem.account);
      setFrequency(editingItem.frequency);
      setNextDueDate(editingItem.nextDueDate);
      setActive(editingItem.active);
    } else {
      setTitle('');
      setAmount('');
      setType('expense');
      setCategory(filteredCategories[0]?.id || '');
      setAccount(activeAccounts[0]?.id || '');
      setFrequency('monthly');
      setNextDueDate(format(new Date(), 'yyyy-MM-dd'));
      setActive(true);
    }
    setError(null);
  }, [editingItem, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title or service name.');
      return;
    }
    if (!account) {
      setError('Please select an account.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingItem) {
        await updateRecurringTransaction(editingItem.id, {
          title: title.trim(),
          amount: amt,
          type,
          category,
          account,
          frequency,
          nextDueDate,
          active,
        });
      } else {
        await createRecurringTransaction({
          title: title.trim(),
          amount: amt,
          type,
          category,
          account,
          frequency,
          nextDueDate,
          active,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save recurring item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (confirm(`Delete recurring subscription "${editingItem.title}"?`)) {
      setIsSubmitting(true);
      try {
        await deleteRecurringTransaction(editingItem.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItem ? 'Edit Subscription / Recurring' : 'New Subscription / Recurring'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {/* Title / Name */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Title / Subscription Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Netflix, Spotify, Gym, Rent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        {/* Amount & Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                required
                min="1"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType)}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        </div>

        {/* Frequency & Next Due Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Next Due Date</label>
            <input
              type="date"
              required
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* Account & Category */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Account</label>
            <select
              required
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="">Select Account</option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              <option value="">None</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-surface-2/60 border border-border/40">
          <div>
            <p className="text-xs font-semibold text-foreground">Active Tracking</p>
            <p className="text-[11px] text-muted-foreground">
              Auto-generate transactions on due date
            </p>
          </div>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          {editingItem ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer"
            >
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Subscription'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
