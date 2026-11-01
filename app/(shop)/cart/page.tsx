'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import Header from '@/components/header';
import Footer from '@/components/footer';
import ImageDisplay from '@/components/image-display';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotalPrice } = useCart();
  const router = useRouter();
  const total = getTotalPrice();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} showCartButton={false} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Shopping cart</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {items.length} item{items.length === 1 ? '' : 's'} in your cart
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={() => window.confirm('Clear your entire cart?') && clearCart()}
              className="rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              Clear cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="grid place-items-center rounded-3xl border border-dashed border-black/10 bg-white/60 py-24 text-center dark:border-white/10 dark:bg-white/5">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
                <path d="M2 3h2.2l2.3 12.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 2-1.6L21 7H5" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-800 dark:text-slate-100">Your cart is empty</h2>
            <p className="mt-1 text-sm text-slate-400">Add some products to get started.</p>
            <Link
              href="/"
              className="mt-5 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700"
            >
              Browse catalogue
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-black/5 bg-white p-3 shadow-card dark:border-white/10 dark:bg-slate-900/70"
                >
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    {item.selectedSize.product_image ? (
                      <ImageDisplay imagePath={item.selectedSize.product_image} alt={item.product.product_name} />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-slate-400">No image</div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{item.product.product_name}</h3>
                        <p className="text-xs text-slate-400">{item.product.category_name}</p>
                        <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">Size: {item.selectedSize.size}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                        className="grid h-8 w-8 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-black/5 bg-slate-50 dark:border-white/10 dark:bg-white/5">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="grid h-9 w-9 place-items-center text-slate-600 disabled:opacity-30 dark:text-slate-300"
                          aria-label="Decrease quantity"
                        >−</button>
                        <span className="w-8 text-center text-sm font-semibold text-slate-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.selectedSize.quantity_available || item.quantity)}
                          className="grid h-9 w-9 place-items-center text-slate-600 disabled:opacity-30 dark:text-slate-300"
                          aria-label="Increase quantity"
                        >+</button>
                      </div>
                      <span className="text-base font-bold text-slate-900 dark:text-white">
                        ₹{(item.selectedSize.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Order summary</h2>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <dt>Subtotal</dt>
                    <dd>₹{total.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <dt>Taxes</dt>
                    <dd className="text-slate-400">Calculated at checkout</dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10">
                  <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                  <span className="text-xl font-extrabold text-brand-700 dark:text-brand-400">₹{total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => router.push('/order')}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3.5 text-sm font-semibold text-white shadow-card transition hover:from-brand-500 hover:to-brand-600"
                >
                  Proceed to order
                </button>
                <Link
                  href="/"
                  className="mt-2 block text-center text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400"
                >
                  Continue shopping
                </Link>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
