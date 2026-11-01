'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLoading } from '@/context/loading-context';
import type { Order } from '@/lib/types';

function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

function formatMobile(mobile: number | null) {
  if (!mobile) return 'N/A';
  return mobile.toString();
}

function statusClass(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-500';
    case 'cancelled':
      return 'bg-rose-500';
    case 'sent_quotation':
      return 'bg-sky-500';
    default:
      return 'bg-slate-500';
  }
}

export default function ManageOrders() {
  const { withLoading } = useLoading();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  useEffect(() => {
    void fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('order_status', filterStatus);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,order_ref.ilike.%${searchQuery}%`,
        );
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const refreshOrders = () => withLoading(fetchOrders);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await withLoading(async () => {
        const { error: err } = await supabase
          .from('orders')
          .update({
            order_status: newStatus,
            order_completed: newStatus === 'completed',
            order_cancelled: newStatus === 'cancelled',
            completed_date: newStatus === 'completed' ? new Date().toISOString() : null,
            cancelled_date: newStatus === 'cancelled' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq('order_id', orderId);
        if (err) throw err;
        await fetchOrders();
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status. Please try again.');
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus !== 'all' && order.order_status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        order.customer_name.toLowerCase().includes(query) ||
        order.customer_email.toLowerCase().includes(query) ||
        order.order_id.toString().includes(query)
      );
    }
    return true;
  });

  if (loading) {
    return <p className="text-sm text-slate-500">Loading orders…</p>;
  }

  if (error) {
    return (
      <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
        <p>{error}</p>
        <button type="button" onClick={() => void refreshOrders()} className="mt-2 font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search orders…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-11 flex-1 rounded-xl border border-black/10 bg-white px-3 text-sm outline-none focus:border-brand-400 dark:border-white/10 dark:bg-slate-900"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 rounded-xl border border-black/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-900"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="sent_quotation">Quotations sent</option>
        </select>
        <button
          type="button"
          onClick={() => void refreshOrders()}
          className="h-11 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Refresh
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-black/10 py-16 text-center text-sm text-slate-500 dark:border-white/10">
          No orders found matching your criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <article
              key={order.order_id}
              className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-card dark:border-white/10 dark:bg-slate-900/70"
            >
              <button
                type="button"
                className="flex w-full flex-col gap-2 px-4 py-4 text-left sm:flex-row sm:items-center sm:justify-between"
                onClick={() => setExpandedOrderId(expandedOrderId === order.order_id ? null : order.order_id)}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold">Order #{order.order_id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold uppercase text-white ${statusClass(order.order_status)}`}>
                      {order.order_status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.customer_name} · {order.customer_email}
                  </p>
                </div>
                <div className="text-sm text-slate-500 sm:text-right">
                  <p>{formatDate(order.created_at)}</p>
                  <p className="font-bold text-slate-900 dark:text-white">₹{order.total_amount.toFixed(2)}</p>
                </div>
              </button>

              {expandedOrderId === order.order_id && (
                <div className="space-y-5 border-t border-black/5 px-4 py-4 dark:border-white/10">
                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Customer</h3>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      <p><span className="text-slate-400">Name:</span> {order.customer_name}</p>
                      <p><span className="text-slate-400">Email:</span> {order.customer_email}</p>
                      <p><span className="text-slate-400">Mobile:</span> {formatMobile(order.customer_mobile)}</p>
                      <p><span className="text-slate-400">GSTIN:</span> {order.customer_gstin || 'N/A'}</p>
                      {order.billing_address && (
                        <p className="sm:col-span-2">
                          <span className="text-slate-400">Billing address:</span> {order.billing_address}
                        </p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Order</h3>
                    <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                      <p><span className="text-slate-400">Type:</span> {order.order_type}</p>
                      <p><span className="text-slate-400">Date:</span> {formatDate(order.order_date)}</p>
                      <p><span className="text-slate-400">Total:</span> ₹{order.total_amount.toFixed(2)}</p>
                      <p><span className="text-slate-400">Updated:</span> {formatDate(order.updated_at)}</p>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                      Products ({order.products.length})
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {order.products.map((product, index) => (
                        <li key={`${product.product_id}-${index}`} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-white/5">
                          <div>
                            <p className="font-semibold">{product.product_name}</p>
                            {product.size && <p className="text-xs text-slate-400">Size: {product.size}</p>}
                          </div>
                          <div className="text-right text-xs text-slate-500">
                            <p>Qty: {product.quantity}</p>
                            <p>₹{product.price.toFixed(2)} each</p>
                            <p className="font-bold text-slate-800 dark:text-white">
                              ₹{(product.price * product.quantity).toFixed(2)}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <select
                    value={order.order_status}
                    onChange={(e) => void handleStatusChange(order.order_id, e.target.value)}
                    disabled={order.order_status === 'completed' || order.order_status === 'cancelled'}
                    className="h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm disabled:opacity-60 dark:border-white/10 dark:bg-slate-950"
                  >
                    <option value="pending">Pending</option>
                    <option value="sent_quotation">Sent quotation</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
