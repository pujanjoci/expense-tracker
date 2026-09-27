'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useApp } from '@/context/AppContext';
import { Category, CategoryType } from '@/types';
import { Check, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from '@/lib/icons';
import { cn } from '@/lib/utils';

export function CategoryModal() {
  const {
    isCategoryModalOpen,
    editingCategory,
    closeCategoryModal,
    createCategory,
    updateCategory,
  } = useApp();

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('expense');
  const [icon, setIcon] = useState('Utensils');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setType(editingCategory.type);
      setIcon(editingCategory.icon || 'Utensils');
      setActive(editingCategory.active);
    } else {
      setName('');
      setType('expense');
      setIcon('Utensils');
      setActive(true);
    }
    setErrors({});
  }, [editingCategory, isCategoryModalOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        icon,
        active,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await createCategory(payload);
      }

      closeCategoryModal();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save category' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCategoryModalOpen}
      onClose={closeCategoryModal}
      title={editingCategory ? 'Edit Category' : 'Add New Category'}
      description={
        editingCategory
          ? 'Customize the icon, name, and status for this category'
          : 'Create a custom category for classifying income or expenses'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700">
            {errors.form}
          </div>
        )}

        {/* Category Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-700">Category Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer',
                type === 'expense'
                  ? 'border-rose-300 bg-rose-50 text-rose-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                'flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer',
                type === 'income'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 font-semibold'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Income</span>
            </button>
          </div>
        </div>

        {/* Category Name */}
        <Input
          label="Category Name"
          placeholder="e.g. Groceries, Gym, SaaS Subscriptions..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
        />

        {/* Lucide Icon Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">
            Select Icon (Lucide Icons - No Emojis)
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
            {AVAILABLE_CATEGORY_ICONS.map((item) => {
              const isSelected = icon === item.name;
              return (
                <button
                  type="button"
                  key={item.name}
                  onClick={() => setIcon(item.name)}
                  title={item.label}
                  className={cn(
                    'flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all cursor-pointer text-center group',
                    isSelected
                      ? 'border-slate-900 bg-white text-slate-900 shadow-2xs ring-1 ring-slate-900'
                      : 'border-transparent bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800'
                  )}
                >
                  <CategoryIcon name={item.name} className="w-5 h-5 mb-1 shrink-0" />
                  <span className="text-[10px] leading-tight truncate w-full group-hover:text-slate-900">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            id="category-active"
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          <label htmlFor="category-active" className="text-xs font-medium text-slate-700 cursor-pointer">
            Category is Active
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeCategoryModal}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting} icon={Check}>
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
