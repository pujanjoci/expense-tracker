import { Transaction, Account, Category, AppSettings, ApiResponse } from '@/types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, DEFAULT_SETTINGS } from './seedData';

const LOCAL_STORAGE_KEYS = {
  TRANSACTIONS: 'expense_tracker_transactions',
  ACCOUNTS: 'expense_tracker_accounts',
  CATEGORIES: 'expense_tracker_categories',
  SETTINGS: 'expense_tracker_settings',
  SHEETS_URL: 'expense_tracker_sheets_url',
};

// Helper to get configured Google Apps Script URL from env or localStorage
export function getGoogleAppsScriptUrl(): string {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(LOCAL_STORAGE_KEYS.SHEETS_URL);
    if (customUrl && customUrl.trim() !== '') return customUrl.trim();
  }
  return process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL || '';
}

export function setGoogleAppsScriptUrl(url: string) {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '') {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.SHEETS_URL);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SHEETS_URL, url.trim());
    }
  }
}

// Local Storage Fallback Helpers
function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage:`, e);
  }
}

// Initialize Local Storage & Purge Any Legacy Placeholder Data
export function initLocalData() {
  if (typeof window === 'undefined') return;

  // Detect and purge old mock dummy transactions (e.g. tx-1, tx-2, Dinner with colleagues, etc.)
  const cachedTx = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
  if (cachedTx) {
    try {
      const parsed: any[] = JSON.parse(cachedTx);
      if (Array.isArray(parsed)) {
        const hasLegacyMock = parsed.some(
          (t) =>
            t.id === 'tx-1' ||
            t.id === 'tx-2' ||
            t.id === 'tx-3' ||
            t.id === 'tx-4' ||
            t.id === 'tx-12' ||
            t.description === 'Dinner with colleagues' ||
            t.description === 'Apartment monthly rent' ||
            t.description === 'Monthly Salary - Tech Corp' ||
            t.description === 'Bhatbhateni supermarket groceries'
        );
        if (hasLegacyMock) {
          // Remove mock transactions, keeping only real ones (or empty array)
          const clean = parsed.filter(
            (t) =>
              t.id !== 'tx-1' &&
              t.id !== 'tx-2' &&
              t.id !== 'tx-3' &&
              t.id !== 'tx-4' &&
              t.id !== 'tx-5' &&
              t.id !== 'tx-6' &&
              t.id !== 'tx-7' &&
              t.id !== 'tx-8' &&
              t.id !== 'tx-9' &&
              t.id !== 'tx-10' &&
              t.id !== 'tx-11' &&
              t.id !== 'tx-12' &&
              t.id !== 'tx-13' &&
              t.id !== 'tx-14' &&
              t.id !== 'tx-15' &&
              t.id !== 'tx-16' &&
              t.id !== 'tx-17' &&
              t.id !== 'tx-18' &&
              t.description !== 'Dinner with colleagues' &&
              t.description !== 'Apartment monthly rent' &&
              t.description !== 'Monthly Salary - Tech Corp'
          );
          setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, clean);
        }
      }
    } catch (e) {
      setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
    }
  }

  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.ACCOUNTS)) {
    setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES)) {
    setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS)) {
    setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  }
  if (!localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS)) {
    setLocalItem(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
}

// Remote API caller
async function callGoogleScriptApi<T>(action: string, payload?: any): Promise<ApiResponse<T>> {
  const url = getGoogleAppsScriptUrl();
  if (!url) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    // For reads (GET) or when payload is small
    if (!payload || Object.keys(payload).length === 0) {
      const fetchUrl = `${url}?action=${encodeURIComponent(action)}&t=${Date.now()}`;
      const res = await fetch(fetchUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json();
      return data;
    }

    // For writes (POST)
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error(`Google Apps Script API Error [${action}]:`, err);
    return {
      success: false,
      error: err.message || 'Network request to Google Apps Script failed',
    };
  }
}

// ==================== TRANSACTIONS API ====================

export async function getTransactions(): Promise<Transaction[]> {
  initLocalData();
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Transaction[]>('getTransactions');
      if (res.success && Array.isArray(res.data)) {
        setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Failed to fetch transactions from Google Sheets, using local cache:', e);
    }
  }

  return getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
}

export async function createTransaction(
  transaction: Omit<Transaction, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): Promise<Transaction> {
  const newTx: Transaction = {
    ...transaction,
    id: transaction.id || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: transaction.createdAt || new Date().toISOString(),
  };

  const gasUrl = getGoogleAppsScriptUrl();
  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Transaction>('createTransaction', { transaction: newTx });
      if (res.success && res.data) {
        const current = getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
        setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, [res.data, ...current]);
        return res.data;
      }
    } catch (e) {
      console.warn('Google Sheets create transaction failed, saving locally:', e);
    }
  }

  // Local write
  const current = getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  const updated = [newTx, ...current];
  setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, updated);
  return newTx;
}

export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Transaction>('updateTransaction', { id, transaction: updates });
      if (res.success && res.data) {
        const current = getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
        const updatedList = current.map((t) => (t.id === id ? { ...t, ...res.data } : t));
        setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, updatedList);
        return res.data;
      }
    } catch (e) {
      console.warn('Google Sheets update transaction failed, updating locally:', e);
    }
  }

  const current = getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  let updatedTx: Transaction | null = null;
  const updatedList = current.map((t) => {
    if (t.id === id) {
      updatedTx = { ...t, ...updates };
      return updatedTx;
    }
    return t;
  });

  if (!updatedTx) throw new Error(`Transaction ${id} not found`);
  setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, updatedList);
  return updatedTx;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<{ id: string }>('deleteTransaction', { id });
      if (res.success) {
        const current = getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
        setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, current.filter((t) => t.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Google Sheets delete transaction failed, deleting locally:', e);
    }
  }

  const current = getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  const updatedList = current.filter((t) => t.id !== id);
  setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, updatedList);
  return true;
}

// ==================== ACCOUNTS API ====================

export async function getAccounts(): Promise<Account[]> {
  initLocalData();
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Account[]>('getAccounts');
      if (res.success && Array.isArray(res.data)) {
        setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Failed to fetch accounts from Google Sheets, using local cache:', e);
    }
  }

  return getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
}

export async function createAccount(
  account: Omit<Account, 'id'> & { id?: string }
): Promise<Account> {
  const newAccount: Account = {
    ...account,
    id: account.id || `acc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    active: account.active !== undefined ? account.active : true,
  };

  const gasUrl = getGoogleAppsScriptUrl();
  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Account>('createAccount', { account: newAccount });
      if (res.success && res.data) {
        const current = getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, []);
        setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, [...current, res.data]);
        return res.data;
      }
    } catch (e) {
      console.warn('Google Sheets create account failed, saving locally:', e);
    }
  }

  const current = getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  const updated = [...current, newAccount];
  setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, updated);
  return newAccount;
}

export async function updateAccount(id: string, updates: Partial<Account>): Promise<Account> {
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Account>('updateAccount', { id, account: updates });
      if (res.success && res.data) {
        const current = getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, []);
        const updatedList = current.map((a) => (a.id === id ? { ...a, ...res.data } : a));
        setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, updatedList);
        return res.data;
      }
    } catch (e) {
      console.warn('Google Sheets update account failed, updating locally:', e);
    }
  }

  const current = getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  let updatedAcc: Account | null = null;
  const updatedList = current.map((a) => {
    if (a.id === id) {
      updatedAcc = { ...a, ...updates };
      return updatedAcc;
    }
    return a;
  });

  if (!updatedAcc) throw new Error(`Account ${id} not found`);
  setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, updatedList);
  return updatedAcc;
}

export async function deleteAccount(id: string): Promise<boolean> {
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<{ id: string }>('deleteAccount', { id });
      if (res.success) {
        const current = getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, []);
        setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, current.filter((a) => a.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Google Sheets delete account failed, deleting locally:', e);
    }
  }

  const current = getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  const updatedList = current.filter((a) => a.id !== id);
  setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, updatedList);
  return true;
}

// ==================== CATEGORIES API ====================

export async function getCategories(): Promise<Category[]> {
  initLocalData();
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Category[]>('getCategories');
      if (res.success && Array.isArray(res.data)) {
        setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, res.data);
        return res.data;
      }
    } catch (e) {
      console.warn('Failed to fetch categories from Google Sheets, using local cache:', e);
    }
  }

  return getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
}

export async function createCategory(
  category: Omit<Category, 'id'> & { id?: string }
): Promise<Category> {
  const newCat: Category = {
    ...category,
    id: category.id || `cat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    active: category.active !== undefined ? category.active : true,
  };

  const gasUrl = getGoogleAppsScriptUrl();
  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Category>('createCategory', { category: newCat });
      if (res.success && res.data) {
        const current = getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, []);
        setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, [...current, res.data]);
        return res.data;
      }
    } catch (e) {
      console.warn('Google Sheets create category failed, saving locally:', e);
    }
  }

  const current = getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const updated = [...current, newCat];
  setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, updated);
  return newCat;
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<Category>('updateCategory', { id, category: updates });
      if (res.success && res.data) {
        const current = getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, []);
        const updatedList = current.map((c) => (c.id === id ? { ...c, ...res.data } : c));
        setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, updatedList);
        return res.data;
      }
    } catch (e) {
      console.warn('Google Sheets update category failed, updating locally:', e);
    }
  }

  const current = getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  let updatedCat: Category | null = null;
  const updatedList = current.map((c) => {
    if (c.id === id) {
      updatedCat = { ...c, ...updates };
      return updatedCat;
    }
    return c;
  });

  if (!updatedCat) throw new Error(`Category ${id} not found`);
  setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, updatedList);
  return updatedCat;
}

export async function deleteCategory(id: string): Promise<boolean> {
  const gasUrl = getGoogleAppsScriptUrl();

  if (gasUrl) {
    try {
      const res = await callGoogleScriptApi<{ id: string }>('deleteCategory', { id });
      if (res.success) {
        const current = getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, []);
        setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, current.filter((c) => c.id !== id));
        return true;
      }
    } catch (e) {
      console.warn('Google Sheets delete category failed, deleting locally:', e);
    }
  }

  const current = getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  const updatedList = current.filter((c) => c.id !== id);
  setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, updatedList);
  return true;
}

// ==================== SETTINGS & SHEET INIT ====================

export async function getSettings(): Promise<AppSettings> {
  initLocalData();
  const settings = getLocalItem<AppSettings>(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  return {
    ...settings,
    googleSheetsUrl: getGoogleAppsScriptUrl(),
  };
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = getLocalItem<AppSettings>(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const updated = { ...current, ...settings };
  setLocalItem(LOCAL_STORAGE_KEYS.SETTINGS, updated);

  if (settings.googleSheetsUrl !== undefined) {
    setGoogleAppsScriptUrl(settings.googleSheetsUrl);
  }

  return updated;
}

export async function testGoogleScriptConnection(url: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${url}?action=ping&t=${Date.now()}`, {
      method: 'GET',
    });
    const data = await res.json();
    if (data.success) {
      return { success: true, message: 'Successfully connected to Google Apps Script Web App!' };
    }
    return { success: false, message: data.error || 'Connected but received error response' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to connect. Check URL and Web App permissions.' };
  }
}

export async function resetToDefaultSeedData(): Promise<void> {
  if (typeof window === 'undefined') return;
  setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  setLocalItem(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export async function syncBankEmails(): Promise<{ success: boolean; importedCount: number; message: string }> {
  const gasUrl = getGoogleAppsScriptUrl();
  if (!gasUrl) {
    return { success: false, importedCount: 0, message: 'Google Apps Script URL is not configured' };
  }

  try {
    const res = await callGoogleScriptApi<{ importedCount: number; skippedCount: number; transactions: Transaction[] }>('syncBankEmails');
    if (res.success && res.data) {
      return {
        success: true,
        importedCount: res.data.importedCount,
        message: `Successfully imported ${res.data.importedCount} new bank transactions (${res.data.skippedCount} already processed).`,
      };
    }
    return {
      success: false,
      importedCount: 0,
      message: res.error || 'Failed to sync bank emails.',
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      message: err.message || 'Error communicating with Google Apps Script.',
    };
  }
}
