'use client';

import React from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, X, Filter } from 'lucide-react';
import { Account, Category, TransactionType } from '@/types';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface TransactionFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedType: string;
  onTypeChange: (t: string) => void;
  selectedAccountId: string;
  onAccountChange: (a: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (c: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  accounts: Account[];
  categories: Category[];
  onReset: () => void;
  hasActiveFilters: boolean;
}

export function TransactionFilters({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedAccountId,
  onAccountChange,
  selectedCategoryId,
  onCategoryChange,
  sortBy,
  onSortChange,
  accounts,
  categories,
  onReset,
  hasActiveFilters,
}: TransactionFiltersProps) {
  return (
    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
      {/* Top Search & Reset Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search transactions by description or notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort dropdown */}
        <div className="w-full sm:w-48">
          <Select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            icon={ArrowUpDown}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
          </Select>
        </div>
      </div>

      {/* Filter Chips / Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {/* Type Filter */}
        <Select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="expense">Expenses Only</option>
          <option value="income">Income Only</option>
          <option value="transfer">Transfers Only</option>
        </Select>

        {/* Account Filter */}
        <Select
          value={selectedAccountId}
          onChange={(e) => onAccountChange(e.target.value)}
        >
          <option value="all">All Accounts</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name}
            </option>
          ))}
        </Select>

        {/* Category Filter */}
        <Select
          value={selectedCategoryId}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.type})
            </option>
          ))}
        </Select>

        {/* Reset Filter Button */}
        <div className="col-span-2 sm:col-span-1 flex items-center">
          {hasActiveFilters ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              icon={X}
              className="w-full h-9 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
            >
              Reset Filters
            </Button>
          ) : (
            <div className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1 w-full pl-2">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
