'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/cart-context';
import { useLoading } from '@/context/loading-context';
import { supabase } from '@/lib/supabase';
import { sendOrderEmail } from '@/lib/email-service';
import Header from '@/components/header';
import Footer from '@/components/footer';

interface OrderFormData {
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  customerGstin?: string;
  billingAddress?: string;
}

export default function OrderPage() {
  const { items: cartItems, clearCart } = useCart();
  const { withLoading } = useLoading();
  const router = useRouter();
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerEmail: '',
    customerMobile: '',
    customerGstin: '',
    billingAddress: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const total = cartItems.reduce((sum, item) => sum + item.selectedSize.price * item.quantity, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof OrderFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const next: Partial<Record<keyof OrderFormData, string>> = {};
    if (!formData.customerName.trim()) next.customerName = 'Customer name is required';
    if (!formData.customerEmail.trim()) {
      next.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      next.customerEmail = 'Please enter a valid email';
    }
    if (!formData.customerMobile.trim()) {
      next.customerMobile = 'Mobile number is required';
    } else if (!/^[\d\s\-+]{10,15}$/.test(formData.customerMobile)) {
      next.customerMobile = 'Please enter a valid mobile number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (orderType: 'order' | 'quotation') => {
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await withLoading(async () => {
        const orderRef = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const orderData = {
          customer_name: formData.customerName,
          customer_email: formData.customerEmail,
          customer_mobile: formData.customerMobile,
          customer_gstin: formData.customerGstin || null,
          billing_address: formData.billingAddress || null,
          order_type: orderType,
          order_status: orderType === 'order' ? 'pending' : 'sent_quotation',
          products: cartItems.map((item) => ({
            product_id: item.id,
            product_name: item.product.product_name,
            price: item.selectedSize.price,
            quantity: item.quantity,
            size: item.selectedSize.size || null,
          })),
          total_amount: parseFloat(total.toFixed(2)),
          order_ref: orderRef,
          order_date: new Date().toISOString(),
          order_cancelled: false,
          order_completed: false,
        };

        const { error } = await supabase.from('orders').insert([orderData]).select().single();
        if (error) throw new Error(error.message.includes("order_ref") ? 'Database setup required: run the orders migration.' : error.message);

        await sendOrderEmail(
          formData.customerEmail,
          orderType === 'order' ? 'Your Order Confirmation' : 'Your Quotation Request',
          {
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            orderRef,
            orderType,
            products: orderData.products.map(({ product_name, price, quantity, size }) => ({
              product_name,
              price,
              quantity,
              ...(size ? { size } : {}),
            })),
            totalAmount: orderData.total_amount,
            orderDate: orderData.order_date,
          }
        );

        clearCart();
        setSubmitSuccess(true);
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const field =
    'h-11 w-full rounded-xl border border-black/5 bg-slate-50 px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white';

  if (cartItems.length === 0 && !submitSuccess) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header showSearch={false} />
        <main className="mx-auto grid w-full max-w-lg flex-1 place-items-center px-4 py-24 text-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Your cart is empty</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Add items to your cart before proceeding to order.
            </p>
            <Link href="/" className="mt-5 inline-block rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700">
              Continue shopping
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Header showSearch={false} />
        <main className="mx-auto grid w-full max-w-lg flex-1 place-items-center px-4 py-24 text-center">
          <div className="rounded-3xl border border-black/5 bg-white p-10 shadow-card dark:border-white/10 dark:bg-slate-900/70">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-slate-900 dark:text-white">Request submitted!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Thank you. A confirmation has been sent to {formData.customerEmail}.
            </p>
            <button onClick={() => router.push('/')} className="mt-6 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700">
              Continue shopping
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header showSearch={false} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <button onClick={() => router.push('/cart')} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600 dark:text-slate-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to cart
        </button>

        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Order information</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-card dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Customer details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Customer name *</label>
                <input id="customerName" name="customerName" value={formData.customerName} onChange={handleChange} disabled={isSubmitting} className={field} />
                {errors.customerName && <span className="mt-1 block text-xs text-rose-500">{errors.customerName}</span>}
              </div>
              <div>
                <label htmlFor="customerEmail" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email *</label>
                <input id="customerEmail" name="customerEmail" type="email" value={formData.customerEmail} onChange={handleChange} disabled={isSubmitting} className={field} />
                {errors.customerEmail && <span className="mt-1 block text-xs text-rose-500">{errors.customerEmail}</span>}
              </div>
              <div>
                <label htmlFor="customerMobile" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Mobile number *</label>
                <input id="customerMobile" name="customerMobile" type="tel" value={formData.customerMobile} onChange={handleChange} disabled={isSubmitting} className={field} />
                {errors.customerMobile && <span className="mt-1 block text-xs text-rose-500">{errors.customerMobile}</span>}
              </div>
              <div>
                <label htmlFor="customerGstin" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">GSTIN (optional)</label>
                <input id="customerGstin" name="customerGstin" value={formData.customerGstin} onChange={handleChange} disabled={isSubmitting} className={field} />
              </div>
              <div>
                <label htmlFor="billingAddress" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Billing address (optional)</label>
                <textarea id="billingAddress" name="billingAddress" rows={3} value={formData.billingAddress} onChange={handleChange} disabled={isSubmitting} className="w-full rounded-xl border border-black/5 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white" />
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Order summary</h2>
              <ul className="mt-4 space-y-3">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-600 dark:text-slate-300">
                      {item.product.product_name}
                      <span className="block text-xs text-slate-400">Size {item.selectedSize.size} · Qty {item.quantity}</span>
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">₹{(item.selectedSize.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 dark:border-white/10">
                <span className="font-semibold text-slate-900 dark:text-white">Total</span>
                <span className="text-xl font-extrabold text-brand-700 dark:text-brand-400">₹{total.toFixed(2)}</span>
              </div>

              {submitError && (
                <p className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">{submitError}</p>
              )}

              <div className="mt-5 space-y-2">
                <button
                  onClick={() => handleSubmit('order')}
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3.5 text-sm font-semibold text-white shadow-card transition hover:from-brand-500 hover:to-brand-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing…' : 'Place order'}
                </button>
                <button
                  onClick={() => handleSubmit('quotation')}
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-black/10 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
                >
                  {isSubmitting ? 'Processing…' : 'Get quotation'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

