'use client';

import React from 'react';
import { Category } from '@/types';
import { Card, CardContent } from '@/components/ui/Card';
import { CategoryIcon } from '@/lib/icons';
import { Badge } from '@/components/ui/Badge';
import { Pencil, Trash2, Power, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
  transactionCount?: number;
  onEdit: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryCard({
  category,
  transactionCount = 0,
  onEdit,
  onToggleActive,
  onDelete,
}: CategoryCardProps) {
  const isIncome = category.type === 'income';

  return (
    <Card className={cn('transition-all', !category.active && 'opacity-60 bg-slate-50/70')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Icon & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs',
                isIncome
                  ? 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
                  : 'bg-slate-100 border-slate-200/80 text-slate-700'
              )}
            >
              <CategoryIcon name={category.icon} className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm truncate">
                {category.name}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant={isIncome ? 'success' : 'secondary'}
                  className="text-[10px] py-0"
                  icon={isIncome ? ArrowDownLeft : ArrowUpRight}
                >
                  {isIncome ? 'Income' : 'Expense'}
                </Badge>
                {!category.active && (
                  <Badge variant="outline" className="text-[10px] py-0 text-slate-400">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onEdit(category)}
              title="Edit Category"
              aria-label="Edit Category"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onToggleActive(category)}
              title={category.active ? 'Deactivate Category' : 'Activate Category'}
              aria-label={category.active ? 'Deactivate Category' : 'Activate Category'}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <Power className={cn('w-3.5 h-3.5', category.active ? 'text-slate-400' : 'text-emerald-600')} />
            </button>
            <button
              onClick={() => onDelete(category)}
              title="Delete Category"
              aria-label="Delete Category"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
