'use client';

import { Fragment } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage: number;
  onItemsPerPageChange: (items: number) => void;
  totalResults: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalResults,
}: PaginationProps) {
  if (totalPages <= 1 && totalResults <= itemsPerPage) {
    return (
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{totalResults} product{totalResults === 1 ? '' : 's'}</span>
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('...');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const btn =
    'grid h-16 min-w-10 place-items-center rounded-lg border border-black/5 bg-white px-2 text-sm font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-40 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-brand-500/40';

  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span className="hidden sm:inline">Show</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(parseInt(e.target.value))}
          className="h-9 rounded-lg border border-black/5 bg-white px-2 text-sm text-slate-700 outline-none focus:border-brand-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
        >
          {[12, 24, 36, 48].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span>of {totalResults} products</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button className={btn} onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>

        {getPageNumbers().map((page, index) => (
          <Fragment key={index}>
            {page === '...' ? (
              <span className="px-1 text-slate-400">…</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                aria-current={page === currentPage ? 'page' : undefined}
                className={
                  page === currentPage
                    ? 'grid h-16 min-w-9 place-items-center rounded-lg bg-brand-600 px-2 text-sm font-semibold text-white shadow-sm'
                    : btn
                }
              >
                {page}
              </button>
            )}
          </Fragment>
        ))}

        <button className={btn} onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}
