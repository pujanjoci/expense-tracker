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
import { ProfileAvatar } from '@/lib/profile-avatars';
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

  const { isSyncing, syncStatus, refreshData, syncBankEmails, settings } = useApp();

  return (
    <header className="lg:hidden sticky top-0 z-30 aurora-glass border-b border-border/60 px-4 py-2.5 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
          <WalletCards className="h-4 w-4" />
        </div>
        <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">
          Expense Tracker
        </span>
      </Link>

      <div className="flex items-center gap-1">
        {/* Privacy Mode Toggle */}
        <button
          onClick={() => togglePrivacyMode()}
          aria-label={isPrivacy ? 'Disable Privacy Mode' : 'Enable Privacy Mode'}
          title={isPrivacy ? 'Privacy Mode Active (Tap to show amounts)' : 'Enable Privacy Mode (Blur amounts)'}
          className={cn(
            'p-2 rounded-lg transition-colors cursor-pointer',
            isPrivacy
              ? 'text-violet-600 dark:text-violet-400 bg-violet-500/15'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          )}
        >
          {isPrivacy ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => toggleDarkLight()}
          aria-label="Toggle Light/Dark Theme"
          title="Toggle Light / Dark Theme"
          className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
        </button>

        {/* Gmail Sync (for owner) */}
        {settings.googleSheetsUrl && currentUser?.role === 'owner' && (
          <button
            onClick={() => syncBankEmails()}
            disabled={isSyncing}
            aria-label="Sync Bank Emails"
            title="Scan Gmail for new bank alerts"
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15 rounded-lg transition-colors cursor-pointer"
          >
            <MailCheck className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
          </button>
        )}

        {/* Refresh Sync */}
        <button
          onClick={() => refreshData()}
          disabled={isSyncing}
          aria-label="Refresh & Sync Data"
          title={syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'pending' ? 'Pending Sync' : 'Synced'}
          className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className={cn('w-4 h-4', (isSyncing || syncStatus === 'syncing') && 'animate-spin')} />
          <span className={cn(
            'absolute right-1 top-1 h-1.5 w-1.5 rounded-full ring-1 ring-black/20',
            syncStatus === 'pending' ? 'bg-amber-400' : syncStatus === 'syncing' ? 'bg-indigo-400' : 'bg-emerald-400'
          )} />
        </button>

        <Link
          href="/settings"
          aria-label="Settings and Profile"
          className="p-1 hover:opacity-85 transition-opacity ml-0.5"
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
