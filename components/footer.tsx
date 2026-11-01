import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-white/60 dark:border-white/5 dark:bg-slate-950/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-slate-500 sm:flex-row dark:text-slate-400">
        <p>© {new Date().getFullYear()} MNS-Traders. All rights reserved.</p>
        <div className="flex items-center gap-5">
          <Link href="/" className="transition hover:text-brand-600 dark:hover:text-brand-400">Catalogue</Link>
          <Link href="/cart" className="transition hover:text-brand-600 dark:hover:text-brand-400">Cart</Link>
          <Link href="/admin/login" className="transition hover:text-brand-600 dark:hover:text-brand-400">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
