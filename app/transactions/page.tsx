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
import { StatementImportModal } from '@/components/transactions/StatementImportModal';
import { exportTransactionsPDF } from '@/lib/exportPdf';
import { ArrowLeftRight, Plus, Download, UploadCloud, FileDown } from 'lucide-react';
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
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  // Deletion Dialog State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Statement Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Collect all unique tags across transactions
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.tags && Array.isArray(tx.tags)) {
        tx.tags.forEach((t) => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet);
  }, [transactions]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedType !== 'all' ||
    selectedAccountId !== 'all' ||
    selectedCategoryId !== 'all' ||
    selectedTag !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedAccountId('all');
    setSelectedCategoryId('all');
    setSelectedTag('all');
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
          const matchTags = tx.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchDesc && !matchCat && !matchAcc && !matchTags) return false;
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

        // Tag filter
        if (selectedTag !== 'all') {
          if (!tx.tags || !tx.tags.includes(selectedTag)) {
            return false;
          }
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
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedAccountId,
    selectedCategoryId,
    selectedTag,
    sortBy,
    categories,
    accounts,
  ]);

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
    const headers = ['Date', 'Type', 'Amount', 'Account', 'Category', 'Description', 'Tags'];
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
        `"${(tx.tags || []).join(';')}"`,
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

  const exportPDF = () => {
    exportTransactionsPDF({
      transactions: filteredTransactions,
      accounts,
      categories,
      currencySymbol: settings.currencySymbol || 'Rs.',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Transactions"
        description="View, search, filter, and manage your income, expenses, and bank imports"
        icon={ArrowLeftRight}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {settings.googleSheetsUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncBankEmails()}
                isLoading={isSyncing}
                className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 cursor-pointer"
              >
                Sync Bank Emails
              </Button>
            )}

            {transactions.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Download}
                  onClick={exportCSV}
                  title="Export filtered transactions as CSV"
                  className="cursor-pointer"
                >
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={FileDown}
                  onClick={exportPDF}
                  title="Export styled PDF report"
                  className="cursor-pointer text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10"
                >
                  Export PDF
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              icon={UploadCloud}
              onClick={() => setIsImportModalOpen(true)}
              title="Import bank statement CSV"
              className="text-violet-700 dark:text-violet-300 border-violet-300 dark:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/10 cursor-pointer"
            >
              Import Statement
            </Button>

            <Button
              size="sm"
              icon={Plus}
              onClick={openAddTransaction}
              className="bg-violet-600 hover:bg-violet-500 text-white cursor-pointer shadow-xs"
            >
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
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        sortBy={sortBy}
        onSortChange={setSortBy}
        accounts={accounts}
        categories={categories}
        availableTags={availableTags}
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
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Showing {filteredTransactions.length} of {transactions.length} transactions</span>
          </div>

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

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-2.5">
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This will permanently recalculate account balances."
        confirmLabel="Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />

      {/* Statement Import Modal */}
      <StatementImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
