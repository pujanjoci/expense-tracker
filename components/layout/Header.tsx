'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WalletCards, Settings, RefreshCw, SlidersHorizontal, MailCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { AppUser, getCurrentAppUser } from '@/lib/api';
import { ProfileAvatar } from '@/lib/profile-avatars';

export function Header() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  useEffect(() => { setCurrentUser(getCurrentAppUser()); }, []);
  const { isSyncing, syncStatus, refreshData, syncBankEmails, settings } = useApp();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
          <WalletCards className="h-4.5 w-4.5" />
        </div>
        <span className="font-bold text-slate-900 tracking-tight text-base">
          Expense Tracker
        </span>
      </Link>

      <div className="flex items-center gap-1.5">
        {settings.googleSheetsUrl && currentUser?.role === 'owner' && (
          <button
            onClick={() => syncBankEmails()}
            disabled={isSyncing}
            aria-label="Sync Bank Emails"
            title="Scan Gmail for new bank transactions"
            className="p-2 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer border border-emerald-200/60"
          >
            <MailCheck className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
          </button>
        )}

        <button
          onClick={() => refreshData()}
          disabled={isSyncing}
          aria-label="Refresh & Sync Data"
          title={syncStatus === 'syncing' ? 'Syncing changes' : syncStatus === 'pending' ? 'Changes waiting to sync' : 'Changes synced'}
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={cn('w-4 h-4', (isSyncing || syncStatus === 'syncing') && 'animate-spin text-slate-900')} />
          <span className={cn(
            'absolute right-1 top-1 h-1.5 w-1.5 rounded-full',
            syncStatus === 'pending' ? 'bg-amber-500' : syncStatus === 'syncing' ? 'bg-indigo-500' : 'bg-emerald-500'
          )} />
        </button>

        <Link
          href="/settings"
          aria-label="Settings and Profile"
          className="p-1 hover:opacity-85 transition-opacity"
        >
          <ProfileAvatar
            avatar={currentUser?.avatar}
            presetId={currentUser?.avatarPreset}
            name={currentUser?.name}
            size="sm"
          />
        </Link>
      </div>
    </header>
  );
}
