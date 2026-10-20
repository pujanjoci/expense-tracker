'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { TransactionType } from '@/types';
import { format } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Check,
  FileSpreadsheet,
  FileText,
  UploadCloud,
  CheckCircle2,
  Edit3,
  X,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  parseCsvStatement,
  parseRawTextStatement,
  ParsedStatementTransaction,
} from '@/lib/statement-parser';

export function TransactionModal() {
  const {
    isTransactionModalOpen,
    editingTransaction,
    closeTransactionModal,
    accounts,
    categories,
    createTransaction,
    createTransactionsBulk,
    updateTransaction,
    settings,
  } = useApp();

  // Tab mode: manual entry or import CSV/PDF
  const [modalTab, setModalTab] = useState<'manual' | 'import'>('manual');

  // Manual form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [accountId, setAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transferToAccountId, setTransferToAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Statement Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importAccountId, setImportAccountId] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedStatementTransaction[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFileName, setImportFileName] = useState<string>('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Active accounts & categories
  const activeAccounts = accounts.filter((a) => a.active);
  const activeCategories = categories.filter((c) => c.active && c.type === (type === 'transfer' ? 'expense' : type));

  useEffect(() => {
    if (editingTransaction) {
      setModalTab('manual');
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setDate(editingTransaction.date);
      setAccountId(editingTransaction.accountId);
      setCategoryId(editingTransaction.categoryId || '');
      setTransferToAccountId(editingTransaction.transferToAccountId || '');
      setDescription(editingTransaction.description || '');
      setTags(editingTransaction.tags ? editingTransaction.tags.join(', ') : '');
    } else {
      setType('expense');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setAccountId(activeAccounts[0]?.id || '');
      setCategoryId(activeCategories[0]?.id || '');
      setTransferToAccountId(activeAccounts[1]?.id || '');
      setDescription('');
      setTags('');
      setImportAccountId(activeAccounts[0]?.id || '');
      setParsedItems([]);
      setImportFileName('');
      setParseError(null);
      setImportSuccessMessage(null);
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

  const validateManual = (): boolean => {
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateManual()) return;

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
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim().toLowerCase())
              .filter(Boolean)
          : [],
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

  // Statement File Upload & Parse
  const handleStatementFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setParseError(null);
    setImportFileName(file.name);
    setParsedItems([]);

    try {
      const fileNameLower = file.name.toLowerCase();

      // Read text content (supports CSV, TXT, and text streams)
      const text = await file.text();

      let items: ParsedStatementTransaction[] = [];
      if (fileNameLower.endsWith('.csv')) {
        items = parseCsvStatement(text);
      } else {
        // PDF or plain text statements
        items = parseRawTextStatement(text);
      }

      if (items.length === 0) {
        setParseError('No transaction rows were recognized in this file. Please verify the statement contains dates, amounts, and debit/credit columns.');
      } else {
        setParsedItems(items);
      }
    } catch (err: any) {
      setParseError(`Could not read statement: ${err.message || 'Invalid file format'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleItem = (id: string) => {
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleToggleAll = (selectAll: boolean) => {
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: selectAll })));
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;
  const selectedTotal = parsedItems
    .filter((i) => i.selected)
    .reduce((sum, item) => sum + item.amount, 0);

  const handleExecuteImport = async () => {
    const chosenItems = parsedItems.filter((i) => i.selected);
    if (chosenItems.length === 0) return;

    setIsImporting(true);
    try {
      const targetAcc = importAccountId || activeAccounts[0]?.id || 'acc-1';
      const defaultExpenseCat = categories.find((c) => c.active && c.type === 'expense')?.id;
      const defaultIncomeCat = categories.find((c) => c.active && c.type === 'income')?.id;

      const payload = chosenItems.map((item) => ({
        date: item.date,
        type: item.type,
        amount: item.amount,
        accountId: targetAcc,
        categoryId: item.type === 'income' ? defaultIncomeCat : defaultExpenseCat,
        description: item.description,
      }));

      await createTransactionsBulk(payload);
      setImportSuccessMessage(`Successfully imported ${chosenItems.length} transactions!`);
      setTimeout(() => {
        closeTransactionModal();
      }, 1200);
    } catch (err: any) {
      setParseError(`Import failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isTransactionModalOpen}
      onClose={closeTransactionModal}
      title={editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
      description={
        editingTransaction
          ? 'Modify details of this existing record'
          : 'Add manually or import directly from your bank e-statement'
      }
    >
      {/* Top Tabs: Manual vs Import (Only when creating new transaction) */}
      {!editingTransaction && (
        <div className="flex border-b border-slate-200/80 dark:border-slate-800 mb-4 pb-2 gap-2">
          <button
            type="button"
            onClick={() => setModalTab('manual')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              modalTab === 'manual'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manual Entry</span>
          </button>

          <button
            type="button"
            onClick={() => setModalTab('import')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
              modalTab === 'import'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            )}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Statement (CSV / PDF)</span>
          </button>
        </div>
      )}

      {/* MODE 1: MANUAL ENTRY */}
      {modalTab === 'manual' && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
              {errors.form}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Transaction Type</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Expense</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                  type === 'income'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Income</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('transfer')}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer',
                  type === 'transfer'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
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

          {/* Description */}
          <Input
            label="Description / Notes"
            placeholder="e.g. Grocery shopping, Freelance invoice #102..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Tags */}
          <Input
            label="Tags (Optional)"
            placeholder="e.g. food, trip-to-pokhara, tax-deductible (comma-separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
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
      )}

      {/* MODE 2: STATEMENT IMPORT (CSV / PDF) */}
      {modalTab === 'import' && !editingTransaction && (
        <div className="space-y-4">
          {importSuccessMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{importSuccessMessage}</span>
            </div>
          )}

          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-medium text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Target Account Selector */}
          <div>
            <Select
              label="Deposit / Assign to Account"
              value={importAccountId}
              onChange={(e) => setImportAccountId(e.target.value)}
            >
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </Select>
          </div>

          {/* File Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-indigo-50/20 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.pdf,.txt"
              onChange={handleStatementFileChange}
              className="hidden"
            />
            <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {importFileName ? importFileName : 'Click to upload bank statement (.CSV, .PDF, or .TXT)'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports standard bank exports, Nabil Bank statements, eSewa logs, and CSV transactions
            </p>
          </div>

          {/* Parsed Transactions List */}
          {parsedItems.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    Found {parsedItems.length} Transactions
                  </span>
                  <span className="text-slate-500">
                    ({selectedCount} selected &bull; Total: {settings.currencySymbol || 'Rs.'}{' '}
                    {selectedTotal.toLocaleString()})
                  </span>
                </div>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="text-indigo-600 hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="text-slate-500 hover:underline font-medium cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Transactions Preview Table */}
              <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {parsedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleItem(item.id)}
                    className={cn(
                      'flex items-center justify-between p-2.5 text-xs transition-colors cursor-pointer select-none',
                      item.selected ? 'bg-indigo-50/30 dark:bg-indigo-950/30' : 'opacity-60 bg-white dark:bg-slate-900'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => {}}
                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {item.description}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                          item.type === 'income'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        )}
                      >
                        {item.type}
                      </span>
                      <span
                        className={cn(
                          'font-bold text-xs',
                          item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                        )}
                      >
                        {item.type === 'income' ? '+' : '-'}{settings.currencySymbol || 'Rs.'}{' '}
                        {item.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Import Action Bar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeTransactionModal}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleExecuteImport}
                  disabled={selectedCount === 0 || isImporting}
                  isLoading={isImporting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Import {selectedCount} Transactions
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
