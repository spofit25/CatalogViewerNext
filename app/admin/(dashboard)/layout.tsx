import type { ReactNode } from 'react';
import AuthGate from '@/components/admin/auth-gate';
import AdminShell from '@/components/admin/admin-shell';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <AdminShell>{children}</AdminShell>
    </AuthGate>
  );
}
