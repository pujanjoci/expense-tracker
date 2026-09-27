'use client';

import React from 'react';
import { format } from 'date-fns';
import { Plus, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';

export function DashboardHeader() {
  const { openAddTransaction } = useApp();

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const currentDate = format(new Date(), 'EEEE, dd MMMM yyyy');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {getGreeting()}
        </h1>
        <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-slate-500 font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          onClick={openAddTransaction}
          icon={Plus}
          size="md"
          className="shadow-xs w-full sm:w-auto"
        >
          Add transaction
        </Button>
      </div>
    </div>
  );
}
