'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[var(--background)] text-sm text-slate-500">
        Loading admin…
      </div>
    );
  }

  return <>{children}</>;
}
