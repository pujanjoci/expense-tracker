'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { AccountModal } from '@/components/accounts/AccountModal';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { useApp } from '@/context/AppContext';
import { Mail, X, Plus } from 'lucide-react';
import { LoginGate } from '@/components/auth/LoginGate';
import { useRouter } from 'next/navigation';
import { AppUser, getCurrentAppUser, setLocalGuestUser } from '@/lib/api';
import { initTheme } from '@/lib/themes';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { syncMessage, clearSyncMessage, refreshData, openAddTransaction } = useApp();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
    initTheme();
    const user = getCurrentAppUser();
    if (user) {
      void refreshData().finally(() => {
        setCurrentUser(user);
        setHasCheckedSession(true);
      });
    } else {
      setHasCheckedSession(true);
    }
  }, [refreshData]);

  const handleAuthenticated = async (user: AppUser) => {
    await refreshData();
    setCurrentUser(user);
    router.push('/');
  };

  const handleSkip = async (name?: string) => {
    const guest = setLocalGuestUser(name);
    await refreshData();
    setCurrentUser(guest);
    router.push('/');
  };

  useEffect(() => {
    if (syncMessage) {
      const timer = setTimeout(() => {
        clearSyncMessage();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [syncMessage, clearSyncMessage]);

  if (!hasCheckedSession) {
    return <div className="min-h-screen" aria-label="Loading account" />;
  }

  if (!currentUser) {
    return <LoginGate onAuthenticated={handleAuthenticated} onSkip={handleSkip} />;
  }

  return (
    <div className="min-h-screen flex relative transition-colors duration-150">
      {/* High-Performance Static Ambient Background (Zero lag) */}
      <div className="ambient-bg" />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-12 relative z-10">
        {/* Mobile Header */}
        <Header />

        {/* Sync Toast Notification */}
        {syncMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-slate-900/95 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700/80 flex items-center gap-3 text-xs sm:text-sm font-medium">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncMessage}</span>
              <button
                onClick={clearSyncMessage}
                className="p-1 hover:bg-slate-800 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Floating Action Button (FAB) on Desktop for Quick Add */}
      <button
        onClick={openAddTransaction}
        aria-label="Quick Add Transaction"
        title="Add Transaction"
        className="hidden lg:flex fixed bottom-8 right-8 z-40 h-13 w-13 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-xl shadow-violet-600/30 items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer border border-white/20 group"
      >
        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-200" />
      </button>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals */}
      <TransactionModal />
      <AccountModal />
      <CategoryModal />
    </div>
  );
}
