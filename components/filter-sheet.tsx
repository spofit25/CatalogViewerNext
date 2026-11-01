'use client';

import { useEffect } from 'react';
import type { Category } from '@/lib/types';

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  minPrice: number | null;
  maxPrice: number | null;
  onMinPriceChange: (price: number | null) => void;
  onMaxPriceChange: (price: number | null) => void;
  minInches: number | null;
  maxInches: number | null;
  onMinInchesChange: (inches: number | null) => void;
  onMaxInchesChange: (inches: number | null) => void;
  availabilityFilter: string;
  onAvailabilityChange: (availability: string) => void;
  selectedSizes: string[];
  onSizeToggle: (size: string) => void;
  onClearFilters: () => void;
  totalResults: number;
}

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const num = (value: string) => (value === '' ? null : parseFloat(value));

export default function FilterSheet(props: FilterSheetProps) {
  const {
    isOpen, onClose, categories, selectedCategory, onCategoryChange,
    minPrice, maxPrice, onMinPriceChange, onMaxPriceChange,
    minInches, maxInches, onMinInchesChange, onMaxInchesChange,
    availabilityFilter, onAvailabilityChange,
    selectedSizes, onSizeToggle, onClearFilters, totalResults,
  } = props;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const inputClass =
    'h-10 w-full rounded-lg border border-black/5 bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white';

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-float transition-transform duration-300 dark:bg-slate-900 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4 dark:border-white/10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
          <button
            onClick={onClose}
            aria-label="Close filters"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Category</h3>
            <select value={selectedCategory} onChange={(e) => onCategoryChange(e.target.value)} className={inputClass}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.category_name}>
                  {cat.id === 0 ? 'All categories' : cat.category_name}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Price (₹)</h3>
            <div className="flex items-center gap-3">
              <input type="number" min={0} placeholder="Min" value={minPrice ?? ''} onChange={(e) => onMinPriceChange(num(e.target.value))} className={inputClass} />
              <span className="text-slate-400">–</span>
              <input type="number" min={0} placeholder="Max" value={maxPrice ?? ''} onChange={(e) => onMaxPriceChange(num(e.target.value))} className={inputClass} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Inches</h3>
            <div className="flex items-center gap-3">
              <input type="number" min={1} max={150} placeholder="Min" value={minInches ?? ''} onChange={(e) => onMinInchesChange(num(e.target.value))} className={inputClass} />
              <span className="text-slate-400">–</span>
              <input type="number" min={1} max={150} placeholder="Max" value={maxInches ?? ''} onChange={(e) => onMaxInchesChange(num(e.target.value))} className={inputClass} />
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Availability</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'in-stock', label: 'In stock' },
                { value: 'out-of-stock', label: 'Out' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onAvailabilityChange(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    availabilityFilter === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-black/5 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Sizes</h3>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((size) => (
                <button
                  key={size}
                  onClick={() => onSizeToggle(size)}
                  className={`min-w-12 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    selectedSizes.includes(size)
                      ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                      : 'border-black/5 text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center gap-3 border-t border-black/5 px-5 py-4 dark:border-white/10">
          <button
            onClick={onClearFilters}
            className="h-11 flex-1 rounded-xl border border-black/10 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
          >
            Clear all
          </button>
          <button
            onClick={onClose}
            className="h-11 flex-1 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-sm font-semibold text-white shadow-card transition hover:from-brand-500 hover:to-brand-600"
          >
            Show {totalResults} results
          </button>
        </div>
      </aside>
    </div>
  );
}
