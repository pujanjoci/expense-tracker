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
  Tag,
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-4">
        <div>
          <CardTitle>Recent transactions</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Latest activity across all accounts</p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 flex items-center gap-1 transition-colors group"
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
            description="Add your first transaction to start tracking."
            actionLabel="Add transaction"
            onAction={openAddTransaction}
          />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
                  className="flex items-center justify-between py-2.5 sm:py-3 px-2 -mx-2 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer group"
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    <div
                      className={`h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-600 dark:text-violet-400'
                      }`}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4" />
                      ) : (
                        <CategoryIcon name={category?.icon || 'HelpCircle'} className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                          {tx.description || (isTransfer ? 'Transfer' : category?.name || 'Transaction')}
                        </p>
                        {tx.tags && tx.tags.length > 0 && (
                          <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Tag className="w-2.5 h-2.5" />
                            {tx.tags[0]}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {isTransfer ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <AccountBadge account={account} name={account?.name || 'Bank'} />
                            <span className="text-slate-400">→</span>
                            <AccountBadge account={targetAccount} name={targetAccount?.name || 'Wallet'} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <AccountBadge account={account} name={account?.name || 'Bank'} />
                            {category && (
                              <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">· {category.name}</span>
                            )}
                          </div>
                        )}
                        <span>•</span>
                        <span className="shrink-0">{formatShortDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount with + / - indicator and tabular-nums / privacy-sensitive */}
                  <div className="text-right shrink-0 pl-2 sm:pl-3">
                    <div
                      className={`flex items-center justify-end gap-0.5 sm:gap-1 font-bold font-display text-xs sm:text-sm tabular-nums privacy-sensitive whitespace-nowrap ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-violet-600 dark:text-violet-400'
                      }`}
                    >
                      {isIncome && <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      {isExpense && <ArrowUpRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />}
                      {isTransfer && <ArrowLeftRight className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />}
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
