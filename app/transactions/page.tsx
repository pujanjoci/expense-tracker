'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { TableSkeleton } from '@/components/common/LoadingState';
import { ArrowLeftRight, Plus, Download } from 'lucide-react';
import { Transaction } from '@/types';

export default function TransactionsPage() {
  const {
    transactions,
    accounts,
    categories,
    isLoading,
    isSyncing,
    openAddTransaction,
    openEditTransaction,
    deleteTransaction,
    syncBankEmails,
    settings,
  } = useApp();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Deletion Dialog State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedAccountId !== 'all' ||
    selectedCategoryId !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedAccountId('all');
    setSelectedCategoryId('all');
    setSortBy('date-desc');
  };

  // Filter and Sort Logic
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = (tx.description || '').toLowerCase().includes(q);
          const category = categories.find((c) => c.id === tx.categoryId);
          const matchCat = (category?.name || '').toLowerCase().includes(q);
          const account = accounts.find((a) => a.id === tx.accountId);
          const matchAcc = (account?.name || '').toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchAcc) return false;
        }

        // Type filter
        if (selectedType !== 'all' && tx.type !== selectedType) {
          return false;
        }

        // Account filter
        if (selectedAccountId !== 'all') {
          if (tx.accountId !== selectedAccountId && tx.transferToAccountId !== selectedAccountId) {
            return false;
          }
        }

        // Category filter
        if (selectedCategoryId !== 'all' && tx.categoryId !== selectedCategoryId) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount-desc') {
          return Number(b.amount) - Number(a.amount);
        }
        if (sortBy === 'amount-asc') {
          return Number(a.amount) - Number(b.amount);
        }
        return 0;
      });
  }, [transactions, searchQuery, selectedType, selectedAccountId, selectedCategoryId, sortBy, categories, accounts]);

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteTransaction(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const exportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = ['Date', 'Type', 'Amount', 'Account', 'Category', 'Description'];
    const rows = filteredTransactions.map((tx) => {
      const acc = accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId;
      const cat = categories.find((c) => c.id === tx.categoryId)?.name || '';
      return [
        tx.date,
        tx.type,
        tx.amount,
        `"${acc}"`,
        `"${cat}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Transactions"
        description="View, search, filter, and manage your income and expenses"
        icon={ArrowLeftRight}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {settings.googleSheetsUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncBankEmails()}
                isLoading={isSyncing}
                className="bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              >
                Sync Bank Emails
              </Button>
            )}
            {transactions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={Download}
                onClick={exportCSV}
                title="Export filtered transactions as CSV"
              >
                Export CSV
              </Button>
            )}
            <Button size="sm" icon={Plus} onClick={openAddTransaction}>
              Add Transaction
            </Button>
          </div>
        }
      />

      {/* Filters Section */}
      <TransactionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedAccountId={selectedAccountId}
        onAccountChange={setSelectedAccountId}
        selectedCategoryId={selectedCategoryId}
        onCategoryChange={setSelectedCategoryId}
        sortBy={sortBy}
        onSortChange={setSortBy}
        accounts={accounts}
        categories={categories}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Transactions Content */}
      {isLoading ? (
        <TableSkeleton />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title={hasActiveFilters ? 'No matching transactions' : 'No transactions recorded'}
          description={
            hasActiveFilters
              ? 'Try changing or resetting your search filters to find what you are looking for.'
              : 'Add your first transaction to start keeping track of your income and expenses.'
          }
          actionLabel={hasActiveFilters ? 'Reset Filters' : 'Add Transaction'}
          onAction={hasActiveFilters ? handleResetFilters : openAddTransaction}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <TransactionTable
              transactions={filteredTransactions}
              accounts={accounts}
              categories={categories}
              onEdit={openEditTransaction}
              onDelete={(id) => setDeletingId(id)}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden space-y-3">
            {filteredTransactions.map((tx) => (
              <TransactionCard
                key={tx.id}
                transaction={tx}
                accounts={accounts}
                categories={categories}
                onEdit={openEditTransaction}
                onDelete={(id) => setDeletingId(id)}
              />
            ))}
          </div>

          {/* Summary footer */}
          <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-medium">
            <span>
              Showing {filteredTransactions.length} of {transactions.length} transaction
              {transactions.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This action cannot be undone and will update your dynamic account balances."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
}
