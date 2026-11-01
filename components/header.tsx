'use client';

import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import Logo from './logo';
import ThemeToggle from './theme-toggle';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
  showFilterButton?: boolean;
  onFilterClick?: () => void;
  activeFilterCount?: number;
  showCartButton?: boolean;
}

export default function Header({
  searchQuery = '',
  onSearchChange,
  showSearch = true,
  showFilterButton = false,
  onFilterClick,
  activeFilterCount = 0,
  showCartButton = true,
}: HeaderProps) {
  const { getTotalItems } = useCart();
  const cartItemCount = getTotalItems();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-4">
        <Logo />

        {showSearch && (
          <div className="relative ml-auto w-full max-w-md sm:ml-6">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" />
            </svg>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search products…"
              className="h-10 w-full rounded-full border border-black/5 bg-slate-100/80 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-white/10"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:ml-0">
          {showFilterButton && (
            <button
              type="button"
              onClick={onFilterClick}
              aria-label="Open filters"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}

          <ThemeToggle />

          {showCartButton && (
            <Link
              href="/cart"
              aria-label="View cart"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white/70 text-slate-700 shadow-sm transition hover:bg-white hover:text-brand-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2 3h2.2l2.3 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L21 7H5" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[11px] font-bold text-white shadow">
                  {cartItemCount}
                </span>
              )}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
