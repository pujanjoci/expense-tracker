'use client';

import React from 'react';
import { AccountBalanceSummary, AccountType } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import {
  Landmark,
  Banknote,
  Smartphone,
  CreditCard,
  Pencil,
  Power,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ReceiptText,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface AccountCardProps {
  account: AccountBalanceSummary;
  onEdit: (account: AccountBalanceSummary) => void;
  onToggleActive: (account: AccountBalanceSummary) => void;
  onDelete: (account: AccountBalanceSummary) => void;
}

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: any; colorClass: string; bgClass: string }
> = {
  bank: {
    label: 'Bank Account',
    icon: Landmark,
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200/80',
  },
  cash: {
    label: 'Cash in Hand',
    icon: Banknote,
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50 border-emerald-200/80',
  },
  wallet: {
    label: 'Digital Wallet',
    icon: Smartphone,
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50 border-purple-200/80',
  },
  other: {
    label: 'Other Account',
    icon: CreditCard,
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-100 border-slate-200/80',
  },
};

export function AccountCard({
  account,
  onEdit,
  onToggleActive,
  onDelete,
}: AccountCardProps) {
  const { formatMoney } = useApp();
  const config = ACCOUNT_TYPE_CONFIG[account.type] || ACCOUNT_TYPE_CONFIG.other;
  const Icon = config.icon;

  return (
    <Card className={cn('relative transition-all', !account.active && 'opacity-65 bg-slate-50/70')}>
      <CardContent className="p-5">
        {/* Top: Icon, Name, Type, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs',
                config.bgClass,
                config.colorClass
              )}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900 truncate text-base">
                  {account.name}
                </h3>
                {!account.active && (
                  <Badge variant="secondary" className="text-[10px] py-0">
                    Inactive
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">{config.label}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(account)}
              title="Edit Account"
              aria-label="Edit Account"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleActive(account)}
              title={account.active ? 'Deactivate Account' : 'Activate Account'}
              aria-label={account.active ? 'Deactivate Account' : 'Activate Account'}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <Power className={cn('w-3.5 h-3.5', account.active ? 'text-slate-400' : 'text-emerald-600')} />
            </button>
            <button
              onClick={() => onDelete(account)}
              title="Delete Account"
              aria-label="Delete Account"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Current Balance Display */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Current Balance
          </span>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            {formatMoney(account.currentBalance)}
          </div>
        </div>

        {/* Account Flow Breakdown */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">In: {formatMoney(account.totalIncome)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">Out: {formatMoney(account.totalExpense)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ReceiptText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{account.transactionCount} transactions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">
              Opening: {formatMoney(account.openingBalance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
