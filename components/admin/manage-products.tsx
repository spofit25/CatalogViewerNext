'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLoading } from '@/context/loading-context';
import { deleteImage, getSignedUrl, publicUrlToPath, uploadImage } from '@/lib/storage-utils';
import type { Category, MasterProduct, SubProduct } from '@/lib/types';
import { SIZE_ORDER } from '@/lib/types';
import ImageEditor from './image-editor';

const inputClass =
  'w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white';
const btnPrimary =
  'h-10 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700';
const btnSecondary =
  'h-10 rounded-full border border-black/10 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300';
const btnSm = 'rounded-full px-3 py-1.5 text-xs font-semibold';

export default function ManageProducts() {
  const { withLoading } = useLoading();
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  const [subProducts, setSubProducts] = useState<SubProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ product_name: '', category_name: '' });
  const [subProductForm, setSubProductForm] = useState({
    product_name: '',
    size: '',
    price: 0,
    quantity_available: 0,
    product_image: '',
    inches: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [editingMasterProductId, setEditingMasterProductId] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ size: '', price: 0, quantity_available: 0, inches: 0 });
  const [editMasterForm, setEditMasterForm] = useState({ product_name: '', category_name: '' });
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [masterProductsSearch, setMasterProductsSearch] = useState('');
  const [variantsSearch, setVariantsSearch] = useState('');
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_name || !formData.category_name) {
      setError('Please fill in all fields');
      return;
    }
    try {
      await withLoading(async () => {
        const { error: err } = await supabase.from('master_products').insert([formData]);
        if (err) throw err;
        setFormData({ product_name: '', category_name: '' });
        await fetchData();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding product');
    }
  };

  const handleAddSubProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !subProductForm.product_name ||
      !subProductForm.size ||
      subProductForm.price <= 0 ||
      subProductForm.quantity_available < 0
    ) {
      setError('Please fill in all fields with valid values');
      return;
    }

    try {
      await withLoading(async () => {
        let imagePath = subProductForm.product_image || '';
        if (selectedFile) {
          const uploadedUrl = await uploadImage(selectedFile);
          if (!uploadedUrl) throw new Error('Failed to upload image');
          imagePath = publicUrlToPath(uploadedUrl);
        }

        const { error: err } = await supabase
          .from('sub_products')
          .insert([{ ...subProductForm, product_image: imagePath }]);
        if (err) throw err;

        setSubProductForm({
          product_name: '',
          size: '',
          price: 0,
          quantity_available: 0,
          product_image: '',
          inches: 0,
        });
        setSelectedFile(null);
        setPreviewUrl(null);
        await fetchData();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding variant');
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
              } catch (e) {
                console.warn('Storage deletion error', e);
              }
            }
          }
          await supabase.from('sub_products').delete().eq('product_name', productName);
        }
        const { error: err } = await supabase.from('master_products').delete().eq('id', id);
        if (err) throw err;
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
          } catch (e) {
            console.warn('Storage deletion error', e);
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

  const startEditVariant = async (variant: SubProduct) => {
    setEditingMasterProductId(null);
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
    setShowEditModal(true);
  };

  const startEditMasterProduct = (product: MasterProduct) => {
    setEditingVariantId(null);
    setEditingMasterProductId(product.id);
    setEditMasterForm({ product_name: product.product_name, category_name: product.category_name });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingVariantId(null);
    setEditingMasterProductId(null);
    setEditForm({ size: '', price: 0, quantity_available: 0, inches: 0 });
    setEditMasterForm({ product_name: '', category_name: '' });
    setEditSelectedFile(null);
    setEditPreviewUrl(null);
    setShowEditModal(false);
  };

  const handleUpdateVariant = async (id: number) => {
    if (!editingVariantId) return;
    try {
      await withLoading(async () => {
        let newImagePath: string | undefined;
        if (editSelectedFile) {
          const uploadedUrl = await uploadImage(editSelectedFile);
          if (!uploadedUrl) throw new Error('Failed to upload image');
          newImagePath = publicUrlToPath(uploadedUrl);
          const old = subProducts.find((s) => s.sub_product_id === id)?.product_image;
          if (old) {
            try {
              await deleteImage(old);
            } catch (e) {
              console.warn('Failed to remove old object during update', e);
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

        const { error: err } = await supabase.from('sub_products').update(payload).eq('sub_product_id', id);
        if (err) throw err;
        cancelEdit();
        await fetchData();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleUpdateMasterProduct = async (id: number) => {
    if (!editingMasterProductId) return;
    try {
      await withLoading(async () => {
        const { error: err } = await supabase
          .from('master_products')
          .update({
            product_name: editMasterForm.product_name,
            category_name: editMasterForm.category_name,
          })
          .eq('id', id);
        if (err) throw err;
        cancelEdit();
        await fetchData();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const editingVariant = subProducts.find((v) => v.sub_product_id === editingVariantId);
  const editingMasterProduct = masterProducts.find((p) => p.id === editingMasterProductId);
  const filteredMasterProducts = masterProducts.filter(
    (product) =>
      product.product_name.toLowerCase().includes(masterProductsSearch.toLowerCase()) ||
      product.category_name.toLowerCase().includes(masterProductsSearch.toLowerCase()),
  );
  const filteredSubProducts = subProducts.filter(
    (variant) =>
      variant.product_name.toLowerCase().includes(variantsSearch.toLowerCase()) ||
      variant.size.toLowerCase().includes(variantsSearch.toLowerCase()) ||
      variant.price.toString().includes(variantsSearch) ||
      (variant.quantity_available || 0).toString().includes(variantsSearch),
  );

  if (loading) return <p className="text-sm text-slate-500">Loading products…</p>;

  return (
    <>
      <div className="space-y-6">
        {error && (
          <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="text-lg font-extrabold">Add master product</h2>
            <form onSubmit={handleAddProduct} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Product name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                required
                className={inputClass}
              />
              <select
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                required
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.category_name}>
                    {cat.category_name}
                  </option>
                ))}
              </select>
              <button type="submit" className={btnPrimary}>Add product</button>
            </form>
          </section>

          <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
            <h2 className="text-lg font-extrabold">Add product variant</h2>
            <form onSubmit={handleAddSubProduct} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Product name (must exist)"
                value={subProductForm.product_name}
                onChange={(e) => setSubProductForm({ ...subProductForm, product_name: e.target.value })}
                list="product-names"
                required
                className={inputClass}
              />
              <datalist id="product-names">
                {masterProducts.map((p) => (
                  <option key={p.id} value={p.product_name} />
                ))}
              </datalist>
              <select
                value={subProductForm.size}
                onChange={(e) => setSubProductForm({ ...subProductForm, size: e.target.value })}
                required
                className={inputClass}
              >
                <option value="">Select size</option>
                {SIZE_ORDER.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <input type="number" step="0.01" placeholder="Inches" value={subProductForm.inches} onChange={(e) => setSubProductForm({ ...subProductForm, inches: parseFloat(e.target.value) })} className={inputClass} />
              <input type="number" step="0.01" placeholder="Price" value={subProductForm.price} onChange={(e) => setSubProductForm({ ...subProductForm, price: parseFloat(e.target.value) })} className={inputClass} />
              <input type="number" placeholder="Quantity available" value={subProductForm.quantity_available} onChange={(e) => setSubProductForm({ ...subProductForm, quantity_available: parseFloat(e.target.value) })} className={inputClass} />
              <label className="block text-sm font-medium">
                Product image
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 block w-full text-sm"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file) {
                      openImageEditor(URL.createObjectURL(file), false);
                    } else {
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
              <button type="submit" className={btnPrimary}>Add variant</button>
            </form>
          </section>
        </div>

        <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="text-lg font-extrabold">Master products</h2>
          <input
            type="text"
            placeholder="Search master products by name or category…"
            value={masterProductsSearch}
            onChange={(e) => setMasterProductsSearch(e.target.value)}
            className={`${inputClass} mt-3`}
          />
          {filteredMasterProducts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {masterProductsSearch ? 'No products match your search.' : 'No products found.'}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMasterProducts.map((product) => (
                    <tr key={product.id} className="border-t border-black/5 dark:border-white/10">
                      <td className="px-3 py-3">{product.product_name}</td>
                      <td className="px-3 py-3 text-slate-500">{product.category_name}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={`${btnSm} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`} onClick={() => startEditMasterProduct(product)}>Edit</button>
                          <button type="button" className={`${btnSm} bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`} onClick={() => void handleDeleteMasterProduct(product.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
          <h2 className="text-lg font-extrabold">Product variants</h2>
          <input
            type="text"
            placeholder="Search variants by product name, size, price, or quantity…"
            value={variantsSearch}
            onChange={(e) => setVariantsSearch(e.target.value)}
            className={`${inputClass} mt-3`}
          />
          {filteredSubProducts.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {variantsSearch ? 'No variants match your search.' : 'No variants found.'}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2">Product</th>
                    <th className="px-3 py-2">Size</th>
                    <th className="px-3 py-2">Inches</th>
                    <th className="px-3 py-2">Price</th>
                    <th className="px-3 py-2">Qty</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubProducts.map((variant) => (
                    <tr key={variant.sub_product_id} className="border-t border-black/5 dark:border-white/10">
                      <td className="px-3 py-3">{variant.product_name}</td>
                      <td className="px-3 py-3">{variant.size}</td>
                      <td className="px-3 py-3">{variant.inches ? `${variant.inches}"` : '—'}</td>
                      <td className="px-3 py-3">₹{variant.price.toFixed(2)}</td>
                      <td className="px-3 py-3">{variant.quantity_available}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" className={`${btnSm} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`} onClick={() => void startEditVariant(variant)}>Edit</button>
                          <button type="button" className={`${btnSm} bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`} onClick={() => void handleDeleteSubProduct(variant.sub_product_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {showEditModal && (editingVariant || editingMasterProduct) && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-0 sm:place-items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 dark:bg-slate-900 sm:rounded-3xl">
            {editingVariant ? (
              <>
                <h3 className="text-lg font-extrabold">Edit product variant</h3>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm">Size
                    <select className={`${inputClass} mt-1`} value={editForm.size} onChange={(e) => setEditForm({ ...editForm, size: e.target.value })}>
                      <option value="">Select size</option>
                      {SIZE_ORDER.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                  </label>
                  <label className="block text-sm">Price
                    <input className={`${inputClass} mt-1`} type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })} />
                  </label>
                  <label className="block text-sm">Quantity available
                    <input className={`${inputClass} mt-1`} type="number" value={editForm.quantity_available} onChange={(e) => setEditForm({ ...editForm, quantity_available: parseFloat(e.target.value) })} />
                  </label>
                  <label className="block text-sm">Inches
                    <input className={`${inputClass} mt-1`} type="number" step="0.01" value={editForm.inches} onChange={(e) => setEditForm({ ...editForm, inches: parseFloat(e.target.value) })} />
                  </label>
                  <label className="block text-sm">Replace image
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
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className={btnSecondary} onClick={cancelEdit}>Cancel</button>
                  <button type="button" className={btnPrimary} onClick={() => void handleUpdateVariant(editingVariant.sub_product_id)}>Save</button>
                </div>
              </>
            ) : editingMasterProduct ? (
              <>
                <h3 className="text-lg font-extrabold">Edit master product</h3>
                <div className="mt-4 space-y-3">
                  <label className="block text-sm">Product name
                    <input className={`${inputClass} mt-1`} type="text" value={editMasterForm.product_name} onChange={(e) => setEditMasterForm({ ...editMasterForm, product_name: e.target.value })} />
                  </label>
                  <label className="block text-sm">Category
                    <select className={`${inputClass} mt-1`} value={editMasterForm.category_name} onChange={(e) => setEditMasterForm({ ...editMasterForm, category_name: e.target.value })}>
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.category_name}>{cat.category_name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" className={btnSecondary} onClick={cancelEdit}>Cancel</button>
                  <button type="button" className={btnPrimary} onClick={() => void handleUpdateMasterProduct(editingMasterProduct.id)}>Save</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {showImageEditor && (
        <ImageEditor imageSrc={imageEditorSrc} onSave={handleImageSave} onCancel={closeImageEditor} />
      )}
    </>
  );
}
