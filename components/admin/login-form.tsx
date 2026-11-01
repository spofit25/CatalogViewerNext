'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useLoading } from '@/context/loading-context';
import Logo from '@/components/logo';

export default function AdminLoginForm() {
  const { signInWithEmail, user, loading } = useAuth();
  const { withLoading } = useLoading();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      router.replace('/admin/dashboard');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await withLoading(async () => {
        await signInWithEmail(email, password);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-card dark:border-white/10 dark:bg-slate-900/80">
        <Logo href="/" />
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white">Admin login</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign in to manage products, categories, and orders.
        </p>

        {error && (
          <div className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-black/10 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 w-full rounded-xl border border-black/10 bg-slate-50 px-3 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || submitting}
            className="h-11 w-full rounded-full bg-brand-600 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
