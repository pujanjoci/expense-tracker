'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PiggyBank,
  WalletCards,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export function BottomNav() {
  const pathname = usePathname();
  const { openAddTransaction } = useApp();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/'
              ? 'text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <LayoutDashboard
            className={cn('w-5 h-5', pathname === '/' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500')}
          />
          <span>Dashboard</span>
        </Link>

        {/* Transactions */}
        <Link
          href="/transactions"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/transactions'
              ? 'text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <ArrowLeftRight
            className={cn('w-5 h-5', pathname === '/transactions' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500')}
          />
          <span>History</span>
        </Link>

        {/* Center Prominent Add Button */}
        <div className="flex items-center justify-center flex-1 -mt-5">
          <button
            onClick={openAddTransaction}
            aria-label="Add transaction"
            className="h-12 w-12 rounded-full bg-slate-900 dark:bg-violet-600 text-white shadow-md shadow-slate-900/20 flex items-center justify-center hover:bg-slate-800 dark:hover:bg-violet-500 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-slate-900"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Savings */}
        <Link
          href="/savings"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/savings'
              ? 'text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <PiggyBank
            className={cn('w-5 h-5', pathname === '/savings' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500')}
          />
          <span>Savings</span>
        </Link>

        {/* Accounts */}
        <Link
          href="/accounts"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/accounts'
              ? 'text-slate-900 dark:text-white font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          <WalletCards
            className={cn('w-5 h-5', pathname === '/accounts' ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500')}
          />
          <span>Accounts</span>
        </Link>
      </div>
    </div>
  );
}
