'use client';

import type { Product } from '@/lib/types';
import ImageDisplay from './image-display';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const sizes = product.sizes || [];
  // Prefer the SET variant image, otherwise the first available one.
  const displaySize = sizes.find((size) => size.size === 'SET') || sizes[0];

  const prices = sizes.map((s) => s.price).filter((p) => typeof p === 'number');
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  const inStock = sizes.some((s) => (s.quantity_available || 0) > 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white text-left shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-float focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 dark:border-white/10 dark:bg-slate-900/70"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50 dark:bg-slate-800/50">
        {displaySize?.product_image ? (
          <ImageDisplay imagePath={displaySize.product_image} alt={product.product_name} className="transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-300 dark:text-slate-600">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur ${
            inStock
              ? 'bg-brand-500/90 text-white'
              : 'bg-slate-900/70 text-white'
          }`}
        >
          {inStock ? 'In stock' : 'Out of stock'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
          {product.category_name}
        </span>
        <h3 className="line-clamp-2 text-[15px] font-semibold text-slate-900 dark:text-white">
          {product.product_name}
        </h3>
        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="leading-tight">
            {minPrice !== null && (
              <>
                <span className="mr-1 text-[11px] text-slate-400">from</span>
                <span className="text-base font-bold text-slate-900 dark:text-white">₹{minPrice.toFixed(0)}</span>
                {maxPrice !== null && maxPrice !== minPrice && (
                  <span className="ml-1 text-xs text-slate-400">– ₹{maxPrice.toFixed(0)}</span>
                )}
              </>
            )}
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
            {sizes.length} size{sizes.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>
    </button>
  );
}
