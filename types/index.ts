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
  tags?: string[];
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

export type AnalyticsPeriod = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months' | 'this-year' | 'all' | 'custom';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export type GoalStatus = 'active' | 'completed' | 'archived';

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  initialAmount: number;
  targetDate?: string; // YYYY-MM-DD
  description?: string;
  icon?: string; // Lucide icon name
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  status: GoalStatus;
}

export type SavingsTransactionType = 'deposit' | 'withdraw';

export interface SavingsTransaction {
  id: string;
  goalId: string;
  type: SavingsTransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  accountId?: string;
  createdAt: string; // ISO date string
}

export interface SavingsGoalProgress extends SavingsGoal {
  currentSaved: number;
  remainingAmount: number;
  progressPercentage: number;
  computedStatus: GoalStatus;
  totalDeposited: number;
  totalWithdrawn: number;
  transactionCount: number;
}

export interface SavingsSummary {
  totalSaved: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  archivedGoalsCount: number;
  combinedTarget: number;
  remainingToTarget: number;
  overallProgressPercentage: number;
}

// ================= BUDGETS =================
export interface Budget {
  id: string;
  category: string; // Category name or ID
  monthlyLimit: number;
  month: string; // YYYY-MM
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudgetStatus {
  budget: Budget;
  categoryName: string;
  icon: string;
  monthlyLimit: number;
  currentSpent: number;
  remaining: number;
  percentage: number;
  isWarning: boolean; // >= 80%
  isOverBudget: boolean; // >= 100%
}

// ================= RECURRING & SUBSCRIPTIONS =================
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category?: string;
  account: string;
  frequency: RecurringFrequency;
  nextDueDate: string; // YYYY-MM-DD
  lastGeneratedDate?: string; // YYYY-MM-DD
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ================= INSIGHTS =================
export interface InsightCardData {
  id: string;
  type: 'increase' | 'decrease' | 'milestone' | 'warning' | 'tip';
  title: string;
  description: string;
  metric?: string;
  category?: string;
  dismissed?: boolean;
}


