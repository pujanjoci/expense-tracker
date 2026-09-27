import { Account, Category, Transaction, AppSettings } from '@/types';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'NPR',
  currencySymbol: 'Rs.',
  currencyPosition: 'prefix',
  dateFormat: 'dd MMM yyyy',
};

// Only the active accounts used by the user: Nabil Bank & eSewa (with 0 opening balances)
export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Nabil Bank (Savings)',
    type: 'bank',
    openingBalance: 0,
    currency: 'NPR',
    active: true,
  },
  {
    id: 'acc-2',
    name: 'eSewa',
    type: 'wallet',
    openingBalance: 0,
    currency: 'NPR',
    active: true,
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  // Income
  {
    id: 'cat-inc-1',
    name: 'Salary',
    type: 'income',
    icon: 'BriefcaseBusiness',
    active: true,
  },
  {
    id: 'cat-inc-2',
    name: 'Freelance & Consulting',
    type: 'income',
    icon: 'Laptop',
    active: true,
  },
  {
    id: 'cat-inc-3',
    name: 'Investments & Dividends',
    type: 'income',
    icon: 'TrendingUp',
    active: true,
  },
  {
    id: 'cat-inc-4',
    name: 'Gifts & Rewards',
    type: 'income',
    icon: 'Gift',
    active: true,
  },
  {
    id: 'cat-inc-5',
    name: 'Other Income',
    type: 'income',
    icon: 'CircleDollarSign',
    active: true,
  },

  // Expenses
  {
    id: 'cat-exp-1',
    name: 'Food & Dining',
    type: 'expense',
    icon: 'Utensils',
    active: true,
  },
  {
    id: 'cat-exp-2',
    name: 'Groceries',
    type: 'expense',
    icon: 'Store',
    active: true,
  },
  {
    id: 'cat-exp-3',
    name: 'Transportation',
    type: 'expense',
    icon: 'Car',
    active: true,
  },
  {
    id: 'cat-exp-4',
    name: 'Fuel & Petrol',
    type: 'expense',
    icon: 'Fuel',
    active: true,
  },
  {
    id: 'cat-exp-5',
    name: 'Housing & Rent',
    type: 'expense',
    icon: 'Home',
    active: true,
  },
  {
    id: 'cat-exp-6',
    name: 'Utilities & Bills',
    type: 'expense',
    icon: 'Zap',
    active: true,
  },
  {
    id: 'cat-exp-7',
    name: 'Internet & WiFi',
    type: 'expense',
    icon: 'Wifi',
    active: true,
  },
  {
    id: 'cat-exp-8',
    name: 'Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    active: true,
  },
  {
    id: 'cat-exp-9',
    name: 'Healthcare & Medicine',
    type: 'expense',
    icon: 'HeartPulse',
    active: true,
  },
  {
    id: 'cat-exp-10',
    name: 'Entertainment & Subscriptions',
    type: 'expense',
    icon: 'Film',
    active: true,
  },
];

// Clean transactions array - real transactions only
export const INITIAL_TRANSACTIONS: Transaction[] = [];
