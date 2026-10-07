'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { TransactionModal } from '@/components/transactions/TransactionModal';
import { AccountModal } from '@/components/accounts/AccountModal';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { useApp } from '@/context/AppContext';
import { Mail, Check, X } from 'lucide-react';
import { LoginGate } from '@/components/auth/LoginGate';
import { useRouter } from 'next/navigation';
import { AppUser, getCurrentAppUser, setLocalGuestUser } from '@/lib/api';

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { syncMessage, clearSyncMessage, refreshData } = useApp();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  useEffect(() => {
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
    return <div className="min-h-screen bg-slate-50" aria-label="Loading account" />;
  }

  if (!currentUser) {
    return <LoginGate onAuthenticated={handleAuthenticated} onSkip={handleSkip} />;
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex relative">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-12">
        {/* Mobile Header */}
        <Header />

        {/* Sync Toast Notification */}
        {syncMessage && (
          <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3 text-xs sm:text-sm font-medium">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncMessage}</span>
              <button
                onClick={clearSyncMessage}
                className="p-1 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
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

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Modals */}
      <TransactionModal />
      <AccountModal />
      <CategoryModal />
    </div>
  );
}
