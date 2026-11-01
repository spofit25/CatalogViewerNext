'use client';

import { useState } from 'react';
import { useCatalog } from '@/lib/use-catalog';
import type { Product } from '@/lib/types';
import Header from './header';
import Marquee from './marquee';
import ProductCard from './product-card';
import ProductDetailSheet from './product-detail-sheet';
import FilterSheet from './filter-sheet';
import Pagination from './pagination';
import Footer from './footer';

export default function CatalogView() {
  const catalog = useCatalog();
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSheetOpen(true);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        searchQuery={catalog.searchQuery}
        onSearchChange={catalog.onSearchChange}
        showFilterButton
        onFilterClick={() => setFilterOpen(true)}
        activeFilterCount={catalog.activeFilterCount}
      />
      <Marquee />

      {/* Category chips */}
      <div className="fixed top-25 z-10 w-full border-b border-black/5 bg-white/60 backdrop-blur dark:border-white/5 dark:bg-slate-950/40">
        <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
          {catalog.categories.map((category) => {
            const active = catalog.selectedCategory === category.category_name;
            return (
              <button
                key={category.id}
                onClick={() => catalog.onCategoryChange(category.category_name)}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'border-transparent bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900'
                    : 'border-black/5 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-brand-300'
                }`}
              >
                {category.id === 0 ? 'All' : category.category_name}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-3 lg:px-8 mt-20">
        {/* Results header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {catalog.selectedCategory === 'all' ? 'All products' : catalog.selectedCategory}
          </h2>
          {catalog.activeFilterCount > 0 && (
            <button
              onClick={catalog.clearFilters}
              className="text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
            >
              Clear filters
            </button>
          )}
        </div>

        {catalog.loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:border-white/10 dark:bg-slate-900/70">
                <div className="aspect-square animate-pulse bg-slate-100 dark:bg-slate-800/60" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        )}

        {catalog.error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
            <p className="font-semibold">Could not load products</p>
            <p className="mt-1 opacity-90">{catalog.error}</p>
          </div>
        )}

        {!catalog.loading && !catalog.error && catalog.products.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-black/10 bg-white/60 py-20 text-center dark:border-white/10 dark:bg-white/5">
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No products found</p>
            <p className="mt-1 text-sm text-slate-400">Try adjusting your search or filters.</p>
            <button
              onClick={catalog.clearFilters}
              className="mt-4 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              Reset filters
            </button>
          </div>
        )}

        {!catalog.loading && !catalog.error && catalog.products.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {catalog.products.map((product) => (
              <ProductCard key={product.id} product={product} onClick={() => openProduct(product)} />
            ))}
          </div>
        )}

        {!catalog.loading && !catalog.error && catalog.totalPages > 1 && (
          <div className="mt-8">
            <Pagination
              currentPage={catalog.currentPage}
              totalPages={catalog.totalPages}
              onPageChange={catalog.onPageChange}
              itemsPerPage={catalog.itemsPerPage}
              onItemsPerPageChange={catalog.onItemsPerPageChange}
              totalResults={catalog.totalResults}
            />
          </div>
        )}
      </main>

      <Footer />

      <FilterSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={catalog.categories}
        selectedCategory={catalog.selectedCategory}
        onCategoryChange={catalog.onCategoryChange}
        minPrice={catalog.minPrice}
        maxPrice={catalog.maxPrice}
        onMinPriceChange={catalog.onMinPriceChange}
        onMaxPriceChange={catalog.onMaxPriceChange}
        minInches={catalog.minInches}
        maxInches={catalog.maxInches}
        onMinInchesChange={catalog.onMinInchesChange}
        onMaxInchesChange={catalog.onMaxInchesChange}
        availabilityFilter={catalog.availabilityFilter}
        onAvailabilityChange={catalog.onAvailabilityChange}
        selectedSizes={catalog.selectedSizes}
        onSizeToggle={catalog.onSizeToggle}
        onClearFilters={catalog.clearFilters}
        totalResults={catalog.totalResults}
      />

      <ProductDetailSheet
        product={selectedProduct}
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
