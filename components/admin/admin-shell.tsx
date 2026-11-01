'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Logo from '@/components/logo';
import ThemeToggle from '@/components/theme-toggle';

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', match: (p: string) => p === '/admin' || p.startsWith('/admin/dashboard') },
  { href: '/admin/categories', label: 'Categories', match: (p: string) => p.startsWith('/admin/categories') },
  { href: '/admin/products', label: 'Products', match: (p: string) => p.startsWith('/admin/products') },
  { href: '/admin/orders', label: 'Orders', match: (p: string) => p.startsWith('/admin/orders') },
];

function titleFor(pathname: string) {
  if (pathname.startsWith('/admin/categories')) return 'Manage categories';
  if (pathname.startsWith('/admin/products')) return 'Manage products';
  if (pathname.startsWith('/admin/orders')) return 'Manage orders';
  return 'Admin dashboard';
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleNav = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setOpen(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const toggleMenu = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setCollapsed((v) => !v);
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <div className={`min-h-dvh bg-[var(--background)] ${collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-64'}`}>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/5 bg-white/80 px-4 backdrop-blur-xl dark:border-white/5 dark:bg-slate-950/70">
        <button
          type="button"
          onClick={toggleMenu}
          aria-label="Toggle menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-black/5 bg-white/70 dark:border-white/10 dark:bg-white/5"
        >
          <span className="flex w-4 flex-col gap-1">
            <span className="block h-0.5 w-full bg-slate-700 dark:bg-slate-200" />
            <span className="block h-0.5 w-full bg-slate-700 dark:bg-slate-200" />
            <span className="block h-0.5 w-full bg-slate-700 dark:bg-slate-200" />
          </span>
        </button>
        <h1 className="flex-1 text-base font-extrabold text-slate-900 dark:text-white sm:text-lg">
          {titleFor(pathname)}
        </h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{user?.email}</p>
        <ThemeToggle />
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-black/5 bg-slate-950 text-white transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'lg:w-[4.5rem]' : 'lg:w-64'} w-64 lg:translate-x-0`}
      >
        <div className="flex h-16 items-center px-4">
          <Logo href="/admin/dashboard" />
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNav}
                className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={collapsed ? 'lg:mx-auto' : ''}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            className="flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-white"
          >
            View shop
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-300 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
