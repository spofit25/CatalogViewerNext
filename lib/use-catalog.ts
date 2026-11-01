'use client';

// Fetches categories, master products and their size variants from Supabase
// and exposes everything the catalogue UI needs (filters, search, pagination).
import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import type { Product, Category, ProductSizeRow } from './types';

interface CategoryRow {
  id: number;
  category_name: string;
  category_description?: string;
}

interface ProductRow {
  id: number;
  product_name: string;
  category_name: string;
  created_at: string;
}

export function useCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minInches, setMinInches] = useState<number | null>(null);
  const [maxInches, setMaxInches] = useState<number | null>(null);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [categoryRes, productRes, sizeRes] = await Promise.all([
          supabase.from('categories').select('*').order('order', { ascending: true, nullsFirst: false }),
          supabase.from('master_products').select('*'),
          supabase.from('sub_products').select('*'),
        ]);

        if (categoryRes.error) throw categoryRes.error;
        if (productRes.error) throw productRes.error;
        if (sizeRes.error) throw sizeRes.error;

        const productData = (productRes.data as ProductRow[]) || [];
        const sizeData = (sizeRes.data as ProductSizeRow[]) || [];

        const productsWithSizes: Product[] = productData
          .map((p) => ({
            id: p.id,
            product_name: p.product_name,
            category_name: p.category_name,
            product_image: undefined,
            sizes: sizeData
              .filter((s) => s.product_name === p.product_name)
              .map((s) => ({
                size: s.size,
                price: s.price,
                quantity_available: s.quantity_available,
                product_image: s.product_image,
                inches: s.inches,
              })),
          }))
          .filter((p) => (p.sizes?.length ?? 0) > 0);

        setProducts(productsWithSizes);

        const fetchedCategories = (categoryRes.data as CategoryRow[]) || [];
        if (fetchedCategories.length === 0) {
          const unique = Array.from(new Set(productData.map((p) => p.category_name)));
          setCategories(unique.map((name, idx) => ({ id: idx + 1, category_name: name })));
        } else {
          setCategories(fetchedCategories);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset pagination whenever a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, minPrice, maxPrice, minInches, maxInches, availabilityFilter, selectedSizes, searchQuery]);

  const filteredProducts = useMemo<Product[]>(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((product) =>
        product.product_name.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      if (selectedCategory === 'Ready Stock') {
        filtered = filtered.filter((product) =>
          (product.sizes || []).some((size) => (size.quantity_available || 0) > 0)
        );
      } else {
        filtered = filtered.filter((product) => product.category_name === selectedCategory);
      }
    }

    if (minPrice !== null || maxPrice !== null) {
      filtered = filtered.filter((product) =>
        (product.sizes || []).some((size) => {
          if (minPrice !== null && size.price < minPrice) return false;
          if (maxPrice !== null && size.price > maxPrice) return false;
          return true;
        })
      );
    }

    if (minInches !== null || maxInches !== null) {
      filtered = filtered.filter((product) =>
        (product.sizes || []).some((size) => {
          const inches = size.inches;
          if (!inches) return false;
          if (minInches !== null && inches < minInches) return false;
          if (maxInches !== null && inches > maxInches) return false;
          return true;
        })
      );
    }

    if (availabilityFilter !== 'all') {
      filtered = filtered.filter((product) => {
        const sizes = product.sizes || [];
        if (sizes.length === 0) return false;
        if (availabilityFilter === 'in-stock') {
          return sizes.some((size) => (size.quantity_available || 0) > 0);
        }
        if (availabilityFilter === 'out-of-stock') {
          return sizes.every((size) => (size.quantity_available || 0) === 0);
        }
        return true;
      });
    }

    if (selectedSizes.length > 0) {
      filtered = filtered.filter((product) =>
        (product.sizes || []).some((size) => selectedSizes.includes(size.size))
      );
    }

    return filtered;
  }, [selectedCategory, minPrice, maxPrice, minInches, maxInches, availabilityFilter, selectedSizes, searchQuery, products]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const paginatedProducts = useMemo<Product[]>(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const categoryList: Category[] = [
    { id: 0, category_name: 'all', category_description: 'All products' },
    { id: -1, category_name: 'Ready Stock', category_description: 'Products currently in stock' },
    ...categories,
  ];

  const clearFilters = () => {
    setSelectedCategory('all');
    setMinPrice(null);
    setMaxPrice(null);
    setMinInches(null);
    setMaxInches(null);
    setAvailabilityFilter('all');
    setSelectedSizes([]);
    setSearchQuery('');
    setCurrentPage(1);
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (minPrice !== null || maxPrice !== null ? 1 : 0) +
    (minInches !== null || maxInches !== null ? 1 : 0) +
    (availabilityFilter !== 'all' ? 1 : 0) +
    selectedSizes.length;

  return {
    products: paginatedProducts,
    totalResults: filteredProducts.length,
    categories: categoryList,
    selectedCategory,
    onCategoryChange: setSelectedCategory,
    searchQuery,
    onSearchChange: setSearchQuery,
    minPrice,
    maxPrice,
    onMinPriceChange: setMinPrice,
    onMaxPriceChange: setMaxPrice,
    minInches,
    maxInches,
    onMinInchesChange: setMinInches,
    onMaxInchesChange: setMaxInches,
    availabilityFilter,
    onAvailabilityChange: setAvailabilityFilter,
    selectedSizes,
    onSizeToggle: (size: string) =>
      setSelectedSizes((prev) =>
        prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
      ),
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    itemsPerPage,
    onItemsPerPageChange: (items: number) => {
      setItemsPerPage(items);
      setCurrentPage(1);
    },
    clearFilters,
    activeFilterCount,
    loading,
    error,
  };
}

export type UseCatalogReturn = ReturnType<typeof useCatalog>;
