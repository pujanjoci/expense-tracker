'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  WalletCards,
  RefreshCw,
  MailCheck,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { AppUser, getCurrentAppUser } from '@/lib/api';
import { toggleDarkLight, togglePrivacyMode, getPrivacyMode, getSavedTheme, isDarkTheme } from '@/lib/themes';

export function Header() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setCurrentUser(getCurrentAppUser());
    setIsPrivacy(getPrivacyMode());
    const currentTheme = getSavedTheme();
    setIsDark(isDarkTheme(currentTheme));

    const handlePrivacy = (e: any) => setIsPrivacy(e.detail);
    const handleTheme = (e: any) => {
      setIsDark(isDarkTheme(e.detail));
    };

    window.addEventListener('expense-tracker-privacy-changed', handlePrivacy);
    window.addEventListener('expense-tracker-theme-changed', handleTheme);
    return () => {
      window.removeEventListener('expense-tracker-privacy-changed', handlePrivacy);
      window.removeEventListener('expense-tracker-theme-changed', handleTheme);
    };
  }, []);

  const { isSyncing, refreshData, syncBankEmails, settings } = useApp();

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-slate-900 dark:bg-slate-100 flex items-center justify-center text-white dark:text-slate-900 shadow-xs">
          <WalletCards className="h-4 w-4" />
        </div>
        <span className="font-display font-semibold text-base tracking-tight text-slate-900 dark:text-slate-100">
          Expense Tracker
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {/* Privacy Mode Toggle */}
        <button
          onClick={() => togglePrivacyMode()}
          aria-label={isPrivacy ? 'Disable privacy mode' : 'Enable privacy mode'}
          title={isPrivacy ? 'Privacy mode on' : 'Privacy mode off'}
          className={cn(
            'p-2 rounded-lg transition-colors cursor-pointer',
            isPrivacy
              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          {isPrivacy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => toggleDarkLight()}
          aria-label="Toggle theme"
          title="Toggle light and dark theme"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Gmail Sync (for owner) */}
        {settings.googleSheetsUrl && currentUser?.role === 'owner' && (
          <button
            onClick={() => syncBankEmails()}
            disabled={isSyncing}
            aria-label="Sync bank emails"
            title="Scan Gmail for new bank alerts"
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <MailCheck className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
          </button>
        )}

        {/* Refresh Sync */}
        <button
          onClick={() => refreshData()}
          disabled={isSyncing}
          aria-label="Refresh and sync data"
          title="Refresh data"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin text-indigo-600')} />
        </button>
      </div>
    </header>
  );
}
