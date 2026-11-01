import type { Metadata } from 'next';
import ManageOrders from '@/components/admin/manage-orders';

export const metadata: Metadata = {
  title: 'Orders',
};

export default function OrdersPage() {
  return <ManageOrders />;
}
