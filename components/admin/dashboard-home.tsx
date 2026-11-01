import Link from 'next/link';

const CARDS = [
  {
    href: '/admin/categories',
    title: 'Manage categories',
    body: 'Add, edit, reorder, or delete product categories and scrolling text.',
  },
  {
    href: '/admin/products',
    title: 'Manage products',
    body: 'Add, edit, or delete master products and their size variants.',
  },
  {
    href: '/admin/orders',
    title: 'Manage orders',
    body: 'View, filter, and update customer orders and quotations.',
  },
];

export default function DashboardHome() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map((card) => (
        <div
          key={card.href}
          className="flex flex-col rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70"
        >
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{card.title}</h2>
          <p className="mt-2 flex-1 text-sm text-slate-500 dark:text-slate-400">{card.body}</p>
          <Link
            href={card.href}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Open
          </Link>
        </div>
      ))}
    </div>
  );
}
