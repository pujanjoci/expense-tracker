import { Transaction, Account, Category, AppSettings, ApiResponse } from '@/types';
import { INITIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_TRANSACTIONS, DEFAULT_SETTINGS } from './seedData';

const LOCAL_STORAGE_KEYS = {
  TRANSACTIONS: 'expense_tracker_transactions',
  ACCOUNTS: 'expense_tracker_accounts',
  CATEGORIES: 'expense_tracker_categories',
  SETTINGS: 'expense_tracker_settings',
  SHEETS_URL: 'expense_tracker_sheets_url',
  APP_USER: 'expense_tracker_app_user',
  DIRTY: 'expense_tracker_sync_dirty',
};

let isApplyingRemoteData = false;
let backgroundSyncTimer: ReturnType<typeof setTimeout> | null = null;

function publishSyncStatus(status: 'pending' | 'syncing' | 'synced') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('expense-tracker-sync-status', { detail: status }));
  }
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'user' | 'guest';
  avatar?: string;
  avatarPreset?: string;
  banner?: string;
  theme?: string;
  bio?: string;
}

export const LOCAL_GUEST_USER: AppUser = {
  id: 'local_guest',
  name: 'Local User',
  email: 'local@device',
  role: 'guest',
};

interface StoredAppUser {
  user: AppUser;
  sessionToken: string;
}

function getStoredAppUser(): StoredAppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.APP_USER);
    return raw ? JSON.parse(raw) as StoredAppUser : null;
  } catch {
    return null;
  }
}

export function getCurrentAppUser(): AppUser | null {
  return getStoredAppUser()?.user || null;
}

export function isGuestUser(): boolean {
  const user = getCurrentAppUser();
  return user?.role === 'guest' || user?.id === 'local_guest';
}

export function updateUserProfile(updates: Partial<AppUser>): AppUser | null {
  if (typeof window === 'undefined') return null;
  const stored = getStoredAppUser();
  const current = stored?.user || getCurrentAppUser();
  if (!current) return null;

  const newName = updates.name !== undefined ? updates.name.trim() : current.name;
  const updatedUser: AppUser = {
    ...current,
    ...updates,
    name: newName || current.name,
  };

  localStorage.setItem(LOCAL_STORAGE_KEYS.APP_USER, JSON.stringify({
    user: updatedUser,
    sessionToken: stored?.sessionToken || '',
  } satisfies StoredAppUser));

  if (updatedUser.name) {
    localStorage.setItem('username', updatedUser.name);
  }

  window.dispatchEvent(new CustomEvent('expense-tracker-user-updated', { detail: updatedUser }));
  return updatedUser;
}

export function setLocalGuestUser(name?: string): AppUser {
  let chosenName = name?.trim();
  if (!chosenName && typeof window !== 'undefined') {
    chosenName = localStorage.getItem('username') || undefined;
  }
  if (!chosenName) {
    chosenName = LOCAL_GUEST_USER.name;
  }

  const guestUser: AppUser = {
    ...LOCAL_GUEST_USER,
    name: chosenName,
    email: chosenName ? `${chosenName.toLowerCase().replace(/[^a-z0-9]/g, '')}@device` : 'local@device',
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('username', chosenName);
    localStorage.setItem(LOCAL_STORAGE_KEYS.APP_USER, JSON.stringify({
      user: guestUser,
      sessionToken: '',
    } satisfies StoredAppUser));
  }
  return guestUser;
}

function scopedStorageKey(key: string): string {
  if (key === LOCAL_STORAGE_KEYS.SHEETS_URL || key === LOCAL_STORAGE_KEYS.APP_USER) return key;
  const user = getCurrentAppUser();
  if (user && user.role !== 'guest') {
    return `${key}_${user.id}`;
  }
  return key;
}

// This is a shared public service endpoint. Every data action also requires an
// authenticated per-user session token; the URL itself is not a secret.
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
    const item = localStorage.getItem(scopedStorageKey(key));
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(scopedStorageKey(key), JSON.stringify(value));
    if (!isApplyingRemoteData && getCurrentAppUser() && !isGuestUser()) {
      localStorage.setItem(scopedStorageKey(LOCAL_STORAGE_KEYS.DIRTY), 'true');
      publishSyncStatus('pending');
      scheduleBackgroundSync();
    }
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage:`, e);
  }
}

// Initialize Local Storage & Purge Any Legacy Placeholder Data
export function initLocalData() {
  if (typeof window === 'undefined') return;

  // Detect and purge old mock dummy transactions (e.g. tx-1, tx-2, Dinner with colleagues, etc.)
  const cachedTx = localStorage.getItem(scopedStorageKey(LOCAL_STORAGE_KEYS.TRANSACTIONS));
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

  if (!localStorage.getItem(scopedStorageKey(LOCAL_STORAGE_KEYS.ACCOUNTS))) {
    setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
  }
  if (!localStorage.getItem(scopedStorageKey(LOCAL_STORAGE_KEYS.CATEGORIES))) {
    setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }
  if (!localStorage.getItem(scopedStorageKey(LOCAL_STORAGE_KEYS.TRANSACTIONS))) {
    setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  }
  if (!localStorage.getItem(scopedStorageKey(LOCAL_STORAGE_KEYS.SETTINGS))) {
    setLocalItem(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
}

// Remote API caller
async function callGoogleScriptApi<T>(action: string, payload?: any): Promise<ApiResponse<T>> {
  const url = getGoogleAppsScriptUrl();
  if (!url) {
    throw new Error('Google Apps Script URL not configured');
  }

  if (!['registerUser', 'login', 'syncUserData', 'syncBankEmails', 'logout', 'ping'].includes(action)) {
    return { success: false, error: 'This legacy API action is disabled.' };
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

function createInitialUserData() {
  return {
    transactions: INITIAL_TRANSACTIONS,
    accounts: INITIAL_ACCOUNTS,
    categories: INITIAL_CATEGORIES,
    settings: DEFAULT_SETTINGS,
  };
}

function applyRemoteUserData(data: any) {
  if (!data) return;
  isApplyingRemoteData = true;
  try {
    setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, Array.isArray(data.transactions) ? data.transactions : []);
    setLocalItem(LOCAL_STORAGE_KEYS.ACCOUNTS, Array.isArray(data.accounts) ? data.accounts : INITIAL_ACCOUNTS);
    setLocalItem(LOCAL_STORAGE_KEYS.CATEGORIES, Array.isArray(data.categories) ? data.categories : INITIAL_CATEGORIES);
    setLocalItem(LOCAL_STORAGE_KEYS.SETTINGS, { ...DEFAULT_SETTINGS, ...(data.settings || {}) });
    const dirtyKey = scopedStorageKey(LOCAL_STORAGE_KEYS.DIRTY);
    localStorage.removeItem(dirtyKey);
  } finally {
    isApplyingRemoteData = false;
  }
}

async function storeAuthenticatedUser(result: ApiResponse<{ user: AppUser; sessionToken: string; userData: any }>) {
  if (!result.success || !result.data) return { success: false, error: result.error || 'Could not sign in.' };

  localStorage.setItem(LOCAL_STORAGE_KEYS.APP_USER, JSON.stringify({
    user: result.data.user,
    sessionToken: result.data.sessionToken,
  } satisfies StoredAppUser));
  applyRemoteUserData(result.data.userData);
  return { success: true, user: result.data.user };
}

export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const result = await callGoogleScriptApi<{ user: AppUser; sessionToken: string; userData: any }>('login', {
    email: email.trim(),
    password,
    initialData: createInitialUserData(),
  });
  return storeAuthenticatedUser(result);
}

export interface LocalOfflineDataSummary {
  hasData: boolean;
  transactionCount: number;
  data: {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    settings: AppSettings;
  };
}

export function getLocalOfflineDataSummary(): LocalOfflineDataSummary {
  if (typeof window === 'undefined') {
    return {
      hasData: false,
      transactionCount: 0,
      data: {
        transactions: [],
        accounts: INITIAL_ACCOUNTS,
        categories: INITIAL_CATEGORIES,
        settings: DEFAULT_SETTINGS,
      },
    };
  }

  try {
    const rawTx = localStorage.getItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
    const rawAcc = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCOUNTS);
    const rawCat = localStorage.getItem(LOCAL_STORAGE_KEYS.CATEGORIES);
    const rawSet = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);

    const transactions: Transaction[] = rawTx ? JSON.parse(rawTx) : [];
    const accounts: Account[] = rawAcc ? JSON.parse(rawAcc) : INITIAL_ACCOUNTS;
    const categories: Category[] = rawCat ? JSON.parse(rawCat) : INITIAL_CATEGORIES;
    const settings: AppSettings = rawSet ? JSON.parse(rawSet) : DEFAULT_SETTINGS;

    const txList = Array.isArray(transactions) ? transactions : [];
    const accList = Array.isArray(accounts) ? accounts : INITIAL_ACCOUNTS;
    const catList = Array.isArray(categories) ? categories : INITIAL_CATEGORIES;

    const hasData = txList.length > 0 || accList.length > INITIAL_ACCOUNTS.length || catList.length > INITIAL_CATEGORIES.length;

    return {
      hasData,
      transactionCount: txList.length,
      data: {
        transactions: txList,
        accounts: accList,
        categories: catList,
        settings: settings || DEFAULT_SETTINGS,
      },
    };
  } catch {
    return {
      hasData: false,
      transactionCount: 0,
      data: {
        transactions: [],
        accounts: INITIAL_ACCOUNTS,
        categories: INITIAL_CATEGORIES,
        settings: DEFAULT_SETTINGS,
      },
    };
  }
}

export function clearLocalOfflineData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCOUNTS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SETTINGS);
  } catch {
    // Ignore storage errors
  }
}

export async function registerUser(
  email: string,
  name: string,
  password: string,
  customInitialData?: {
    transactions?: Transaction[];
    accounts?: Account[];
    categories?: Category[];
    settings?: AppSettings;
  }
): Promise<{ success: boolean; user?: AppUser; error?: string }> {
  const initialData = customInitialData || createInitialUserData();
  const result = await callGoogleScriptApi<{ user: AppUser; sessionToken: string; userData: any }>('registerUser', {
    email: email.trim(),
    name: name.trim(),
    password,
    initialData,
  });

  const stored = await storeAuthenticatedUser(result);
  if (stored.success && customInitialData) {
    clearLocalOfflineData();
  }
  return stored;
}

export async function signOutUser() {
  if (typeof window === 'undefined') return;
  const currentUser = getStoredAppUser();
  try {
    if (currentUser) await callGoogleScriptApi('logout', { sessionToken: currentUser.sessionToken });
  } catch {
    // Local sign-out still works when the sync service is unavailable.
  } finally {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.APP_USER);
    window.location.reload();
  }
}

export async function syncCurrentUserData(direction?: 'pull' | 'push'): Promise<boolean> {
  const currentUser = getStoredAppUser();
  if (!currentUser || isGuestUser() || !currentUser.sessionToken || !getGoogleAppsScriptUrl()) {
    publishSyncStatus('synced');
    return false;
  }
  publishSyncStatus('syncing');
  const dirtyKey = scopedStorageKey(LOCAL_STORAGE_KEYS.DIRTY);
  const syncDirection = direction || (localStorage.getItem(dirtyKey) === 'true' ? 'push' : 'pull');
  const userData = {
    transactions: getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []),
    accounts: getLocalItem<Account[]>(LOCAL_STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS),
    categories: getLocalItem<Category[]>(LOCAL_STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES),
    settings: getLocalItem<AppSettings>(LOCAL_STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  };
  const result = await callGoogleScriptApi<{ userData: any }>('syncUserData', {
    sessionToken: currentUser.sessionToken,
    direction: syncDirection,
    userData: syncDirection === 'push' ? userData : undefined,
  });
  if (!result.success || !result.data) {
    publishSyncStatus('pending');
    return false;
  }
  applyRemoteUserData(result.data.userData);
  publishSyncStatus('synced');
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('expense-tracker-data-synced'));
  return true;
}

function scheduleBackgroundSync() {
  if (typeof window === 'undefined' || !getCurrentAppUser() || isGuestUser()) return;
  if (backgroundSyncTimer) clearTimeout(backgroundSyncTimer);
  backgroundSyncTimer = setTimeout(() => {
    backgroundSyncTimer = null;
    void syncCurrentUserData('push');
  }, 700);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { if (!isGuestUser()) void syncCurrentUserData(); });
  window.addEventListener('focus', () => { if (!isGuestUser()) void syncCurrentUserData(); });
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

export async function createTransactionsBulk(
  txs: (Omit<Transaction, 'id' | 'createdAt'> & { id?: string; createdAt?: string })[]
): Promise<Transaction[]> {
  const current = getLocalItem<Transaction[]>(LOCAL_STORAGE_KEYS.TRANSACTIONS, []);
  const newItems: Transaction[] = txs.map((tx, idx) => ({
    ...tx,
    id: tx.id || `tx-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    createdAt: tx.createdAt || new Date().toISOString(),
  }));
  const updated = [...newItems, ...current];
  setLocalItem(LOCAL_STORAGE_KEYS.TRANSACTIONS, updated);
  return newItems;
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
  if (isGuestUser()) {
    return { success: false, importedCount: 0, message: 'Bank email scanning requires signing in with Google Sheets backend.' };
  }
  const gasUrl = getGoogleAppsScriptUrl();
  if (!gasUrl) {
    return { success: false, importedCount: 0, message: 'Google Apps Script URL is not configured' };
  }

  try {
    await syncCurrentUserData('push');
    const storedUser = getStoredAppUser();
    const res = await callGoogleScriptApi<{ importedCount: number; skippedCount: number; transactions: Transaction[] }>(
      'syncBankEmails',
      { sessionToken: storedUser?.sessionToken }
    );
    if (res.success && res.data) {
      await syncCurrentUserData('pull');
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
