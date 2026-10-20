'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { toggleDarkLight, togglePrivacyMode, getPrivacyMode } from '@/lib/themes';
import {
  Search,
  LayoutDashboard,
  ArrowLeftRight,
  WalletCards,
  PiggyBank,
  PieChart,
  SlidersHorizontal,
  Settings,
  Plus,
  Moon,
  Sun,
  Eye,
  EyeOff,
  RefreshCw,
  Repeat,
  Target,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

interface PaletteItem {
  label: string;
  icon: any;
  action: () => void;
  type: string;
  sub?: string;
}

export function CommandPalette() {
  const router = useRouter();
  const { openAddTransaction, refreshData, transactions, formatMoney, categories } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPrivacy, setIsPrivacy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsPrivacy(getPrivacyMode());
    const handlePrivacy = (e: any) => setIsPrivacy(e.detail);
    window.addEventListener('expense-tracker-privacy-changed', handlePrivacy);
    return () => window.removeEventListener('expense-tracker-privacy-changed', handlePrivacy);
  }, []);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navActions = [
    { label: 'Go to Dashboard', icon: LayoutDashboard, action: () => router.push('/') },
    { label: 'Go to Transactions', icon: ArrowLeftRight, action: () => router.push('/transactions') },
    { label: 'Go to Accounts', icon: WalletCards, action: () => router.push('/accounts') },
    { label: 'Go to Savings Goals', icon: PiggyBank, action: () => router.push('/savings') },
    { label: 'Go to Budgets & Alerts', icon: Target, action: () => router.push('/budgets') },
    { label: 'Go to Recurring & Subscriptions', icon: Repeat, action: () => router.push('/recurring') },
    { label: 'Go to Analytics & Reports', icon: PieChart, action: () => router.push('/analytics') },
    { label: 'Go to Categories', icon: SlidersHorizontal, action: () => router.push('/categories') },
    { label: 'Go to Settings', icon: Settings, action: () => router.push('/settings') },
  ];

  const quickActions = [
    { label: 'Add New Transaction', icon: Plus, action: () => openAddTransaction() },
    { label: 'Toggle Dark / Light Theme', icon: Moon, action: () => toggleDarkLight() },
    {
      label: isPrivacy ? 'Disable Privacy Mode (Show Amounts)' : 'Enable Privacy Mode (Blur Amounts)',
      icon: isPrivacy ? Eye : EyeOff,
      action: () => togglePrivacyMode(),
    },
    { label: 'Refresh & Sync Google Sheets', icon: RefreshCw, action: () => refreshData() },
  ];

  const query = search.trim().toLowerCase();

  const matchingNav = navActions.filter((item) =>
    item.label.toLowerCase().includes(query)
  );

  const matchingActions = quickActions.filter((item) =>
    item.label.toLowerCase().includes(query)
  );

  const matchingTransactions = query.length >= 2
    ? transactions
        .filter((tx) =>
          tx.description.toLowerCase().includes(query) ||
          String(tx.amount).includes(query)
        )
        .slice(0, 6)
    : [];

  const allItems: PaletteItem[] = [
    ...matchingActions.map((a) => ({ ...a, type: 'action' })),
    ...matchingNav.map((n) => ({ ...n, type: 'nav' })),
    ...matchingTransactions.map((tx) => ({
      label: `${tx.description} (${formatMoney(tx.amount)})`,
      icon: FileSpreadsheet,
      action: () => router.push('/transactions'),
      type: 'transaction',
      sub: formatDate(tx.date),
    })),
  ];

  const handleSelect = (index: number) => {
    const item = allItems[index];
    if (item) {
      item.action();
      setIsOpen(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl aurora-card bg-slate-900/90 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-10 text-white animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
          <Search className="w-5 h-5 text-violet-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page, or search transactions..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
          <button
            onClick={() => setIsOpen(false)}
            className="sm:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands or transactions found for "{search}".
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-left',
                    isSelected
                      ? 'bg-violet-600/30 text-white border border-violet-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        'p-1.5 rounded-lg border shrink-0',
                        isSelected
                          ? 'bg-violet-500/20 text-violet-300 border-violet-400/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700/60'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 truncate">
                      <span className="font-medium truncate block">{item.label}</span>
                      {item.sub && (
                        <span className="text-[10px] text-slate-400 block">{item.sub}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono capitalize shrink-0 ml-2">
                    {item.type}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigate <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[9px]">↑↓</kbd></span>
            <span>Select <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[9px]">↵</kbd></span>
          </div>
          <span>Quick Navigation</span>
        </div>
      </div>
    </div>
  );
}
