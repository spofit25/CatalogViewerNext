'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/types';
import { SIZE_ORDER } from '@/lib/types';
import { useCart } from '@/context/cart-context';
import ImageDisplay from './image-display';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetailSheet({ product, isOpen, onClose }: ProductDetailProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  const sizes = useMemo(
    () =>
      [...(product?.sizes || [])].sort(
        (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
      ),
    [product]
  );

  // Reset state each time a new product is opened.
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setQuantity(1);
      setZoom(1);
      setAdded(false);
    }
  }, [isOpen, product?.id]);

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!product) return null;

  const selectedSize = sizes[selectedIndex];
  const totalQuantity = sizes.reduce((sum, s) => sum + (s.quantity_available || 0), 0);
  const subtotal = selectedSize ? selectedSize.price * quantity : 0;

  const handleAdd = () => {
    if (!selectedSize) return;
    addItem(product, selectedSize, quantity);
    setAdded(true);
    setTimeout(onClose, 550);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition sm:items-stretch sm:justify-end ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product.product_name}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-float transition-transform duration-300 sm:max-h-none sm:w-[440px] sm:rounded-none dark:bg-slate-900 ${
          isOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'
        }`}
      >
        <div className="flex justify-center py-2 sm:hidden">
          <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-slate-600 shadow-sm backdrop-blur transition hover:bg-white dark:bg-slate-800/80 dark:text-slate-300"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 dark:bg-slate-800/50">
            <div className="h-full w-full transition-transform duration-300" style={{ transform: `scale(${zoom})` }}>
              {selectedSize?.product_image ? (
                <ImageDisplay imagePath={selectedSize.product_image} alt={product.product_name} />
              ) : (
                <div className="grid h-full w-full place-items-center text-slate-300">No image</div>
              )}
            </div>
            <div className="absolute bottom-3 right-3 flex gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                disabled={zoom <= 1}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg font-semibold text-slate-700 shadow-sm backdrop-blur disabled:opacity-40 dark:bg-slate-800/90 dark:text-slate-200"
                aria-label="Zoom out"
              >−</button>
              <button
                onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                disabled={zoom >= 3}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg font-semibold text-slate-700 shadow-sm backdrop-blur disabled:opacity-40 dark:bg-slate-800/90 dark:text-slate-200"
                aria-label="Zoom in"
              >+</button>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {product.category_name}
              </span>
              <h2 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">{product.product_name}</h2>
              {totalQuantity > 0 && (
                <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">● Ready stock available</p>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Select size &amp; price</h3>
              <div className="overflow-hidden rounded-xl border border-black/5 dark:border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400 dark:bg-white/5">
                    <tr>
                      <th className="px-3 py-2 font-medium">Size</th>
                      <th className="px-3 py-2 font-medium">Inches</th>
                      <th className="px-3 py-2 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizes.map((size, idx) => (
                      <tr
                        key={`${size.size}-${idx}`}
                        onClick={() => setSelectedIndex(idx)}
                        className={`cursor-pointer border-t border-black/5 transition dark:border-white/5 ${
                          idx === selectedIndex ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className={`grid h-4 w-4 place-items-center rounded-full border ${idx === selectedIndex ? 'border-brand-600' : 'border-slate-300 dark:border-slate-600'}`}>
                              {idx === selectedIndex && <span className="h-2 w-2 rounded-full bg-brand-600" />}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{size.size}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400">{size.inches ? `${size.inches}"` : '—'}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900 dark:text-white">₹{size.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedSize && (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quantity</h3>
                  <p className="text-xs text-slate-400">{selectedSize.quantity_available || 0} available</p>
                </div>
                <div className="flex items-center rounded-xl border border-black/5 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="grid h-10 w-10 place-items-center text-lg text-slate-600 disabled:opacity-30 dark:text-slate-300"
                    aria-label="Decrease quantity"
                  >−</button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-10 w-12 bg-transparent text-center text-sm font-semibold text-slate-900 outline-none dark:text-white"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="grid h-10 w-10 place-items-center text-lg text-slate-600 dark:text-slate-300"
                    aria-label="Increase quantity"
                  >+</button>
                </div>
              </div>
            )}

          </div>
        </div>
        <div className="border-t border-black/5 bg-white/90 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur dark:border-white/10 dark:bg-slate-900/90">
          <button
            onClick={handleAdd}
            disabled={!selectedSize}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3.5 text-sm font-semibold text-white shadow-card transition hover:from-brand-500 hover:to-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {added ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
                Added to cart
              </>
            ) : (
              <>Add to cart{selectedSize ? ` · ₹${subtotal.toFixed(2)}` : ''}</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}