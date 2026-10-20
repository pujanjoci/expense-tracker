import React from 'react';
import { Account } from '@/types';
import { Building2, Smartphone, Banknote, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountBadgeProps {
  account?: Account | null;
  name?: string;
  type?: 'bank' | 'cash' | 'wallet';
  className?: string;
}

export function AccountBadge({ account, name, type, className }: AccountBadgeProps) {
  const accountName = account?.name || name || 'Unknown Account';
  const accountType = account?.type || type || 'bank';

  const isBank = accountType === 'bank' || /bank/i.test(accountName);
  const isWallet = accountType === 'wallet' || /esewa|khalti|wallet/i.test(accountName);
  const isCash = accountType === 'cash' || /cash/i.test(accountName);

  let Icon = Building2;
  let bgClass = 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60';

  if (isWallet) {
    Icon = Smartphone;
    bgClass = 'bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60';
  } else if (isCash) {
    Icon = Banknote;
    bgClass = 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border shadow-2xs transition-colors',
        bgClass,
        className
      )}
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate max-w-[140px]">{accountName}</span>
    </span>
  );
}
