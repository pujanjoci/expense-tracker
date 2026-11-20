'use client';

import React from 'react';
import { Transaction, Account, Category } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { CategoryIcon } from '@/lib/icons';
import { Badge } from '@/components/ui/Badge';
import { AccountBadge } from '@/components/accounts/AccountBadge';
import {
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionTable({
  transactions,
  accounts,
  categories,
  onEdit,
  onDelete,
}: TransactionTableProps) {
  const { formatMoney } = useApp();

  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.id, a));

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs">
      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 border-collapse">
        <thead className="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
          <tr>
            <th className="py-3 px-4">Date</th>
            <th className="py-3 px-4">Description</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Account or source</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4 text-right">Amount</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {transactions.map((tx) => {
            const account = accountMap.get(tx.accountId);
            const targetAccount = tx.transferToAccountId
              ? accountMap.get(tx.transferToAccountId)
              : null;
            const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null;

            const isIncome = tx.type === 'income';
            const isExpense = tx.type === 'expense';
            const isTransfer = tx.type === 'transfer';

            return (
              <tr
                key={tx.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
              >
                {/* Date */}
                <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {formatDate(tx.date, 'dd MMM yyyy')}
                </td>

                {/* Description */}
                <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs truncate">
                  {tx.description || (isTransfer ? 'Transfer' : category?.name || 'Transaction')}
                </td>

                {/* Category */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {isTransfer ? (
                    <span className="text-xs text-slate-400 italic">N/A (Transfer)</span>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <CategoryIcon
                        name={category?.icon || 'HelpCircle'}
                        className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
                      />
                      <span>{category?.name || 'Uncategorized'}</span>
                    </div>
                  )}
                </td>

                {/* Account Badge with clear source bank/wallet */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {isTransfer ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <AccountBadge account={account} name={account?.name || 'Bank'} />
                      <span className="text-slate-400 text-xs font-bold">→</span>
                      <AccountBadge account={targetAccount} name={targetAccount?.name || 'Wallet'} />
                    </div>
                  ) : (
                    <AccountBadge account={account} name={account?.name || 'Bank'} />
                  )}
                </td>

                {/* Type Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {isIncome && (
                    <Badge variant="success" icon={ArrowDownLeft}>
                      Income
                    </Badge>
                  )}
                  {isExpense && (
                    <Badge variant="secondary" icon={ArrowUpRight}>
                      Expense
                    </Badge>
                  )}
                  {isTransfer && (
                    <Badge variant="info" icon={ArrowLeftRight}>
                      Transfer
                    </Badge>
                  )}
                </td>

                {/* Amount */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right font-bold text-sm">
                  <span
                    className={cn(
                      isIncome && 'text-emerald-600 dark:text-emerald-400',
                      isExpense && 'text-slate-900 dark:text-slate-100',
                      isTransfer && 'text-indigo-600 dark:text-indigo-400'
                    )}
                  >
                    {isIncome ? '+ ' : isExpense ? '- ' : ''}
                    {formatMoney(tx.amount)}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(tx)}
                      aria-label="Edit transaction"
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(tx.id)}
                      aria-label="Delete transaction"
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
