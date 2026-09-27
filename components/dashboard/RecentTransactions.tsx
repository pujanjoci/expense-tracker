'use client';

import React from 'react';
import Link from 'next/link';
import { Transaction, Account, Category } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatShortDate } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { CategoryIcon } from '@/lib/icons';
import { AccountBadge } from '@/components/accounts/AccountBadge';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';

interface RecentTransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  limit?: number;
}

export function RecentTransactions({
  transactions,
  accounts,
  categories,
  limit = 6,
}: RecentTransactionsProps) {
  const { formatMoney, openAddTransaction, openEditTransaction } = useApp();

  const accountMap = new Map<string, Account>();
  accounts.forEach((acc) => accountMap.set(acc.id, acc));

  const categoryMap = new Map<string, Category>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  // Sort descending by date
  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">Latest activity across all accounts</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 transition-colors group"
        >
          <span>View all</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>
      <CardContent>
        {sortedTransactions.length === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="No transactions yet"
            description="Add your first transaction or sync your bank emails to start tracking."
            actionLabel="Add transaction"
            onAction={openAddTransaction}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {sortedTransactions.map((tx) => {
              const account = accountMap.get(tx.accountId);
              const targetAccount = tx.transferToAccountId
                ? accountMap.get(tx.transferToAccountId)
                : null;
              const category = tx.categoryId ? categoryMap.get(tx.categoryId) : null;

              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';
              const isTransfer = tx.type === 'transfer';

              return (
                <div
                  key={tx.id}
                  onClick={() => openEditTransaction(tx)}
                  className="flex items-center justify-between py-3 px-2 -mx-2 rounded-lg hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                        isIncome
                          ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
                          : isExpense
                          ? 'bg-slate-100 border-slate-200/80 text-slate-700'
                          : 'bg-indigo-50 border-indigo-200/80 text-indigo-700'
                      }`}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4" />
                      ) : (
                        <CategoryIcon name={category?.icon || 'HelpCircle'} className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-slate-800">
                        {tx.description || (isTransfer ? 'Transfer' : category?.name || 'Transaction')}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 truncate mt-0.5">
                        {isTransfer ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <AccountBadge account={account} name={account?.name || 'Bank'} />
                            <span className="text-slate-400">→</span>
                            <AccountBadge account={targetAccount} name={targetAccount?.name || 'Wallet'} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <AccountBadge account={account} name={account?.name || 'Bank'} />
                            {category && (
                              <span className="text-slate-500 font-medium">· {category.name}</span>
                            )}
                          </div>
                        )}
                        <span>•</span>
                        <span className="shrink-0">{formatShortDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount with + / - indicator and icon */}
                  <div className="text-right shrink-0 pl-3">
                    <div
                      className={`flex items-center justify-end gap-1 font-bold text-sm sm:text-base ${
                        isIncome
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-slate-900'
                          : 'text-indigo-600'
                      }`}
                    >
                      {isIncome && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {isExpense && <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                      {isTransfer && <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                      <span>
                        {isIncome ? '+ ' : isExpense ? '- ' : ''}
                        {formatMoney(tx.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
