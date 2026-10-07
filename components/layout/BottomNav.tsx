'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  Tag,
  WalletCards,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

export function BottomNav() {
  const pathname = usePathname();
  const { openAddTransaction } = useApp();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pb-safe">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* Dashboard */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <LayoutDashboard className={cn('w-5 h-5', pathname === '/' ? 'text-slate-900' : 'text-slate-500')} />
          <span>Dashboard</span>
        </Link>

        {/* Transactions */}
        <Link
          href="/transactions"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/transactions' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <ArrowLeftRight
            className={cn('w-5 h-5', pathname === '/transactions' ? 'text-slate-900' : 'text-slate-500')}
          />
          <span>History</span>
        </Link>

        {/* Center Prominent Add Button */}
        <div className="flex items-center justify-center flex-1 -mt-5">
          <button
            onClick={openAddTransaction}
            aria-label="Add Transaction"
            className="h-12 w-12 rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/20 flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all cursor-pointer border-2 border-white"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Categories */}
        <Link
          href="/categories"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/categories' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <Tag
            className={cn('w-5 h-5', pathname === '/categories' ? 'text-slate-900' : 'text-slate-500')}
          />
          <span>Categories</span>
        </Link>

        {/* Accounts */}
        <Link
          href="/accounts"
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 gap-1 text-[11px] font-medium transition-colors',
            pathname === '/accounts' ? 'text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <WalletCards
            className={cn('w-5 h-5', pathname === '/accounts' ? 'text-slate-900' : 'text-slate-500')}
          />
          <span>Accounts</span>
        </Link>
      </div>
    </div>
  );
}
