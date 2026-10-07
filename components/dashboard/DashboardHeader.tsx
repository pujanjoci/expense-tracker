'use client';

import React from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { getCurrentAppUser } from '@/lib/api';

export function DashboardHeader() {
  const { openAddTransaction } = useApp();
  const user = getCurrentAppUser();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = format(new Date(), 'EEEE, dd MMMM yyyy');
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  return (
    <div className="flex items-center justify-between gap-3 pb-3 sm:pb-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs sm:text-sm text-slate-500 font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="hidden sm:flex items-center gap-2.5">
        <Button
          onClick={openAddTransaction}
          icon={Plus}
          size="md"
          className="shadow-xs"
        >
          Add transaction
        </Button>
      </div>
    </div>
  );
}
