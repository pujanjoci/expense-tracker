import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Account, Transaction, AccountBalanceSummary, MonthlyOverview, Category, CategorySpending, MonthlyTrend } from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfYear, endOfYear } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parse any numerical value (handles strings with commas like "1,550.00", currency prefixes, numbers)
 */
export function parseAmountSafe(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '').replace(/[^0-9.-]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * Safely parse any date value into a valid JS Date object
 * Handles: "2026-09-27", "2026-09-27 11:40", "2026-09-27T11:40:00.000Z", Date objects, timestamps
 */
export function parseDateSafe(dateInput: any): Date {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? new Date() : dateInput;
  }

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return new Date();

    // 1. If standard YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
    const isoReady = trimmed.replace(' ', 'T');
    try {
      const parsed = parseISO(isoReady);
      if (!isNaN(parsed.getTime())) return parsed;
    } catch {}

    // 2. Try direct Date parsing
    try {
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) return d;
    } catch {}

    // 3. Match YYYY-MM-DD
    const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const d = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      if (!isNaN(d.getTime())) return d;
    }
  }

  return new Date();
}

export function formatCurrency(
  amount: number,
  currencySymbol = 'Rs.',
  currencyPosition: 'prefix' | 'suffix' = 'prefix',
  options?: { showSign?: boolean; decimals?: number }
): string {
  const safeAmount = parseAmountSafe(amount);
  const decimals = options?.decimals !== undefined ? options.decimals : 0;
  const isNegative = safeAmount < 0;
  const absoluteAmount = Math.abs(safeAmount);

  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absoluteAmount);

  let formatted = '';
  if (currencyPosition === 'prefix') {
    formatted = `${currencySymbol} ${formattedNumber}`;
  } else {
    formatted = `${formattedNumber} ${currencySymbol}`;
  }

  if (options?.showSign) {
    if (isNegative) return `- ${formatted}`;
    if (safeAmount > 0) return `+ ${formatted}`;
    return formatted;
  }

  return isNegative ? `-${formatted}` : formatted;
}

export function formatDate(dateString: any, formatStr = 'dd MMM yyyy'): string {
  try {
    if (!dateString) return '';
    const date = parseDateSafe(dateString);
    return format(date, formatStr);
  } catch {
    return String(dateString || '');
  }
}

export function formatShortDate(dateString: any): string {
  return formatDate(dateString, 'dd MMM');
}

/**
 * Calculates dynamic account balances based on:
 * openingBalance + income - expenses + (transfers in) - (transfers out)
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): AccountBalanceSummary[] {
  return accounts.map((account) => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransferIn = 0;
    let totalTransferOut = 0;
    let transactionCount = 0;

    transactions.forEach((tx) => {
      const amount = parseAmountSafe(tx.amount);

      if (tx.accountId === account.id) {
        transactionCount++;
        if (tx.type === 'income') {
          totalIncome += amount;
        } else if (tx.type === 'expense') {
          totalExpense += amount;
        } else if (tx.type === 'transfer') {
          totalTransferOut += amount;
        }
      }

      // If this account is the destination of a transfer
      if (tx.type === 'transfer' && tx.transferToAccountId === account.id) {
        transactionCount++;
        totalTransferIn += amount;
      }
    });

    const opening = parseAmountSafe(account.openingBalance);
    const currentBalance = opening + totalIncome - totalExpense + totalTransferIn - totalTransferOut;

    return {
      ...account,
      currentBalance,
      totalIncome,
      totalExpense,
      totalTransferIn,
      totalTransferOut,
      transactionCount,
    };
  });
}

/**
 * Calculates total balance across all active accounts
 */
export function calculateTotalBalance(accountSummaries: AccountBalanceSummary[]): number {
  return accountSummaries
    .filter((acc) => acc.active)
    .reduce((sum, acc) => sum + parseAmountSafe(acc.currentBalance), 0);
}

/**
 * Calculates monthly overview (Income, Expenses, Remaining, Savings Rate, Month-over-Month changes)
 */
export function calculateMonthlyOverview(
  transactions: Transaction[],
  targetDate: Date = new Date()
): MonthlyOverview {
  const currentMonthStart = startOfMonth(targetDate);
  const currentMonthEnd = endOfMonth(targetDate);

  const prevMonthDate = subMonths(targetDate, 1);
  const prevMonthStart = startOfMonth(prevMonthDate);
  const prevMonthEnd = endOfMonth(prevMonthDate);

  let currentIncome = 0;
  let currentExpenses = 0;
  let prevIncome = 0;
  let prevExpenses = 0;

  transactions.forEach((tx) => {
    const txDate = parseDateSafe(tx.date);
    const amount = parseAmountSafe(tx.amount);

    if (isWithinInterval(txDate, { start: currentMonthStart, end: currentMonthEnd })) {
      if (tx.type === 'income') {
        currentIncome += amount;
      } else if (tx.type === 'expense') {
        currentExpenses += amount;
      }
    } else if (isWithinInterval(txDate, { start: prevMonthStart, end: prevMonthEnd })) {
      if (tx.type === 'income') {
        prevIncome += amount;
      } else if (tx.type === 'expense') {
        prevExpenses += amount;
      }
    }
  });

  const netSavings = currentIncome - currentExpenses;
  const savingsRate = currentIncome > 0 ? (netSavings / currentIncome) * 100 : 0;

  let incomeChangePercentage: number | undefined;
  if (prevIncome > 0) {
    incomeChangePercentage = ((currentIncome - prevIncome) / prevIncome) * 100;
  }

  let expenseChangePercentage: number | undefined;
  if (prevExpenses > 0) {
    expenseChangePercentage = ((currentExpenses - prevExpenses) / prevExpenses) * 100;
  }

  return {
    totalIncome: currentIncome,
    totalExpenses: currentExpenses,
    netSavings,
    savingsRate: Math.max(0, savingsRate),
    incomeChangePercentage,
    expenseChangePercentage,
  };
}

/**
 * Group expenses or income by category
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  type: 'expense' | 'income' = 'expense'
): CategorySpending[] {
  const categoryMap = new Map<string, Category>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  const totals = new Map<string, { total: number; count: number }>();
  let overallTotal = 0;

  transactions
    .filter((tx) => tx.type === type)
    .forEach((tx) => {
      const catId = tx.categoryId || 'uncategorized';
      const amount = parseAmountSafe(tx.amount);
      const current = totals.get(catId) || { total: 0, count: 0 };
      totals.set(catId, {
        total: current.total + amount,
        count: current.count + 1,
      });
      overallTotal += amount;
    });

  const results: CategorySpending[] = [];

  totals.forEach((data, catId) => {
    const category = categoryMap.get(catId);
    results.push({
      categoryId: catId,
      categoryName: category?.name || (catId === 'uncategorized' ? 'Uncategorized' : 'Unknown'),
      icon: category?.icon || 'HelpCircle',
      type,
      total: data.total,
      percentage: overallTotal > 0 ? (data.total / overallTotal) * 100 : 0,
      transactionCount: data.count,
    });
  });

  return results.sort((a, b) => b.total - a.total);
}

/**
 * Monthly trend for charts (last N months)
 */
export function calculateMonthlyTrends(
  transactions: Transaction[],
  monthsCount = 6
): MonthlyTrend[] {
  const trends: MonthlyTrend[] = [];
  const now = new Date();

  for (let i = monthsCount - 1; i >= 0; i--) {
    const targetMonth = subMonths(now, i);
    const start = startOfMonth(targetMonth);
    const end = endOfMonth(targetMonth);
    const monthKey = format(targetMonth, 'MMM');
    const monthLabel = format(targetMonth, 'MMM yyyy');

    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      const txDate = parseDateSafe(tx.date);
      const amount = parseAmountSafe(tx.amount);

      if (isWithinInterval(txDate, { start, end })) {
        if (tx.type === 'income') {
          income += amount;
        } else if (tx.type === 'expense') {
          expense += amount;
        }
      }
    });

    trends.push({
      month: monthKey,
      monthLabel,
      income,
      expense,
      net: income - expense,
    });
  }

  return trends;
}

/**
 * Filter transactions by predefined or custom date period
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: string,
  customStart?: string,
  customEnd?: string
): Transaction[] {
  const now = new Date();

  if (period === 'this-month') {
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return transactions.filter((tx) =>
      isWithinInterval(parseDateSafe(tx.date), { start, end })
    );
  }

  if (period === 'last-month') {
    const prev = subMonths(now, 1);
    const start = startOfMonth(prev);
    const end = endOfMonth(prev);
    return transactions.filter((tx) =>
      isWithinInterval(parseDateSafe(tx.date), { start, end })
    );
  }

  if (period === 'last-3-months') {
    const start = startOfMonth(subMonths(now, 2));
    const end = endOfMonth(now);
    return transactions.filter((tx) =>
      isWithinInterval(parseDateSafe(tx.date), { start, end })
    );
  }

  if (period === 'last-6-months') {
    const start = startOfMonth(subMonths(now, 5));
    const end = endOfMonth(now);
    return transactions.filter((tx) =>
      isWithinInterval(parseDateSafe(tx.date), { start, end })
    );
  }

  if (period === 'this-year') {
    const start = startOfYear(now);
    const end = endOfYear(now);
    return transactions.filter((tx) =>
      isWithinInterval(parseDateSafe(tx.date), { start, end })
    );
  }

  if (period === 'custom' && customStart && customEnd) {
    try {
      const start = parseDateSafe(customStart);
      const end = parseDateSafe(customEnd);
      return transactions.filter((tx) =>
        isWithinInterval(parseDateSafe(tx.date), { start, end })
      );
    } catch {
      return transactions;
    }
  }

  return transactions;
}
