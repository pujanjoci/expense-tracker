'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { SavingsGoal, GoalStatus } from '@/types';
import { AVAILABLE_SAVINGS_ICONS, SavingsGoalIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Target, Check } from 'lucide-react';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit: SavingsGoal | null;
}

export function SavingsGoalModal({
  isOpen,
  onClose,
  goalToEdit,
}: SavingsGoalModalProps) {
  const { createSavingsGoal, updateSavingsGoal, settings } = useApp();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('PiggyBank');
  const [status, setStatus] = useState<GoalStatus>('active');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goalToEdit) {
      setName(goalToEdit.name || '');
      setTargetAmount(String(goalToEdit.targetAmount || ''));
      setInitialAmount(String(goalToEdit.initialAmount || '0'));
      setTargetDate(goalToEdit.targetDate || '');
      setDescription(goalToEdit.description || '');
      setIcon(goalToEdit.icon || 'PiggyBank');
      setStatus(goalToEdit.status || 'active');
    } else {
      setName('');
      setTargetAmount('');
      setInitialAmount('0');
      setTargetDate('');
      setDescription('');
      setIcon('PiggyBank');
      setStatus('active');
    }
    setErrors({});
  }, [goalToEdit, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    const numTarget = parseFloat(targetAmount);
    if (!targetAmount || isNaN(numTarget) || numTarget <= 0) {
      newErrors.targetAmount = 'Target amount must be greater than zero';
    }

    const numInitial = parseFloat(initialAmount);
    if (isNaN(numInitial) || numInitial < 0) {
      newErrors.initialAmount = 'Initial saved amount cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        initialAmount: parseFloat(initialAmount) || 0,
        targetDate: targetDate ? targetDate.trim() : undefined,
        description: description.trim() ? description.trim() : undefined,
        icon,
        status,
      };

      if (goalToEdit) {
        await updateSavingsGoal(goalToEdit.id, payload);
      } else {
        await createSavingsGoal(payload);
      }

      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save savings goal' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      description={
        goalToEdit
          ? 'Update the target amount, date, or details of this savings goal.'
          : 'Define a new financial target, milestones, and initial savings.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errors.form}
          </div>
        )}

        {/* Goal Name */}
        <Input
          label="Goal Name *"
          placeholder="e.g. Emergency Fund, New Laptop, Europe Trip"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />

        {/* Target Amount & Initial Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Target Amount (${settings.currencySymbol || 'Rs.'}) *`}
            type="number"
            step="any"
            min="1"
            placeholder="50000"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            error={errors.targetAmount}
            helperText="Must be greater than 0"
          />

          <Input
            label={`Initial Saved Amount (${settings.currencySymbol || 'Rs.'})`}
            type="number"
            step="any"
            min="0"
            placeholder="0"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            error={errors.initialAmount}
            helperText="Starting money already in reserve"
          />
        </div>

        {/* Target Date & Status (if editing) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Date (Optional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            helperText="Target completion milestone"
          />

          {goalToEdit ? (
            <Select
              label="Goal Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          ) : (
            <div className="flex flex-col justify-end text-xs text-slate-500 pb-2">
              <span className="font-medium text-slate-700">Goal Status</span>
              <span className="mt-1">Starts automatically as active</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Description / Motivation (Optional)
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 dark:focus-visible:ring-violet-500 focus-visible:border-transparent resize-none"
            placeholder="Why are you saving for this goal? Any notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Icon Picker */}
        <div className="space-y-1.5 pt-1">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Choose an Icon
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700 rounded-xl max-h-36 overflow-y-auto">
            {AVAILABLE_SAVINGS_ICONS.map((item) => {
              const isSelected = icon === item.name;
              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => setIcon(item.name)}
                  title={item.label}
                  className={cn(
                    'flex flex-col items-center justify-center p-2 rounded-lg border text-xs transition-all cursor-pointer aspect-square',
                    isSelected
                      ? 'bg-slate-900 dark:bg-violet-600 text-white border-slate-900 dark:border-violet-600 shadow-xs ring-2 ring-slate-900/20 dark:ring-violet-500/30'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  <SavingsGoalIcon name={item.name} className="w-4 h-4 shrink-0" />
                  <span className="text-[9px] mt-1 truncate max-w-full text-center leading-none">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} icon={Check}>
            {goalToEdit ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
