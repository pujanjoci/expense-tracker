export type TransactionType = 'income' | 'expense' | 'transfer';

export type AccountType = 'bank' | 'cash' | 'wallet' | 'other';

export type CategoryType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  accountId: string;
  categoryId?: string;
  amount: number;
  description: string;
  transferToAccountId?: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  currency: string;
  active: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon: string; // Lucide icon name
  active: boolean;
}

export interface AppSettings {
  currency: string; // e.g. 'NPR'
  currencySymbol: string; // e.g. 'Rs.'
  currencyPosition: 'prefix' | 'suffix';
  dateFormat: string;
  googleSheetsUrl?: string;
}

export interface AccountBalanceSummary extends Account {
  currentBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalTransferIn: number;
  totalTransferOut: number;
  transactionCount: number;
}

export interface MonthlyOverview {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  incomeChangePercentage?: number;
  expenseChangePercentage?: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  icon: string;
  type: CategoryType;
  total: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyTrend {
  month: string; // 'Jan', 'Feb', etc. or 'YYYY-MM'
  monthLabel: string; // 'Jan 2026'
  income: number;
  expense: number;
  net: number;
}

export type AnalyticsPeriod = 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'all' | 'custom';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
