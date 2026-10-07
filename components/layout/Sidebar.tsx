'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  WalletCards,
  ChartNoAxesCombined,
  SlidersHorizontal,
  Settings,
  Plus,
  Layers,
  RefreshCw,
  MailCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import { AppUser, getCurrentAppUser, isGuestUser } from '@/lib/api';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Accounts', href: '/accounts', icon: WalletCards },
  { label: 'Analytics', href: '/analytics', icon: ChartNoAxesCombined },
  { label: 'Categories', href: '/categories', icon: SlidersHorizontal },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  useEffect(() => { setCurrentUser(getCurrentAppUser()); }, []);
  const pathname = usePathname();
  const { openAddTransaction, isSyncing, syncStatus, refreshData, syncBankEmails, settings } = useApp();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
            <WalletCards className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base block leading-tight">
              Expense Tracker
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Action Button */}
      <div className="p-4 space-y-2">
        <button
          onClick={openAddTransaction}
          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-medium py-2.5 px-4 rounded-xl text-sm shadow-xs transition-all cursor-pointer group"
        >
          <Plus className="w-4 h-4 transition-transform group-hover:rotate-90 duration-200" />
          <span>Add Transaction</span>
        </button>

        {settings.googleSheetsUrl && currentUser?.role === 'owner' && (
          <button
            onClick={() => syncBankEmails()}
            disabled={isSyncing}
            className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 font-medium py-2 px-3 rounded-lg text-xs border border-emerald-200/80 transition-all cursor-pointer disabled:opacity-50"
            title="Scan Gmail for new bank transaction alert emails"
          >
            <MailCheck className={cn('w-3.5 h-3.5 text-emerald-700', isSyncing && 'animate-spin')} />
            <span>{isSyncing ? 'Scanning Gmail...' : 'Sync Bank Emails'}</span>
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-slate-900' : 'text-slate-500'
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Profile / Sync Info */}
      <div className="p-4 border-t border-slate-100 space-y-3 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                'w-2 h-2 rounded-full',
                isGuestUser()
                  ? 'bg-slate-400'
                  : settings.googleSheetsUrl
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              )}
            />
            <span className="font-medium">
              {isGuestUser()
                ? 'Local Only (Offline)'
                : syncStatus === 'syncing'
                ? 'Syncing…'
                : syncStatus === 'pending'
                ? 'Waiting to sync'
                : settings.googleSheetsUrl
                ? 'Synced to Sheets'
                : 'Local Only'}
            </span>
          </div>
          {!isGuestUser() && (
            <button
              onClick={() => refreshData()}
              disabled={isSyncing}
              title="Refresh & Sync Data"
              aria-label="Refresh Data"
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <div className="h-8 w-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
            {currentUser?.name
              ? currentUser.name.slice(0, 2).toUpperCase()
              : isGuestUser()
              ? 'LO'
              : currentUser?.email
              ? currentUser.email.slice(0, 2).toUpperCase()
              : 'ME'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {currentUser?.name || (isGuestUser() ? 'Local Account' : currentUser?.email || 'Personal Account')}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {isGuestUser() ? 'Offline Mode' : currentUser?.role === 'owner' ? 'Owner' : 'User'} · {settings.currency || 'NPR'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
