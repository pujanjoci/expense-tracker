'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { SavingsSummaryCards } from '@/components/savings/SavingsSummaryCards';
import { SavingsGoalCard } from '@/components/savings/SavingsGoalCard';
import { SavingsGoalModal } from '@/components/savings/SavingsGoalModal';
import { SavingsTransactionModal } from '@/components/savings/SavingsTransactionModal';
import { SavingsHistoryModal } from '@/components/savings/SavingsHistoryModal';
import { SavingsGoalProgress, SavingsTransactionType, GoalStatus } from '@/types';
import { cn } from '@/lib/utils';
import {
  PiggyBank,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Archive,
  CheckCircle2,
  ListFilter,
} from 'lucide-react';

type FilterTab = 'all' | 'active' | 'completed' | 'archived';
type SortOption = 'progress-desc' | 'progress-asc' | 'target-desc' | 'date-asc' | 'newest';

export default function SavingsPage() {
  const {
    savingsGoalsProgress,
    archiveSavingsGoal,
    unarchiveSavingsGoal,
    deleteSavingsGoal,
    isLoading,
  } = useApp();

  // Toolbar & filter state
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('progress-desc');

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoalProgress | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txGoal, setTxGoal] = useState<SavingsGoalProgress | null>(null);
  const [txType, setTxType] = useState<SavingsTransactionType>('deposit');

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyGoal, setHistoryGoal] = useState<SavingsGoalProgress | null>(null);

  // Confirmation dialogs state
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoalProgress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [archivingGoal, setArchivingGoal] = useState<SavingsGoalProgress | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Tab count badges
  const counts = useMemo(() => {
    return {
      all: savingsGoalsProgress.length,
      active: savingsGoalsProgress.filter((g) => g.computedStatus === 'active').length,
      completed: savingsGoalsProgress.filter((g) => g.computedStatus === 'completed').length,
      archived: savingsGoalsProgress.filter((g) => g.computedStatus === 'archived').length,
    };
  }, [savingsGoalsProgress]);

  // Filtered and sorted goals list
  const filteredGoals = useMemo(() => {
    let list = [...savingsGoalsProgress];

    // 1. Tab filter
    if (activeTab === 'active') {
      list = list.filter((g) => g.computedStatus === 'active');
    } else if (activeTab === 'completed') {
      list = list.filter((g) => g.computedStatus === 'completed');
    } else if (activeTab === 'archived') {
      list = list.filter((g) => g.computedStatus === 'archived');
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    list.sort((a, b) => {
      switch (sortBy) {
        case 'progress-desc':
          return b.progressPercentage - a.progressPercentage;
        case 'progress-asc':
          return a.progressPercentage - b.progressPercentage;
        case 'target-desc':
          return b.targetAmount - a.targetAmount;
        case 'date-asc':
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return list;
  }, [savingsGoalsProgress, activeTab, searchQuery, sortBy]);

  // Actions
  const handleOpenCreateGoal = () => {
    setGoalToEdit(null);
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoal = (goal: SavingsGoalProgress) => {
    setGoalToEdit(goal);
    setIsGoalModalOpen(true);
  };

  const handleOpenAddMoney = (goal: SavingsGoalProgress) => {
    setTxGoal(goal);
    setTxType('deposit');
    setIsTxModalOpen(true);
  };

  const handleOpenWithdraw = (goal: SavingsGoalProgress) => {
    setTxGoal(goal);
    setTxType('withdraw');
    setIsTxModalOpen(true);
  };

  const handleOpenHistory = (goal: SavingsGoalProgress) => {
    setHistoryGoal(goal);
    setIsHistoryModalOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (!archivingGoal) return;
    setIsArchiving(true);
    try {
      await archiveSavingsGoal(archivingGoal.id);
      setArchivingGoal(null);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;
    setIsDeleting(true);
    try {
      await deleteSavingsGoal(deletingGoal.id);
      setDeletingGoal(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Savings Goals"
        description="Set targets, track contributions, and build wealth for your milestones"
        icon={PiggyBank}
        actions={
          <Button size="sm" icon={Plus} onClick={handleOpenCreateGoal}>
            New Goal
          </Button>
        }
      />

      {/* Top 4 Summary Cards */}
      <SavingsSummaryCards />

      {/* Filter Tabs & Search Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Tab Pill Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              All ({counts.all})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'active'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Active ({counts.active})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('completed')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'completed'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Completed ({counts.completed})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('archived')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer',
                activeTab === 'archived'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Archived ({counts.archived})
            </button>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Input
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
                className="h-8.5 text-xs"
              />
            </div>

            <div className="w-40 shrink-0">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-8.5 text-xs"
                options={[
                  { value: 'progress-desc', label: 'Progress: High-Low' },
                  { value: 'progress-asc', label: 'Progress: Low-High' },
                  { value: 'target-desc', label: 'Target Amount' },
                  { value: 'date-asc', label: 'Milestone Date' },
                  { value: 'newest', label: 'Recently Created' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Goals Grid or Empty State */}
      {savingsGoalsProgress.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No savings goals yet"
          description="Create your first savings goal to track your emergency fund, dream purchases, or travel plans."
          actionLabel="Create Savings Goal"
          onAction={handleOpenCreateGoal}
          actionIcon={Plus}
        />
      ) : filteredGoals.length === 0 ? (
        <EmptyState
          icon={ListFilter}
          title="No matching goals found"
          description="Try adjusting your search query or filter tab to view other goals."
          actionLabel="Clear Filters"
          onAction={() => {
            setActiveTab('all');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGoals.map((goal) => (
            <SavingsGoalCard
              key={goal.id}
              goal={goal}
              onAddMoney={handleOpenAddMoney}
              onWithdraw={handleOpenWithdraw}
              onEdit={handleOpenEditGoal}
              onViewHistory={handleOpenHistory}
              onArchive={(g) => setArchivingGoal(g)}
              onUnarchive={(g) => unarchiveSavingsGoal(g.id)}
              onDelete={(g) => setDeletingGoal(g)}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      {/* Add Money / Withdraw Transaction Modal */}
      <SavingsTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxGoal(null);
        }}
        goal={txGoal}
        defaultType={txType}
      />

      {/* Goal History / Ledger Modal */}
      <SavingsHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setHistoryGoal(null);
        }}
        goal={historyGoal}
      />

      {/* Confirm Dialog for Archiving */}
      <ConfirmDialog
        isOpen={Boolean(archivingGoal)}
        onClose={() => setArchivingGoal(null)}
        onConfirm={handleArchiveConfirm}
        isLoading={isArchiving}
        isDestructive={false}
        title="Archive Savings Goal"
        description={`Are you sure you want to archive "${archivingGoal?.name}"? It will be moved to the Archived tab. Your saved balance and transaction history are safely preserved and can be restored at any time.`}
        confirmLabel="Archive Goal"
      />

      {/* Confirm Dialog for Deleting */}
      <ConfirmDialog
        isOpen={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        isDestructive={true}
        title="Delete Savings Goal"
        description={`Are you sure you want to permanently delete "${deletingGoal?.name}"? All associated deposits and withdrawals for this goal will be removed. This action cannot be undone.`}
        confirmLabel="Delete Goal"
      />
    </div>
  );
}
