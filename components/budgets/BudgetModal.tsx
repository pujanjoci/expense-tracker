'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Budget } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';
import { CategoryIcon } from '@/lib/icons';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBudget: Budget | null;
  selectedMonth: string;
}

export function BudgetModal({
  isOpen,
  onClose,
  editingBudget,
  selectedMonth,
}: BudgetModalProps) {
  const { categories, createBudget, updateBudget, deleteBudget, formatMoney } = useApp();
  const [categoryId, setCategoryId] = useState<string>('');
  const [monthlyLimit, setMonthlyLimit] = useState<string>('');
  const [month, setMonth] = useState<string>(selectedMonth);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (editingBudget) {
      setCategoryId(editingBudget.category);
      setMonthlyLimit(editingBudget.monthlyLimit.toString());
      setMonth(editingBudget.month || selectedMonth);
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setMonthlyLimit('');
      setMonth(selectedMonth || format(new Date(), 'yyyy-MM'));
    }
    setError(null);
  }, [editingBudget, selectedMonth, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const limitNum = parseFloat(monthlyLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      setError('Please enter a valid monthly limit greater than 0.');
      return;
    }
    if (!categoryId) {
      setError('Please select a category.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, {
          category: categoryId,
          monthlyLimit: limitNum,
          month,
        });
      } else {
        await createBudget({
          category: categoryId,
          monthlyLimit: limitNum,
          month,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingBudget) return;
    if (confirm('Are you sure you want to delete this budget limit?')) {
      setIsSubmitting(true);
      try {
        await deleteBudget(editingBudget.id);
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete budget');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {/* Category Select */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Expense Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-border/40 rounded-xl bg-surface-2/40">
            {expenseCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer border ${
                  categoryId === cat.id
                    ? 'bg-violet-500/20 border-violet-500/50 text-foreground font-semibold shadow-xs'
                    : 'bg-surface/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-surface'
                }`}
              >
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Monthly Limit */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Monthly Spending Limit
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
              Rs.
            </span>
            <input
              type="number"
              step="any"
              required
              min="1"
              value={monthlyLimit}
              onChange={(e) => setMonthlyLimit(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full pl-10 pr-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>

        {/* Target Month */}
        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Budget Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm font-medium bg-surface border border-border/60 text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          {editingBudget ? (
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
              {isSubmitting ? 'Saving...' : editingBudget ? 'Save Changes' : 'Create Budget'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
