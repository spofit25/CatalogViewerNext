import type { Metadata } from 'next';
import DashboardHome from '@/components/admin/dashboard-home';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function AdminPage() {
  return <DashboardHome />;
}
