'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Category, CategoryType } from '@/types';
import {
  SlidersHorizontal,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

export default function CategoriesPage() {
  const {
    categories,
    transactions,
    isLoading,
    openAddCategory,
    openEditCategory,
    updateCategory,
    deleteCategory,
  } = useApp();

  const [activeTab, setActiveTab] = useState<CategoryType | 'all'>('all');
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Group categories
  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === 'expense'),
    [categories]
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === 'income'),
    [categories]
  );

  const handleToggleActive = async (cat: Category) => {
    await updateCategory(cat.id, { active: !cat.active });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);
      setDeletingCategory(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <PageHeader
        title="Categories"
        description="Organize and classify your income and spending streams"
        icon={SlidersHorizontal}
        actions={
          <Button size="sm" icon={Plus} onClick={openAddCategory}>
            Add Category
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200/80 shadow-2xs w-fit">
        <Button
          variant={activeTab === 'all' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('all')}
        >
          All ({categories.length})
        </Button>
        <Button
          variant={activeTab === 'expense' ? 'primary' : 'ghost'}
          size="sm"
          icon={ArrowUpRight}
          onClick={() => setActiveTab('expense')}
        >
          Expenses ({expenseCategories.length})
        </Button>
        <Button
          variant={activeTab === 'income' ? 'primary' : 'ghost'}
          size="sm"
          icon={ArrowDownLeft}
          onClick={() => setActiveTab('income')}
        >
          Income ({incomeCategories.length})
        </Button>
      </div>

      {/* Categories Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="No categories configured"
          description="Create categories like Groceries, Salary, or Rent to easily categorize your spending."
          actionLabel="Add Category"
          onAction={openAddCategory}
        />
      ) : (
        <div className="space-y-8">
          {/* Expense Categories */}
          {(activeTab === 'all' || activeTab === 'expense') && expenseCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                <span>Expense Categories ({expenseCategories.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {expenseCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    onEdit={openEditCategory}
                    onToggleActive={handleToggleActive}
                    onDelete={(c) => setDeletingCategory(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Income Categories */}
          {(activeTab === 'all' || activeTab === 'income') && incomeCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <span>Income Categories ({incomeCategories.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomeCategories.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    onEdit={openEditCategory}
                    onToggleActive={handleToggleActive}
                    onDelete={(c) => setDeletingCategory(c)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        description={`Are you sure you want to delete "${deletingCategory?.name}"? Historical transactions linked to this category will become uncategorized.`}
        confirmLabel="Delete Category"
        isLoading={isDeleting}
      />
    </div>
  );
}
