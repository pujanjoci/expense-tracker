'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { Account, AccountType } from '@/types';
import { Check, Landmark, Banknote, Smartphone, CreditCard } from 'lucide-react';

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: any }[] = [
  { value: 'bank', label: 'Bank Account', icon: Landmark },
  { value: 'cash', label: 'Cash in Hand', icon: Banknote },
  { value: 'wallet', label: 'Digital Wallet (eSewa / Khalti / etc.)', icon: Smartphone },
  { value: 'other', label: 'Other Account', icon: CreditCard },
];

export function AccountModal() {
  const {
    isAccountModalOpen,
    editingAccount,
    closeAccountModal,
    createAccount,
    updateAccount,
    settings,
  } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [currency, setCurrency] = useState(settings.currency || 'NPR');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingAccount) {
      setName(editingAccount.name);
      setType(editingAccount.type);
      setOpeningBalance(String(editingAccount.openingBalance));
      setCurrency(editingAccount.currency || settings.currency || 'NPR');
      setActive(editingAccount.active);
    } else {
      setName('');
      setType('bank');
      setOpeningBalance('0');
      setCurrency(settings.currency || 'NPR');
      setActive(true);
    }
    setErrors({});
  }, [editingAccount, isAccountModalOpen, settings.currency]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Account name is required';
    }
    const numBalance = parseFloat(openingBalance);
    if (isNaN(numBalance)) {
      newErrors.openingBalance = 'Please enter a valid opening balance';
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
        type,
        openingBalance: parseFloat(openingBalance) || 0,
        currency,
        active,
      };

      if (editingAccount) {
        await updateAccount(editingAccount.id, payload);
      } else {
        await createAccount(payload);
      }

      closeAccountModal();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save account' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isAccountModalOpen}
      onClose={closeAccountModal}
      title={editingAccount ? 'Edit Account' : 'Add New Account'}
      description={
        editingAccount
          ? 'Update account configuration and active status'
          : 'Create a new bank, cash, or digital wallet account'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
            {errors.form}
          </div>
        )}

        {/* Account Name */}
        <Input
          label="Account Name"
          placeholder="e.g. NIC Asia Checking, Main Cash, eSewa..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        {/* Account Type */}
        <Select
          label="Account Type"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
        >
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        {/* Opening Balance */}
        <Input
          label={`Opening Balance (${settings.currencySymbol || 'Rs.'})`}
          type="number"
          step="any"
          placeholder="0"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          error={errors.openingBalance}
          helperText="Initial balance when tracking starts with this account"
          required
        />

        {/* Active Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            id="account-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          <label htmlFor="account-active" className="text-xs font-medium text-slate-700 cursor-pointer">
            Account is Active
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeAccountModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} icon={Check}>
            {editingAccount ? 'Save Changes' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
