'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Account,
  Category,
  AppSettings,
  AccountBalanceSummary,
  MonthlyOverview,
  CategorySpending,
  MonthlyTrend,
  SavingsGoal,
  SavingsTransaction,
  SavingsGoalProgress,
  SavingsSummary,
  Budget,
  CategoryBudgetStatus,
  RecurringTransaction,
  InsightCardData,
} from '@/types';
import * as api from '@/lib/api';
import {
  calculateAccountBalances,
  calculateTotalBalance,
  calculateMonthlyOverview,
  calculateCategoryBreakdown,
  calculateMonthlyTrends,
  calculateSavingsGoalsProgress,
  calculateSavingsSummary,
  calculateBudgetsStatus,
  generateInsights,
  formatCurrency as utilFormatCurrency,
} from '@/lib/utils';
import { DEFAULT_SETTINGS } from '@/lib/seedData';

interface AppContextType {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  settings: AppSettings;
  accountSummaries: AccountBalanceSummary[];
  totalBalance: number;
  monthlyOverview: MonthlyOverview;
  categorySpending: CategorySpending[];
  categoryIncome: CategorySpending[];
  monthlyTrends: MonthlyTrend[];
  savingsGoals: SavingsGoal[];
  savingsTransactions: SavingsTransaction[];
  savingsGoalsProgress: SavingsGoalProgress[];
  savingsSummary: SavingsSummary;
  budgets: Budget[];
  budgetStatus: CategoryBudgetStatus[];
  recurringTransactions: RecurringTransaction[];
  insights: InsightCardData[];
  isLoading: boolean;
  isSyncing: boolean;
  syncStatus: 'pending' | 'syncing' | 'synced';
  error: string | null;

  // Transaction Modal State
  isTransactionModalOpen: boolean;
  editingTransaction: Transaction | null;
  openAddTransaction: () => void;
  openEditTransaction: (tx: Transaction) => void;
  closeTransactionModal: () => void;

  // Account Modal State
  isAccountModalOpen: boolean;
  editingAccount: Account | null;
  openAddAccount: () => void;
  openEditAccount: (account: Account) => void;
  closeAccountModal: () => void;

  // Category Modal State
  isCategoryModalOpen: boolean;
  editingCategory: Category | null;
  openAddCategory: () => void;
  openEditCategory: (category: Category) => void;
  closeCategoryModal: () => void;

  // Actions
  refreshData: () => Promise<void>;
  createTransaction: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  createTransactionsBulk: (data: (Omit<Transaction, 'id' | 'createdAt'>)[]) => Promise<Transaction[]>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;

  createAccount: (data: Omit<Account, 'id'>) => Promise<Account>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<boolean>;

  createCategory: (data: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<boolean>;

  // Savings Actions
  createSavingsGoal: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SavingsGoal>;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => Promise<SavingsGoal>;
  archiveSavingsGoal: (id: string) => Promise<SavingsGoal>;
  unarchiveSavingsGoal: (id: string) => Promise<SavingsGoal>;
  deleteSavingsGoal: (id: string) => Promise<boolean>;

  createSavingsTransaction: (data: Omit<SavingsTransaction, 'id' | 'createdAt'>) => Promise<SavingsTransaction>;
  deleteSavingsTransaction: (id: string) => Promise<boolean>;

  // Budgets Actions
  createBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Budget>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<boolean>;

  // Recurring Actions
  createRecurringTransaction: (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<RecurringTransaction>;
  updateRecurringTransaction: (id: string, data: Partial<RecurringTransaction>) => Promise<RecurringTransaction>;
  deleteRecurringTransaction: (id: string) => Promise<boolean>;

  updateSettings: (data: Partial<AppSettings>) => Promise<AppSettings>;
  formatMoney: (amount: number, options?: { showSign?: boolean; decimals?: number }) => string;
  syncBankEmails: () => Promise<{ success: boolean; importedCount: number; message: string }>;
  syncMessage: string | null;
  clearSyncMessage: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'pending' | 'syncing' | 'synced'>('synced');
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const readCachedData = useCallback(async () => {
    try {
      // Process any due recurring transactions first so transactions are current
      try {
        await api.processDueRecurringTransactions();
      } catch (e) {
        console.warn('Auto-recurring processing notice:', e);
      }

      const [txs, accs, cats, sets, goals, stxs, bdgs, recs] = await Promise.all([
        api.getTransactions(),
        api.getAccounts(),
        api.getCategories(),
        api.getSettings(),
        api.getSavingsGoals(),
        api.getSavingsTransactions(),
        api.getBudgets(),
        api.getRecurringTransactions(),
      ]);

      // Deduplicate transactions by ID and content signature
      const seen = new Set<string>();
      const dedupedTx: Transaction[] = [];
      (txs || []).forEach((t) => {
        const sig = `${t.date}_${t.type}_${t.amount}_${t.description}`;
        if (!seen.has(sig) && !seen.has(t.id)) {
          seen.add(sig);
          seen.add(t.id);
          dedupedTx.push(t);
        }
      });

      setTransactions(dedupedTx);
      setAccounts(accs || []);
      setCategories(cats || []);
      setSettings(sets || DEFAULT_SETTINGS);
      setSavingsGoals(goals || []);
      setSavingsTransactions(stxs || []);
      setBudgets(bdgs || []);
      setRecurringTransactions(recs || []);
    } catch (err: any) {
      console.error('Failed to load application data:', err);
      setError(err.message || 'Failed to fetch financial data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadAllData = useCallback(async (showSync = false) => {
    if (showSync) setIsSyncing(true);
    setError(null);
    await readCachedData();
    if (api.getCurrentAppUser()) {
      void api.syncCurrentUserData().then((synced) => {
        if (synced) void readCachedData();
      });
    }
    setIsSyncing(false);
  }, [readCachedData]);

  const refreshData = useCallback(async () => {
    await readCachedData();
    if (api.getCurrentAppUser()) {
      void api.syncCurrentUserData().then((synced) => {
        if (synced) void readCachedData();
      });
    }
  }, [readCachedData]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    const handleSyncComplete = () => { void readCachedData(); };
    window.addEventListener('expense-tracker-data-synced', handleSyncComplete);
    return () => window.removeEventListener('expense-tracker-data-synced', handleSyncComplete);
  }, [readCachedData]);

  useEffect(() => {
    const handleSyncStatus = (event: Event) => {
      setSyncStatus((event as CustomEvent<'pending' | 'syncing' | 'synced'>).detail);
    };
    window.addEventListener('expense-tracker-sync-status', handleSyncStatus);
    return () => window.removeEventListener('expense-tracker-sync-status', handleSyncStatus);
  }, []);

  // Derived calculations
  const accountSummaries = useMemo(() => {
    return calculateAccountBalances(accounts, transactions);
  }, [accounts, transactions]);

  const totalBalance = useMemo(() => {
    return calculateTotalBalance(accountSummaries);
  }, [accountSummaries]);

  const monthlyOverview = useMemo(() => {
    return calculateMonthlyOverview(transactions);
  }, [transactions]);

  const categorySpending = useMemo(() => {
    return calculateCategoryBreakdown(transactions, categories, 'expense');
  }, [transactions, categories]);

  const categoryIncome = useMemo(() => {
    return calculateCategoryBreakdown(transactions, categories, 'income');
  }, [transactions, categories]);

  const monthlyTrends = useMemo(() => {
    return calculateMonthlyTrends(transactions, 6);
  }, [transactions]);

  const savingsGoalsProgress = useMemo(() => {
    return calculateSavingsGoalsProgress(savingsGoals, savingsTransactions);
  }, [savingsGoals, savingsTransactions]);

  const savingsSummary = useMemo(() => {
    return calculateSavingsSummary(savingsGoalsProgress);
  }, [savingsGoalsProgress]);

  const budgetStatus = useMemo(() => {
    return calculateBudgetsStatus(budgets, transactions, categories);
  }, [budgets, transactions, categories]);

  const insights = useMemo(() => {
    return generateInsights(transactions, budgets, recurringTransactions, monthlyOverview);
  }, [transactions, budgets, recurringTransactions, monthlyOverview]);

  // Transaction Modal Controls
  const openAddTransaction = useCallback(() => {
    setEditingTransaction(null);
    setIsTransactionModalOpen(true);
  }, []);

  const openEditTransaction = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setIsTransactionModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  }, []);

  // Account Modal Controls
  const openAddAccount = useCallback(() => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  }, []);

  const openEditAccount = useCallback((account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setIsAccountModalOpen(false);
    setEditingAccount(null);
  }, []);

  // Category Modal Controls
  const openAddCategory = useCallback(() => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  }, []);

  const openEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
  }, []);

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  }, []);

  // CRUD Actions
  const createTransaction = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const created = await api.createTransaction(data);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const createTransactionsBulk = useCallback(async (data: (Omit<Transaction, 'id' | 'createdAt'>)[]) => {
    const created = await api.createTransactionsBulk(data);
    setTransactions((prev) => [...created, ...prev]);
    return created;
  }, []);

  const updateTransaction = useCallback(async (id: string, data: Partial<Transaction>) => {
    const updated = await api.updateTransaction(id, data);
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    const success = await api.deleteTransaction(id);
    if (success) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
    return success;
  }, []);

  const createAccount = useCallback(async (data: Omit<Account, 'id'>) => {
    const created = await api.createAccount(data);
    setAccounts((prev) => [...prev, created]);
    return created;
  }, []);

  const updateAccount = useCallback(async (id: string, data: Partial<Account>) => {
    const updated = await api.updateAccount(id, data);
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    const success = await api.deleteAccount(id);
    if (success) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    }
    return success;
  }, []);

  const createCategory = useCallback(async (data: Omit<Category, 'id'>) => {
    const created = await api.createCategory(data);
    setCategories((prev) => [...prev, created]);
    return created;
  }, []);

  const updateCategory = useCallback(async (id: string, data: Partial<Category>) => {
    const updated = await api.updateCategory(id, data);
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    const success = await api.deleteCategory(id);
    if (success) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
    }
    return success;
  }, []);

  // Savings CRUD actions
  const createSavingsGoal = useCallback(async (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await api.createSavingsGoal(data);
    setSavingsGoals((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateSavingsGoal = useCallback(async (id: string, data: Partial<SavingsGoal>) => {
    const updated = await api.updateSavingsGoal(id, data);
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  const archiveSavingsGoal = useCallback(async (id: string) => {
    const updated = await api.updateSavingsGoal(id, { status: 'archived' });
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  const unarchiveSavingsGoal = useCallback(async (id: string) => {
    const updated = await api.updateSavingsGoal(id, { status: 'active' });
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    return updated;
  }, []);

  const deleteSavingsGoal = useCallback(async (id: string) => {
    const success = await api.deleteSavingsGoal(id);
    if (success) {
      setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
      setSavingsTransactions((prev) => prev.filter((tx) => tx.goalId !== id));
    }
    return success;
  }, []);

  const createSavingsTransaction = useCallback(async (data: Omit<SavingsTransaction, 'id' | 'createdAt'>) => {
    const created = await api.createSavingsTransaction(data);
    setSavingsTransactions((prev) => [created, ...prev]);
    // Refresh goals timestamp locally
    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === data.goalId ? { ...g, updatedAt: new Date().toISOString() } : g))
    );
    return created;
  }, []);

  const deleteSavingsTransaction = useCallback(async (id: string) => {
    const target = savingsTransactions.find((tx) => tx.id === id);
    const success = await api.deleteSavingsTransaction(id);
    if (success) {
      setSavingsTransactions((prev) => prev.filter((tx) => tx.id !== id));
      if (target) {
        setSavingsGoals((prev) =>
          prev.map((g) => (g.id === target.goalId ? { ...g, updatedAt: new Date().toISOString() } : g))
        );
      }
    }
    return success;
  }, [savingsTransactions]);

  // Budgets Actions
  const createBudget = useCallback(async (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await api.createBudget(data);
    setBudgets((prev) => [...prev, created]);
    return created;
  }, []);

  const updateBudget = useCallback(async (id: string, data: Partial<Budget>) => {
    const updated = await api.updateBudget(id, data);
    setBudgets((prev) => prev.map((b) => (b.id === id ? updated : b)));
    return updated;
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    const success = await api.deleteBudget(id);
    if (success) {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    }
    return success;
  }, []);

  // Recurring Actions
  const createRecurringTransaction = useCallback(
    async (data: Omit<RecurringTransaction, 'id' | 'createdAt' | 'updatedAt'>) => {
      const created = await api.createRecurringTransaction(data);
      setRecurringTransactions((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const updateRecurringTransaction = useCallback(async (id: string, data: Partial<RecurringTransaction>) => {
    const updated = await api.updateRecurringTransaction(id, data);
    setRecurringTransactions((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const deleteRecurringTransaction = useCallback(async (id: string) => {
    const success = await api.deleteRecurringTransaction(id);
    if (success) {
      setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));
    }
    return success;
  }, []);

  const updateSettings = useCallback(async (data: Partial<AppSettings>) => {
    const updated = await api.updateSettings(data);
    setSettings(updated);
    return updated;
  }, []);

  const formatMoney = useCallback(
    (amount: number, options?: { showSign?: boolean; decimals?: number }) => {
      return utilFormatCurrency(
        amount,
        settings.currencySymbol || 'Rs.',
        settings.currencyPosition || 'prefix',
        options
      );
    },
    [settings.currencySymbol, settings.currencyPosition]
  );

  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const clearSyncMessage = useCallback(() => {
    setSyncMessage(null);
  }, []);

  const syncBankEmails = useCallback(async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncBankEmails();
      if (res.success) {
        setSyncMessage(res.message);
        await loadAllData(false);
      } else {
        setSyncMessage(res.message || 'Could not sync bank emails');
      }
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, [loadAllData]);

  return (
    <AppContext.Provider
      value={{
        transactions,
        accounts,
        categories,
        settings,
        accountSummaries,
        totalBalance,
        monthlyOverview,
        categorySpending,
        categoryIncome,
        monthlyTrends,
        savingsGoals,
        savingsTransactions,
        savingsGoalsProgress,
        savingsSummary,
        budgets,
        budgetStatus,
        recurringTransactions,
        insights,
        isLoading,
        isSyncing,
        syncStatus,
        error,

        isTransactionModalOpen,
        editingTransaction,
        openAddTransaction,
        openEditTransaction,
        closeTransactionModal,

        isAccountModalOpen,
        editingAccount,
        openAddAccount,
        openEditAccount,
        closeAccountModal,

        isCategoryModalOpen,
        editingCategory,
        openAddCategory,
        openEditCategory,
        closeCategoryModal,

        refreshData,
        createTransaction,
        createTransactionsBulk,
        updateTransaction,
        deleteTransaction,

        createAccount,
        updateAccount,
        deleteAccount,

        createCategory,
        updateCategory,
        deleteCategory,

        createSavingsGoal,
        updateSavingsGoal,
        archiveSavingsGoal,
        unarchiveSavingsGoal,
        deleteSavingsGoal,

        createSavingsTransaction,
        deleteSavingsTransaction,

        createBudget,
        updateBudget,
        deleteBudget,

        createRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,

        updateSettings,
        formatMoney,
        syncBankEmails,
        syncMessage,
        clearSyncMessage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
