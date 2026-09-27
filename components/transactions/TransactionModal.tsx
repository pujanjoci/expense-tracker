'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { TransactionType } from '@/types';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CategoryIcon } from '@/lib/icons';

export function TransactionModal() {
  const {
    isTransactionModalOpen,
    editingTransaction,
    closeTransactionModal,
    accounts,
    categories,
    createTransaction,
    updateTransaction,
    settings,
  } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transferToAccountId, setTransferToAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active accounts & categories
  const activeAccounts = accounts.filter((a) => a.active);
  const activeCategories = categories.filter((c) => c.active && c.type === (type === 'transfer' ? 'expense' : type));

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDate(editingTransaction.date);
      setAccountId(editingTransaction.accountId);
      setCategoryId(editingTransaction.categoryId || '');
      setTransferToAccountId(editingTransaction.transferToAccountId || '');
      setDescription(editingTransaction.description || '');
    } else {
      setType('expense');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setAccountId(activeAccounts[0]?.id || '');
      setCategoryId(activeCategories[0]?.id || '');
      setTransferToAccountId(activeAccounts[1]?.id || '');
      setDescription('');
    }
    setErrors({});
  }, [editingTransaction, isTransactionModalOpen]);

  // When type changes, adjust default category if needed
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType !== 'transfer') {
      const matchCat = categories.find((c) => c.active && c.type === newType);
      setCategoryId(matchCat ? matchCat.id : '');
    }
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    }

    if (!date) {
      newErrors.date = 'Please select a date';
    }

    if (!accountId) {
      newErrors.account = 'Please select an account';
    }

    if (type !== 'transfer' && !categoryId) {
      newErrors.category = 'Please select a category';
    }

    if (type === 'transfer') {
      if (!transferToAccountId) {
        newErrors.transferToAccount = 'Please select destination account';
      } else if (transferToAccountId === accountId) {
        newErrors.transferToAccount = 'Source and destination accounts cannot be the same';
      }
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
        date,
        type,
        amount: parseFloat(amount),
        accountId,
        categoryId: type === 'transfer' ? undefined : categoryId,
        transferToAccountId: type === 'transfer' ? transferToAccountId : undefined,
        description: description.trim() || (type === 'transfer' ? 'Transfer' : 'Transaction'),
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
      } else {
        await createTransaction(payload);
      }

      closeTransactionModal();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save transaction' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isTransactionModalOpen}
      onClose={closeTransactionModal}
      title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      description={
        editingTransaction
          ? 'Modify details of this existing record'
          : 'Record a new income, expense, or transfer'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
            {errors.form}
          </div>
        )}

        {/* Type Selector Tabs */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">Transaction Type</label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                type === 'expense'
                  ? 'bg-white text-rose-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                type === 'income'
                  ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transfer')}
              className={cn(
                'flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                type === 'transfer'
                  ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600" />
              <span>Transfer</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <Input
          label={`Amount (${settings.currencySymbol || 'Rs.'})`}
          type="number"
          step="any"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={errors.amount}
          required
        />

        {/* Date Input */}
        <Input
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          error={errors.date}
          required
        />

        {/* Accounts & Category */}
        {type !== 'transfer' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Account */}
            <Select
              label="Account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              error={errors.account}
            >
              <option value="" disabled>
                Select Account
              </option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </Select>

            {/* Category */}
            <Select
              label="Category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              error={errors.category}
            >
              <option value="" disabled>
                Select Category
              </option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* From Account */}
            <Select
              label="From Account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              error={errors.account}
            >
              <option value="" disabled>
                Source Account
              </option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </Select>

            {/* To Account */}
            <Select
              label="To Account"
              value={transferToAccountId}
              onChange={(e) => setTransferToAccountId(e.target.value)}
              error={errors.transferToAccount}
            >
              <option value="" disabled>
                Destination Account
              </option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Description / Notes */}
        <Input
          label="Description / Notes"
          placeholder="e.g. Grocery shopping, Freelance invoice #102..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeTransactionModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            isLoading={isSubmitting}
            icon={Check}
          >
            {editingTransaction ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
