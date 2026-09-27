'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { AccountCard } from '@/components/accounts/AccountCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AccountBalanceSummary } from '@/types';
import {
  WalletCards,
  Plus,
  Landmark,
  Banknote,
  Smartphone,
  CreditCard,
  Layers,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function AccountsPage() {
  const {
    accountSummaries,
    totalBalance,
    isLoading,
    openAddAccount,
    openEditAccount,
    updateAccount,
    deleteAccount,
    formatMoney,
  } = useApp();

  const [deletingAccount, setDeletingAccount] = useState<AccountBalanceSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group accounts by category
  const bankAccounts = useMemo(
    () => accountSummaries.filter((a) => a.type === 'bank'),
    [accountSummaries]
  );
  const cashAccounts = useMemo(
    () => accountSummaries.filter((a) => a.type === 'cash'),
    [accountSummaries]
  );
  const walletAccounts = useMemo(
    () => accountSummaries.filter((a) => a.type === 'wallet'),
    [accountSummaries]
  );
  const otherAccounts = useMemo(
    () => accountSummaries.filter((a) => a.type === 'other'),
    [accountSummaries]
  );

  const handleToggleActive = async (acc: AccountBalanceSummary) => {
    await updateAccount(acc.id, { active: !acc.active });
  };

  const handleDeleteClick = (acc: AccountBalanceSummary) => {
    setDeletingAccount(acc);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    setIsDeleting(true);
    try {
      if (deletingAccount.transactionCount > 0) {
        // Soft deactivate if transactions exist to preserve data integrity
        await updateAccount(deletingAccount.id, { active: false });
      } else {
        await deleteAccount(deletingAccount.id);
      }
      setDeletingAccount(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <PageHeader
        title="Accounts & Wallets"
        description="Manage your bank accounts, physical cash, and digital payment wallets"
        icon={WalletCards}
        actions={
          <Button size="sm" icon={Plus} onClick={openAddAccount}>
            Add Account
          </Button>
        }
      />

      {/* Net Worth Banner */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Net Balance
              </span>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
                {formatMoney(totalBalance)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Calculated dynamically from opening balances and transaction flows
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="bg-slate-800/80 px-3.5 py-2.5 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  Active Accounts
                </span>
                <span className="text-base font-bold text-white">
                  {accountSummaries.filter((a) => a.active).length} of {accountSummaries.length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : accountSummaries.length === 0 ? (
        <EmptyState
          icon={WalletCards}
          title="No accounts created yet"
          description="Create your first bank account, cash stash, or digital wallet to start managing your funds."
          actionLabel="Add Account"
          onAction={openAddAccount}
        />
      ) : (
        <div className="space-y-8">
          {/* Bank Accounts */}
          {bankAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Landmark className="w-4 h-4 text-blue-600" />
                <span>Bank Accounts ({bankAccounts.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bankAccounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onEdit={openEditAccount}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Digital Wallets */}
          {walletAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>Digital Wallets ({walletAccounts.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {walletAccounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onEdit={openEditAccount}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cash */}
          {cashAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash in Hand ({cashAccounts.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cashAccounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onEdit={openEditAccount}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Accounts */}
          {otherAccounts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <span>Other Accounts ({otherAccounts.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherAccounts.map((acc) => (
                  <AccountCard
                    key={acc.id}
                    account={acc}
                    onEdit={openEditAccount}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete / Deactivate Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingAccount}
        onClose={() => setDeletingAccount(null)}
        onConfirm={handleDeleteConfirm}
        title={
          deletingAccount && deletingAccount.transactionCount > 0
            ? 'Deactivate Account'
            : 'Delete Account'
        }
        description={
          deletingAccount && deletingAccount.transactionCount > 0
            ? `This account has ${deletingAccount.transactionCount} associated transaction(s). To preserve historical balances and transaction records, it will be marked as inactive rather than permanently deleted.`
            : `Are you sure you want to permanently delete "${deletingAccount?.name}"?`
        }
        confirmLabel={
          deletingAccount && deletingAccount.transactionCount > 0
            ? 'Deactivate Account'
            : 'Delete Account'
        }
        isLoading={isDeleting}
      />
    </div>
  );
}
