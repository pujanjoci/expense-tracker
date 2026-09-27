'use client';

import React from 'react';
import { Transaction, Account, Category } from '@/types';
import { formatShortDate, cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { CategoryIcon } from '@/lib/icons';
import { AccountBadge } from '@/components/accounts/AccountBadge';
import {
  Pencil,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  accounts: Account[];
  categories: Category[];
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionCard({
  transaction: tx,
  accounts,
  categories,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const { formatMoney } = useApp();

  const accountMap = new Map<string, Account>();
  accounts.forEach((a) => accountMap.set(a.id, a));

  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const account = accountMap.get(tx.accountId);
  const targetAccount = tx.transferToAccountId
    ? accountMap.get(tx.transferToAccountId)
    : null;
  const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null;

  const isIncome = tx.type === 'income';
  const isExpense = tx.type === 'expense';
  const isTransfer = tx.type === 'transfer';

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
      {/* Top Row: Icon, Description, Amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs',
              isIncome && 'bg-emerald-50 border-emerald-200/80 text-emerald-700',
              isExpense && 'bg-slate-100 border-slate-200/80 text-slate-700',
              isTransfer && 'bg-indigo-50 border-indigo-200/80 text-indigo-700'
            )}
          >
            {isTransfer ? (
              <ArrowLeftRight className="w-4 h-4" />
            ) : (
              <CategoryIcon name={category?.icon || 'HelpCircle'} className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {tx.description || (isTransfer ? 'Transfer' : category?.name || 'Transaction')}
            </h4>
            <p className="text-xs text-slate-500 font-medium">{formatShortDate(tx.date)}</p>
          </div>
        </div>

        {/* Amount */}
        <div
          className={cn(
            'flex items-center gap-1 font-bold text-sm shrink-0',
            isIncome && 'text-emerald-600',
            isExpense && 'text-slate-900',
            isTransfer && 'text-indigo-600'
          )}
        >
          {isIncome && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />}
          {isExpense && <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />}
          {isTransfer && <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />}
          <span>
            {isIncome ? '+ ' : isExpense ? '- ' : ''}
            {formatMoney(tx.amount)}
          </span>
        </div>
      </div>

      {/* Meta & Actions Row with Account Badges */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {isTransfer ? (
            <div className="flex items-center gap-1">
              <AccountBadge account={account} name={account?.name || 'Bank'} />
              <span className="text-slate-400 text-xs font-bold">→</span>
              <AccountBadge account={targetAccount} name={targetAccount?.name || 'Wallet'} />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <AccountBadge account={account} name={account?.name || 'Bank'} />
              {category && (
                <span className="text-slate-400 font-medium">· {category.name}</span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0 pl-1">
          <button
            onClick={() => onEdit(tx)}
            aria-label="Edit transaction"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(tx.id)}
            aria-label="Delete transaction"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
