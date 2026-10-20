'use client';

import React, { useState, useEffect } from 'react';
import { Search, ArrowUpDown, X, Bookmark } from 'lucide-react';
import { Account, Category } from '@/types';
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
  selectedTag: string;
  onTagChange: (tag: string) => void;
  sortBy: string;
  onSortChange: (s: string) => void;
  accounts: Account[];
  categories: Category[];
  availableTags: string[];
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
  selectedTag,
  onTagChange,
  sortBy,
  onSortChange,
  accounts,
  categories,
  availableTags,
  onReset,
  hasActiveFilters,
}: TransactionFiltersProps) {
  // Saved presets in localStorage
  const [presets, setPresets] = useState<{ name: string; type: string; account: string; category: string }[]>([]);
  const [presetName, setPresetName] = useState<string>('');
  const [showSavePreset, setShowSavePreset] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('expense_tracker_filter_presets');
      if (stored) setPresets(JSON.parse(stored));
    } catch {}
  }, []);

  const saveCurrentPreset = () => {
    if (!presetName.trim()) return;
    const newPresets = [
      ...presets,
      {
        name: presetName.trim(),
        type: selectedType,
        account: selectedAccountId,
        category: selectedCategoryId,
      },
    ];
    setPresets(newPresets);
    localStorage.setItem('expense_tracker_filter_presets', JSON.stringify(newPresets));
    setPresetName('');
    setShowSavePreset(false);
  };

  const applyPreset = (preset: typeof presets[0]) => {
    onTypeChange(preset.type);
    onAccountChange(preset.account);
    onCategoryChange(preset.category);
  };

  return (
    <div className="space-y-3 aurora-card p-4 rounded-2xl">
      {/* Top Search & Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by description, merchant, or notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
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

      {/* Filter Selectors */}
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
              {cat.name}
            </option>
          ))}
        </Select>

        {/* Tags Filter */}
        <Select
          value={selectedTag}
          onChange={(e) => onTagChange(e.target.value)}
        >
          <option value="all">All Tags</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </Select>
      </div>

      {/* Presets and Active Reset row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.length > 0 && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Bookmark className="w-3 h-3 text-violet-600 dark:text-violet-400" /> Presets:
            </span>
          )}
          {presets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-500/20 text-slate-700 dark:text-slate-300 hover:text-violet-700 dark:hover:text-white text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {p.name}
            </button>
          ))}
          {hasActiveFilters && !showSavePreset && (
            <button
              type="button"
              onClick={() => setShowSavePreset(true)}
              className="text-[11px] text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 ml-1 underline cursor-pointer font-medium"
            >
              Save as Preset
            </button>
          )}
          {showSavePreset && (
            <div className="flex items-center gap-1 ml-1">
              <input
                type="text"
                placeholder="Preset name..."
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                className="px-2 py-0.5 rounded text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={saveCurrentPreset}
                className="px-2 py-0.5 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs cursor-pointer font-medium"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowSavePreset(false)}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer ml-0.5"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 h-7 px-2 cursor-pointer"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reset Filters
          </Button>
        )}
      </div>
    </div>
  );
}
