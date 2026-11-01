import type { Metadata } from 'next';
import ManageProducts from '@/components/admin/manage-products';

export const metadata: Metadata = {
  title: 'Products',
};

export default function ProductsPage() {
  return <ManageProducts />;
}
