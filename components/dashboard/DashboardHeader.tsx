'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { getCurrentAppUser, type AppUser } from '@/lib/api';

export function DashboardHeader() {
  const { openAddTransaction } = useApp();
  const [user, setUser] = useState<AppUser | null>(null);

  React.useEffect(() => {
    setUser(getCurrentAppUser());
    const handleUpdate = (e: any) => {
      if (e.detail) setUser(e.detail);
      else setUser(getCurrentAppUser());
    };
    window.addEventListener('expense-tracker-user-updated', handleUpdate);
    return () => window.removeEventListener('expense-tracker-user-updated', handleUpdate);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = format(new Date(), 'EEEE, dd MMMM yyyy');
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <div className="flex items-center justify-between gap-3 pb-2 sm:pb-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-3xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {getGreeting()}{firstName ? `, ${firstName}` : ''}
          </h1>
          <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400 hidden sm:inline-block animate-pulse" />
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2.5">
        <Button
          onClick={openAddTransaction}
          icon={Plus}
          size="md"
          className="shadow-sm bg-gradient-to-r from-violet-600 via-indigo-600 to-teal-600 hover:from-violet-500 hover:to-teal-500 text-white font-medium border-0 cursor-pointer"
        >
          Add transaction
        </Button>
      </div>
    </div>
  );
}
