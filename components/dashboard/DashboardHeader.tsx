'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { getCurrentAppUser, type AppUser } from '@/lib/api';

export function DashboardHeader() {
  const { openAddTransaction } = useApp();
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
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

  const currentDate = format(new Date(), 'EEEE, d MMMM yyyy');
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 sm:pb-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-display font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          onClick={openAddTransaction}
          icon={Plus}
          size="md"
          className="shadow-xs cursor-pointer font-medium"
        >
          Add transaction
        </Button>
      </div>
    </div>
  );
}
