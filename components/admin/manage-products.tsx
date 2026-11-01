'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLoading } from '@/context/loading-context';
import { deleteImage, getSignedUrl, publicUrlToPath, uploadImage } from '@/lib/storage-utils';
import type { Category, MasterProduct, SubProduct } from '@/lib/types';
import { SIZE_ORDER } from '@/lib/types';
import ImageDisplay from '@/components/image-display';
import ImageEditor from './image-editor';

const inputClass =
  'w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white';
const btnPrimary =
  'h-10 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700';
const btnSecondary =
  'h-10 rounded-full border border-black/10 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5';
const btnSm = 'rounded-full px-3 py-1.5 text-xs font-semibold';

type ModalKind = 'add-master' | 'edit-master' | 'add-variant' | 'edit-variant' | null;

const emptyVariantForm = {
  size: '',
  price: 0,
  quantity_available: 0,
  product_image: '',
  inches: 0,
};

export default function ManageProducts() {
  const { withLoading } = useLoading();
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [subProducts, setSubProducts] = useState<SubProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const [masterSearch, setMasterSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [variantsSearch, setVariantsSearch] = useState('');

  const [modal, setModal] = useState<ModalKind>(null);
  const [masterForm, setMasterForm] = useState({ product_name: '', category_name: '' });
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);

  const [variantForm, setVariantForm] = useState(emptyVariantForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ size: '', price: 0, quantity_available: 0, inches: 0 });
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorSrc, setImageEditorSrc] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const variantCountByName = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of subProducts) {
      counts.set(v.product_name, (counts.get(v.product_name) || 0) + 1);
    }
    return counts;
  }, [subProducts]);

  const filteredMasterProducts = useMemo(() => {
    const q = masterSearch.toLowerCase().trim();
    return masterProducts.filter((product) => {
      const matchesCategory = categoryFilter === 'all' || product.category_name === categoryFilter;
      const matchesSearch =
        !q ||
        product.product_name.toLowerCase().includes(q) ||
        product.category_name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [masterProducts, masterSearch, categoryFilter]);

  const selectedProduct =
    masterProducts.find((p) => p.id === selectedProductId) ??
    filteredMasterProducts[0] ??
    masterProducts[0] ??
    null;

  useEffect(() => {
    if (!selectedProductId && masterProducts.length > 0) {
      setSelectedProductId(masterProducts[0].id);
    } else if (
      selectedProductId &&
      masterProducts.length > 0 &&
      !masterProducts.some((p) => p.id === selectedProductId)
    ) {
      setSelectedProductId(masterProducts[0].id);
    } else if (masterProducts.length === 0) {
      setSelectedProductId(null);
    }
  }, [masterProducts, selectedProductId]);

  const selectedVariants = useMemo(() => {
    if (!selectedProduct) return [];
    const q = variantsSearch.toLowerCase().trim();
    return subProducts.filter((variant) => {
      if (variant.product_name !== selectedProduct.product_name) return false;
      if (!q) return true;
      return (
        variant.size.toLowerCase().includes(q) ||
        variant.price.toString().includes(q) ||
        (variant.quantity_available || 0).toString().includes(q) ||
        (variant.inches || 0).toString().includes(q)
      );
    });
  }, [subProducts, selectedProduct, variantsSearch]);

  const openImageEditor = (imageSrc: string, editMode = false) => {
    setImageEditorSrc(imageSrc);
    setIsEditMode(editMode);
    setShowImageEditor(true);
  };

  const closeImageEditor = () => {
    setShowImageEditor(false);
    setImageEditorSrc('');
    setIsEditMode(false);
  };

  const handleImageSave = (croppedFile: File) => {
    if (isEditMode) {
      setEditSelectedFile(croppedFile);
      setEditPreviewUrl(URL.createObjectURL(croppedFile));
    } else {
      setSelectedFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedFile));
    }
    closeImageEditor();
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [masterRes, subRes, catRes] = await Promise.all([
        supabase.from('master_products').select('*'),
        supabase.from('sub_products').select('*'),
        supabase.from('categories').select('*'),
      ]);
      if (masterRes.error) throw masterRes.error;
      if (subRes.error) throw subRes.error;
      if (catRes.error) throw catRes.error;
      setMasterProducts(masterRes.data || []);
      setSubProducts((subRes.data || []) as SubProduct[]);
      setCategories(catRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setModal(null);
    setEditingMasterId(null);
    setEditingVariantId(null);
    setMasterForm({ product_name: '', category_name: '' });
    setVariantForm(emptyVariantForm);
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditForm({ size: '', price: 0, quantity_available: 0, inches: 0 });
    setEditSelectedFile(null);
    setEditPreviewUrl(null);
  };

  const openAddMaster = () => {
    setMasterForm({ product_name: '', category_name: '' });
    setEditingMasterId(null);
    setModal('add-master');
  };

  const openEditMaster = (product: MasterProduct) => {
    setEditingMasterId(product.id);
    setMasterForm({ product_name: product.product_name, category_name: product.category_name });
    setModal('edit-master');
  };

  const openAddVariant = () => {
    if (!selectedProduct) return;
    setVariantForm(emptyVariantForm);
    setSelectedFile(null);
    setPreviewUrl(null);
    setModal('add-variant');
  };

  const openEditVariant = async (variant: SubProduct) => {
    setEditingVariantId(variant.sub_product_id);
    setEditForm({
      size: variant.size,
      price: variant.price,
      quantity_available: variant.quantity_available,
      inches: variant.inches || 0,
    });
    setEditSelectedFile(null);
    let signedUrl: string | null = null;
    if (variant.product_image) {
      try {
        signedUrl = await withLoading(async () => getSignedUrl(variant.product_image));
      } catch (err) {
        console.error('Failed to get signed URL for preview:', err);
      }
    }
    setEditPreviewUrl(signedUrl);
    setModal('edit-variant');
  };

  const selectProduct = (product: MasterProduct) => {
    setSelectedProductId(product.id);
    setVariantsSearch('');
    setMobileDetailOpen(true);
  };

  const handleSaveMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterForm.product_name || !masterForm.category_name) {
      setError('Please fill in all fields');
      return;
    }
    try {
      await withLoading(async () => {
        if (modal === 'edit-master' && editingMasterId) {
          const { error: err } = await supabase
            .from('master_products')
            .update({
              product_name: masterForm.product_name,
              category_name: masterForm.category_name,
            })
            .eq('id', editingMasterId);
          if (err) throw err;
        } else {
          const { data, error: err } = await supabase
            .from('master_products')
            .insert([masterForm])
            .select()
            .single();
          if (err) throw err;
          if (data?.id) setSelectedProductId(data.id);
        }
        closeModal();
        await fetchData();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving product');
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!variantForm.size || variantForm.price <= 0 || variantForm.quantity_available < 0) {
      setError('Please fill in all fields with valid values');
      return;
    }

    try {
      await withLoading(async () => {
        let imagePath = variantForm.product_image || '';
        if (selectedFile) {
          const uploadedUrl = await uploadImage(selectedFile);
          if (!uploadedUrl) throw new Error('Failed to upload image');
          imagePath = publicUrlToPath(uploadedUrl);
        }

        const { error: err } = await supabase.from('sub_products').insert([
          {
            ...variantForm,
            product_name: selectedProduct.product_name,
            product_image: imagePath,
          },
        ]);
        if (err) throw err;
        closeModal();
        await fetchData();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding variant');
    }
  };

  const handleUpdateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariantId) return;
    try {
      await withLoading(async () => {
        let newImagePath: string | undefined;
        if (editSelectedFile) {
          const uploadedUrl = await uploadImage(editSelectedFile);
          if (!uploadedUrl) throw new Error('Failed to upload image');
          newImagePath = publicUrlToPath(uploadedUrl);
          const old = subProducts.find((s) => s.sub_product_id === editingVariantId)?.product_image;
          if (old) {
            try {
              await deleteImage(old);
            } catch (err) {
              console.warn('Failed to remove old object during update', err);
            }
          }
        }

        const payload: Partial<SubProduct> = {
          size: editForm.size,
          price: editForm.price,
          quantity_available: editForm.quantity_available,
          inches: editForm.inches,
        };
        if (newImagePath !== undefined) payload.product_image = newImagePath;

        const { error: err } = await supabase
          .from('sub_products')
          .update(payload)
          .eq('sub_product_id', editingVariantId);
        if (err) throw err;
        closeModal();
        await fetchData();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteMasterProduct = async (id: number) => {
    if (!confirm('Delete this product and all its variants?')) return;
    try {
      await withLoading(async () => {
        const master = masterProducts.find((p) => p.id === id);
        const productName = master?.product_name;
        if (productName) {
          const variants = subProducts.filter((v) => v.product_name === productName);
          for (const v of variants) {
            if (v.product_image) {
              try {
                await deleteImage(v.product_image);
              } catch (err) {
                console.warn('Storage deletion error', err);
              }
            }
          }
          await supabase.from('sub_products').delete().eq('product_name', productName);
        }
        const { error: err } = await supabase.from('master_products').delete().eq('id', id);
        if (err) throw err;
        if (selectedProductId === id) {
          setMobileDetailOpen(false);
        }
        await fetchData();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting product');
    }
  };

  const handleDeleteSubProduct = async (id: number) => {
    if (!confirm('Delete this variant?')) return;
    try {
      await withLoading(async () => {
        const variant = subProducts.find((v) => v.sub_product_id === id);
        if (variant?.product_image) {
          try {
            await deleteImage(variant.product_image);
          } catch (err) {
            console.warn('Storage deletion error', err);
          }
        }
        const { error: err } = await supabase.from('sub_products').delete().eq('sub_product_id', id);
        if (err) throw err;
        await fetchData();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting variant');
    }
  };

  if (loading) return <p className="text-sm text-slate-500">Loading products…</p>;

  const masterList = (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-black/5 bg-white shadow-card dark:border-white/10 dark:bg-slate-900/70">
      <div className="border-b border-black/5 p-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold">Products</h2>
          <button type="button" className={btnPrimary} onClick={openAddMaster}>
            Add product
          </button>
        </div>
        <div className="mt-3 space-y-2">
          <input
            type="text"
            placeholder="Search by name or category…"
            value={masterSearch}
            onChange={(e) => setMasterSearch(e.target.value)}
            className={inputClass}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={inputClass}
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.category_name}>
                {cat.category_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filteredMasterProducts.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-slate-500">
            {masterSearch || categoryFilter !== 'all'
              ? 'No products match your filters.'
              : 'No products yet. Add your first product.'}
          </p>
        ) : (
          <ul className="space-y-1">
            {filteredMasterProducts.map((product) => {
              const count = variantCountByName.get(product.product_name) || 0;
              const selected = selectedProduct?.id === product.id;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => selectProduct(product)}
                    className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                      selected
                        ? 'bg-brand-50 ring-1 ring-brand-500/30 dark:bg-brand-500/10'
                        : 'hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {product.product_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">{product.category_name}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {count} {count === 1 ? 'variant' : 'variants'}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );

  const detailPanel = (
    <section className="flex h-full min-h-0 flex-col rounded-3xl border border-black/5 bg-white shadow-card dark:border-white/10 dark:bg-slate-900/70">
      {!selectedProduct ? (
        <div className="grid flex-1 place-items-center p-8 text-center">
          <div>
            <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
              Select a product to manage variants
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Choose a master product from the list, then add or edit its sizes.
            </p>
            <button type="button" className={`${btnPrimary} mt-4`} onClick={openAddMaster}>
              Add product
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="border-b border-black/5 p-4 dark:border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  type="button"
                  className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 lg:hidden"
                  onClick={() => setMobileDetailOpen(false)}
                >
                  ← Back to products
                </button>
                <h2 className="truncate text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedProduct.product_name}
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{selectedProduct.category_name}</p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className={`${btnSm} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`}
                  onClick={() => openEditMaster(selectedProduct)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={`${btnSm} bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`}
                  onClick={() => void handleDeleteMasterProduct(selectedProduct.id)}
                >
                  Delete
                </button>
                <button type="button" className={btnPrimary} onClick={openAddVariant}>
                  Add variant
                </button>
              </div>
            </div>
            <input
              type="text"
              placeholder="Search variants by size, price, or quantity…"
              value={variantsSearch}
              onChange={(e) => setVariantsSearch(e.target.value)}
              className={`${inputClass} mt-3`}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {selectedVariants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 px-4 py-12 text-center dark:border-white/10">
                <p className="text-sm text-slate-500">
                  {variantsSearch
                    ? 'No variants match your search.'
                    : 'No variants for this product yet.'}
                </p>
                {!variantsSearch && (
                  <button type="button" className={`${btnPrimary} mt-4`} onClick={openAddVariant}>
                    Add first variant
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Size</th>
                      <th className="px-3 py-2">Inches</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedVariants.map((variant) => (
                      <tr
                        key={variant.sub_product_id}
                        className="border-t border-black/5 dark:border-white/10"
                      >
                        <td className="px-3 py-3">
                          <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100 dark:bg-white/5">
                            <ImageDisplay
                              imagePath={variant.product_image}
                              alt={variant.product_name}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3 font-medium">{variant.size}</td>
                        <td className="px-3 py-3">{variant.inches ? `${variant.inches}"` : '—'}</td>
                        <td className="px-3 py-3">₹{variant.price.toFixed(2)}</td>
                        <td className="px-3 py-3">{variant.quantity_available}</td>
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className={`${btnSm} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`}
                              onClick={() => void openEditVariant(variant)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className={`${btnSm} bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`}
                              onClick={() => void handleDeleteSubProduct(variant.sub_product_id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );

  return (
    <>
      <div className="space-y-4">
        {error && (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Desktop: side-by-side master-detail */}
        <div className="hidden h-[calc(100dvh-10rem)] min-h-[32rem] gap-4 lg:grid lg:grid-cols-[minmax(280px,36%)_1fr]">
          {masterList}
          {detailPanel}
        </div>

        {/* Mobile: list, then full-panel detail */}
        <div className="lg:hidden">
          <div className="min-h-[28rem]">{masterList}</div>
          {mobileDetailOpen && selectedProduct && (
            <div className="fixed inset-0 z-40 bg-[var(--background)] pt-[env(safe-area-inset-top)]">
              <div className="flex h-full flex-col p-3">{detailPanel}</div>
            </div>
          )}
        </div>
      </div>

      {(modal === 'add-master' || modal === 'edit-master') && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 dark:bg-slate-900 sm:rounded-3xl">
            <h3 className="text-lg font-extrabold">
              {modal === 'edit-master' ? 'Edit product' : 'Add product'}
            </h3>
            <form onSubmit={handleSaveMaster} className="mt-4 space-y-3">
              <label className="block text-sm">
                Product name
                <input
                  className={`${inputClass} mt-1`}
                  type="text"
                  value={masterForm.product_name}
                  onChange={(e) => setMasterForm({ ...masterForm, product_name: e.target.value })}
                  required
                />
              </label>
              <label className="block text-sm">
                Category
                <select
                  className={`${inputClass} mt-1`}
                  value={masterForm.category_name}
                  onChange={(e) => setMasterForm({ ...masterForm, category_name: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.category_name}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" className={btnSecondary} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'add-variant' && selectedProduct && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-slate-900 sm:rounded-3xl">
            <h3 className="text-lg font-extrabold">Add variant</h3>
            <p className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
              {selectedProduct.product_name}
            </p>
            <form onSubmit={handleAddVariant} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Size
                  <select
                    className={`${inputClass} mt-1`}
                    value={variantForm.size}
                    onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                    required
                  >
                    <option value="">Select size</option>
                    {SIZE_ORDER.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Inches
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    step="0.01"
                    value={variantForm.inches}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, inches: parseFloat(e.target.value) || 0 })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Price
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    step="0.01"
                    value={variantForm.price}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, price: parseFloat(e.target.value) || 0 })
                    }
                    required
                  />
                </label>
                <label className="block text-sm">
                  Quantity available
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    value={variantForm.quantity_available}
                    onChange={(e) =>
                      setVariantForm({
                        ...variantForm,
                        quantity_available: parseFloat(e.target.value) || 0,
                      })
                    }
                    required
                  />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Product image
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) openImageEditor(URL.createObjectURL(file), false);
                    else {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }
                  }}
                />
              </label>
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Selected" className="mx-auto max-h-36 rounded-xl" />
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" className={btnSecondary} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary}>
                  Add variant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'edit-variant' && editingVariantId && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 dark:bg-slate-900 sm:rounded-3xl">
            <h3 className="text-lg font-extrabold">Edit variant</h3>
            {selectedProduct && (
              <p className="mt-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-500/15 dark:text-brand-300">
                {selectedProduct.product_name}
              </p>
            )}
            <form onSubmit={handleUpdateVariant} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  Size
                  <select
                    className={`${inputClass} mt-1`}
                    value={editForm.size}
                    onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}
                  >
                    <option value="">Select size</option>
                    {SIZE_ORDER.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  Inches
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    step="0.01"
                    value={editForm.inches}
                    onChange={(e) =>
                      setEditForm({ ...editForm, inches: parseFloat(e.target.value) || 0 })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Price
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    step="0.01"
                    value={editForm.price}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })
                    }
                  />
                </label>
                <label className="block text-sm">
                  Quantity available
                  <input
                    className={`${inputClass} mt-1`}
                    type="number"
                    value={editForm.quantity_available}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        quantity_available: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </label>
              </div>
              <label className="block text-sm">
                Replace image
                <input
                  className="mt-1 block w-full text-sm"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) openImageEditor(URL.createObjectURL(file), true);
                    else {
                      setEditSelectedFile(null);
                      setEditPreviewUrl(null);
                    }
                  }}
                />
              </label>
              {editPreviewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={editPreviewUrl} alt="Preview" className="mx-auto max-h-36 rounded-xl" />
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" className={btnSecondary} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className={btnPrimary}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImageEditor && (
        <ImageEditor imageSrc={imageEditorSrc} onSave={handleImageSave} onCancel={closeImageEditor} />
      )}
    </>
  );
}
