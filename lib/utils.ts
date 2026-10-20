import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Account,
  Transaction,
  AccountBalanceSummary,
  MonthlyOverview,
  Category,
  CategorySpending,
  MonthlyTrend,
  SavingsGoal,
  SavingsTransaction,
  SavingsGoalProgress,
  SavingsSummary,
  GoalStatus,
} from '@/types';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isWithinInterval, startOfYear, endOfYear, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

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

  if (period === 'this-week') {
    const start = startOfWeek(now, { weekStartsOn: 1 });
    const end = endOfWeek(now, { weekStartsOn: 1 });
    return transactions.filter((tx) =>
      isWithinInterval(parseDateSafe(tx.date), { start, end })
    );
  }

  if (period === 'last-week') {
    const prev = subWeeks(now, 1);
    const start = startOfWeek(prev, { weekStartsOn: 1 });
    const end = endOfWeek(prev, { weekStartsOn: 1 });
    return transactions.filter((tx) =>
      isWithinInterval(parseDateSafe(tx.date), { start, end })
    );
  }

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

/**
 * Calculate progress and status for a single savings goal
 */
export function calculateGoalProgress(
  goal: SavingsGoal,
  transactions: SavingsTransaction[] = []
): SavingsGoalProgress {
  const goalTransactions = transactions.filter((tx) => tx.goalId === goal.id);
  let totalDeposited = 0;
  let totalWithdrawn = 0;

  goalTransactions.forEach((tx) => {
    const amount = parseAmountSafe(tx.amount);
    if (tx.type === 'deposit') {
      totalDeposited += amount;
    } else if (tx.type === 'withdraw') {
      totalWithdrawn += amount;
    }
  });

  const initialAmount = Math.max(0, parseAmountSafe(goal.initialAmount));
  const targetAmount = Math.max(0, parseAmountSafe(goal.targetAmount));
  const currentSaved = Math.max(0, initialAmount + totalDeposited - totalWithdrawn);
  const remainingAmount = Math.max(0, targetAmount - currentSaved);
  const progressPercentage = targetAmount > 0
    ? Math.min(100, Math.round((currentSaved / targetAmount) * 100))
    : (currentSaved > 0 ? 100 : 0);

  let computedStatus: GoalStatus = goal.status;
  if (goal.status !== 'archived') {
    if (targetAmount > 0 && currentSaved >= targetAmount) {
      computedStatus = 'completed';
    } else {
      computedStatus = 'active';
    }
  }

  return {
    ...goal,
    initialAmount,
    targetAmount,
    currentSaved,
    remainingAmount,
    progressPercentage,
    computedStatus,
    totalDeposited,
    totalWithdrawn,
    transactionCount: goalTransactions.length,
  };
}

/**
 * Calculate progress for an array of savings goals
 */
export function calculateSavingsGoalsProgress(
  goals: SavingsGoal[],
  transactions: SavingsTransaction[] = []
): SavingsGoalProgress[] {
  return goals.map((goal) => calculateGoalProgress(goal, transactions));
}

/**
 * Calculate overall savings dashboard summary cards
 */
export function calculateSavingsSummary(
  goalsWithProgress: SavingsGoalProgress[]
): SavingsSummary {
  // Only non-archived goals contribute to active metrics
  const activeOrCompleted = goalsWithProgress.filter((g) => g.computedStatus !== 'archived');
  const activeOnly = goalsWithProgress.filter((g) => g.computedStatus === 'active');
  const completedOnly = goalsWithProgress.filter((g) => g.computedStatus === 'completed');
  const archivedOnly = goalsWithProgress.filter((g) => g.computedStatus === 'archived');

  const totalSaved = activeOrCompleted.reduce((sum, g) => sum + g.currentSaved, 0);
  const combinedTarget = activeOrCompleted.reduce((sum, g) => sum + g.targetAmount, 0);
  const remainingToTarget = activeOnly.reduce((sum, g) => sum + g.remainingAmount, 0);

  const overallProgressPercentage = combinedTarget > 0
    ? Math.min(100, Math.round((totalSaved / combinedTarget) * 100))
    : 0;

  return {
    totalSaved,
    activeGoalsCount: activeOnly.length,
    completedGoalsCount: completedOnly.length,
    archivedGoalsCount: archivedOnly.length,
    combinedTarget,
    remainingToTarget,
    overallProgressPercentage,
  };
}

/**
 * Helper to get days remaining or overdue for a savings goal target date
 */
export function getGoalDateStatus(targetDate?: string): {
  formattedDate: string;
  isOverdue: boolean;
  daysRemaining: number;
  label: string;
} | null {
  if (!targetDate) return null;
  try {
    const target = parseDateSafe(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDay = new Date(target);
    targetDay.setHours(0, 0, 0, 0);

    const diffTime = targetDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = formatDate(targetDate, 'dd MMM yyyy');

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        formattedDate,
        isOverdue: true,
        daysRemaining: diffDays,
        label: overdueDays === 1 ? '1 day overdue' : `${overdueDays} days overdue`,
      };
    } else if (diffDays === 0) {
      return {
        formattedDate,
        isOverdue: false,
        daysRemaining: 0,
        label: 'Target date today',
      };
    } else {
      return {
        formattedDate,
        isOverdue: false,
        daysRemaining: diffDays,
        label: diffDays === 1 ? '1 day left' : `${diffDays} days left`,
      };
    }
  } catch {
    return null;
  }
}

/**
 * Calculate budget progress and status for all active budgets in a given month (default current month)
 */
export function calculateBudgetsStatus(
  budgets: import('@/types').Budget[],
  transactions: Transaction[],
  categories: Category[],
  monthStr?: string
): import('@/types').CategoryBudgetStatus[] {
  const targetMonth = monthStr || format(new Date(), 'yyyy-MM');
  const monthBudgets = budgets.filter((b) => b.month === targetMonth);

  // Group current month's expense transactions by category
  const expenseTransactions = transactions.filter((tx) => {
    if (tx.type !== 'expense') return false;
    const txMonth = tx.date.slice(0, 7);
    return txMonth === targetMonth;
  });

  const spentByCategory: Record<string, number> = {};
  expenseTransactions.forEach((tx) => {
    if (tx.categoryId) {
      spentByCategory[tx.categoryId] = (spentByCategory[tx.categoryId] || 0) + parseAmountSafe(tx.amount);
    }
  });

  return monthBudgets.map((b) => {
    const cat = categories.find((c) => c.id === b.category || c.name.toLowerCase() === b.category.toLowerCase());
    const categoryName = cat ? cat.name : b.category;
    const icon = cat?.icon || 'Tag';
    const currentSpent = cat ? (spentByCategory[cat.id] || 0) : (spentByCategory[b.category] || 0);
    const limit = parseAmountSafe(b.monthlyLimit);
    const remaining = Math.max(0, limit - currentSpent);
    const percentage = limit > 0 ? Math.round((currentSpent / limit) * 100) : 0;

    return {
      budget: b,
      categoryName,
      icon,
      monthlyLimit: limit,
      currentSpent,
      remaining,
      percentage,
      isWarning: percentage >= 80 && percentage < 100,
      isOverBudget: percentage >= 100,
    };
  });
}

/**
 * Generate plain-language financial insights
 */
export function generateInsights(
  transactions: Transaction[],
  budgets: import('@/types').Budget[],
  recurring: import('@/types').RecurringTransaction[],
  monthlyOverview: MonthlyOverview
): import('@/types').InsightCardData[] {
  const insights: import('@/types').InsightCardData[] = [];
  const now = new Date();
  const currentMonthStr = format(now, 'yyyy-MM');
  const prevMonthStr = format(subMonths(now, 1), 'yyyy-MM');

  // 1. Month-over-month spending comparison
  const currentMonthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + parseAmountSafe(t.amount), 0);

  const prevMonthExpenses = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(prevMonthStr))
    .reduce((s, t) => s + parseAmountSafe(t.amount), 0);

  if (prevMonthExpenses > 0) {
    const diffPct = Math.round(((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100);
    if (diffPct < -10) {
      insights.push({
        id: 'spend-down',
        type: 'decrease',
        title: 'Spending is down',
        description: `You've spent ${Math.abs(diffPct)}% less this month compared to this point last month. Great pace!`,
        metric: `${Math.abs(diffPct)}% lower`,
      });
    } else if (diffPct > 20) {
      insights.push({
        id: 'spend-up',
        type: 'increase',
        title: 'Spending pace increased',
        description: `Spending is up ${diffPct}% compared to last month. Review non-essential expenses.`,
        metric: `+${diffPct}%`,
      });
    }
  }

  // 2. Largest expense this month
  const currentMonthTx = transactions.filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr));
  if (currentMonthTx.length > 0) {
    const largest = [...currentMonthTx].sort((a, b) => parseAmountSafe(b.amount) - parseAmountSafe(a.amount))[0];
    if (largest && parseAmountSafe(largest.amount) > 0) {
      insights.push({
        id: 'largest-expense',
        type: 'warning',
        title: 'Largest expense',
        description: `"${largest.description}" was your single highest expense this month.`,
        metric: `Rs. ${parseAmountSafe(largest.amount).toLocaleString('en-IN')}`,
      });
    }
  }

  // 3. Subscriptions / recurring summary
  const activeSubs = recurring.filter((r) => r.active);
  if (activeSubs.length > 0) {
    const monthlySubTotal = activeSubs.reduce((acc, sub) => {
      const amt = parseAmountSafe(sub.amount);
      if (sub.frequency === 'daily') return acc + amt * 30;
      if (sub.frequency === 'weekly') return acc + amt * 4.33;
      if (sub.frequency === 'monthly') return acc + amt;
      if (sub.frequency === 'yearly') return acc + amt / 12;
      return acc;
    }, 0);

    insights.push({
      id: 'subscriptions-insight',
      type: 'tip',
      title: 'Active subscriptions',
      description: `You have ${activeSubs.length} recurring commitment${activeSubs.length > 1 ? 's' : ''} totaling ~Rs. ${Math.round(monthlySubTotal).toLocaleString('en-IN')}/mo.`,
      metric: `${activeSubs.length} active`,
    });
  }

  // 4. Savings rate milestone
  if (monthlyOverview.totalIncome > 0) {
    const savingsRate = Math.round((monthlyOverview.netSavings / monthlyOverview.totalIncome) * 100);
    if (savingsRate >= 20) {
      insights.push({
        id: 'savings-rate-good',
        type: 'milestone',
        title: 'Strong savings rate',
        description: `You are saving ${savingsRate}% of your income this month. Keep it up!`,
        metric: `${savingsRate}% saved`,
      });
    }
  }

  return insights;
}

/**
 * Calculate daily spending heatmap data for the past N days (e.g., 90 days)
 */
export function calculateDailySpendingHeatmap(
  transactions: Transaction[],
  daysCount = 84 // 12 weeks
): { date: string; amount: number; count: number; level: 0 | 1 | 2 | 3 | 4 }[] {
  const result: { date: string; amount: number; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyTotals: Record<string, { amount: number; count: number }> = {};
  transactions.forEach((tx) => {
    if (tx.type === 'expense') {
      const d = tx.date.slice(0, 10);
      if (!dailyTotals[d]) dailyTotals[d] = { amount: 0, count: 0 };
      dailyTotals[d].amount += parseAmountSafe(tx.amount);
      dailyTotals[d].count += 1;
    }
  });

  // Collect all positive amounts to compute quartile thresholds
  const amounts = Object.values(dailyTotals).map((v) => v.amount).filter((a) => a > 0).sort((a, b) => a - b);
  const q1 = amounts[Math.floor(amounts.length * 0.25)] || 500;
  const q2 = amounts[Math.floor(amounts.length * 0.5)] || 1500;
  const q3 = amounts[Math.floor(amounts.length * 0.75)] || 4000;

  for (let i = daysCount - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const dateStr = format(day, 'yyyy-MM-dd');
    const entry = dailyTotals[dateStr] || { amount: 0, count: 0 };

    let level: 0 | 1 | 2 | 3 | 4 = 0;
    if (entry.amount > 0) {
      if (entry.amount <= q1) level = 1;
      else if (entry.amount <= q2) level = 2;
      else if (entry.amount <= q3) level = 3;
      else level = 4;
    }

    result.push({
      date: dateStr,
      amount: entry.amount,
      count: entry.count,
      level,
    });
  }

  return result;
}

/**
 * End-of-month spending projection and forecast
 */
export function calculateForecast(
  transactions: Transaction[],
  now = new Date()
): {
  daysPassed: number;
  daysRemaining: number;
  totalDays: number;
  spentSoFar: number;
  dailyAverage: number;
  projectedMonthEnd: number;
} {
  const currentMonthStr = format(now, 'yyyy-MM');
  const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysPassed = Math.max(1, now.getDate());
  const daysRemaining = Math.max(0, totalDays - daysPassed);

  const spentSoFar = transactions
    .filter((t) => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + parseAmountSafe(t.amount), 0);

  const dailyAverage = Math.round(spentSoFar / daysPassed);
  const projectedMonthEnd = Math.round(spentSoFar + dailyAverage * daysRemaining);

  return {
    daysPassed,
    daysRemaining,
    totalDays,
    spentSoFar,
    dailyAverage,
    projectedMonthEnd,
  };
}

