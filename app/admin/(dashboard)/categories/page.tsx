import type { Metadata } from 'next';
import ManageCategories from '@/components/admin/manage-categories';

export const metadata: Metadata = {
  title: 'Categories',
};

export default function CategoriesPage() {
  return <ManageCategories />;
}
