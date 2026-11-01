'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/lib/supabase';
import { useLoading } from '@/context/loading-context';
import type { Category, ScrollingText } from '@/lib/types';

const inputClass =
  'w-full rounded-xl border border-black/10 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-white/5 dark:text-white';
const btnPrimary =
  'h-10 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white transition hover:bg-brand-700';
const btnSecondary =
  'h-10 rounded-full border border-black/10 px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5';
const btnSm =
  'rounded-full px-3 py-1.5 text-xs font-semibold';

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      className="border-t border-black/5 dark:border-white/10"
    >
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...listeners}
            className="grid h-8 w-8 cursor-grab place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-white/10"
            aria-label="Drag to reorder"
          >
            ⋮⋮
          </button>
          {category.category_name}
        </div>
      </td>
      <td className="px-3 py-3 text-slate-500">{category.category_description || '—'}</td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`${btnSm} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`} onClick={() => onEdit(category)}>
            Edit
          </button>
          <button type="button" className={`${btnSm} bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`} onClick={() => onDelete(category.id)}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ManageCategories() {
  const { withLoading } = useLoading();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ category_name: '', category_description: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [scrollingTexts, setScrollingTexts] = useState<ScrollingText[]>([]);
  const [scrollingTextForm, setScrollingTextForm] = useState({ text_content: '' });
  const [editingScrollingTextId, setEditingScrollingTextId] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    void fetchCategories();
    void fetchScrollingTexts();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('order', { ascending: true, nullsFirst: false });
      if (err) throw err;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(async () => {
        if (editingId) {
          const { error: err } = await supabase.from('categories').update(formData).eq('id', editingId);
          if (err) throw err;
          setEditingId(null);
        } else {
          const { error: err } = await supabase.from('categories').insert([formData]);
          if (err) throw err;
        }
        setFormData({ category_name: '', category_description: '' });
        await fetchCategories();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving category');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await withLoading(async () => {
        const { error: err } = await supabase.from('categories').delete().eq('id', id);
        if (err) throw err;
        await fetchCategories();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting category');
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      category_name: category.category_name,
      category_description: category.category_description || '',
    });
    setEditingId(category.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);

    try {
      await withLoading(async () => {
        for (const [index, cat] of reordered.entries()) {
          const { error: err } = await supabase.from('categories').update({ order: index + 1 }).eq('id', cat.id);
          if (err) throw err;
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category order');
      await fetchCategories();
    }
  };

  const fetchScrollingTexts = async () => {
    try {
      const { data, error: err } = await supabase
        .from('scrolling_text')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setScrollingTexts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scrolling texts');
    }
  };

  const handleScrollingTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await withLoading(async () => {
        if (editingScrollingTextId) {
          const { error: err } = await supabase
            .from('scrolling_text')
            .update(scrollingTextForm)
            .eq('id', editingScrollingTextId);
          if (err) throw err;
          setEditingScrollingTextId(null);
        } else {
          const { error: err } = await supabase.from('scrolling_text').insert([scrollingTextForm]);
          if (err) throw err;
        }
        setScrollingTextForm({ text_content: '' });
        await fetchScrollingTexts();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving scrolling text');
    }
  };

  const handleScrollingTextDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this scrolling text?')) return;
    try {
      await withLoading(async () => {
        const { error: err } = await supabase.from('scrolling_text').delete().eq('id', id);
        if (err) throw err;
        await fetchScrollingTexts();
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting scrolling text');
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading categories…</p>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="text-lg font-extrabold">{editingId ? 'Edit' : 'Add'} category</h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Category name"
            value={formData.category_name}
            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
            required
            className={inputClass}
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.category_description}
            onChange={(e) => setFormData({ ...formData, category_description: e.target.value })}
            className={inputClass}
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btnPrimary}>
              {editingId ? 'Update' : 'Add'} category
            </button>
            {editingId && (
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setEditingId(null);
                  setFormData({ category_name: '', category_description: '' });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="text-lg font-extrabold">Categories</h2>
        {categories.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No categories found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={categories.map((cat) => cat.id)} strategy={verticalListSortingStrategy}>
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <SortableCategoryRow
                        key={cat.id}
                        category={cat}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="text-lg font-extrabold">{editingScrollingTextId ? 'Edit' : 'Add'} scrolling text</h2>
        <form onSubmit={handleScrollingTextSubmit} className="mt-4 space-y-3">
          <textarea
            placeholder="Enter scrolling text content"
            value={scrollingTextForm.text_content}
            onChange={(e) => setScrollingTextForm({ text_content: e.target.value })}
            rows={3}
            required
            className={inputClass}
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={btnPrimary}>
              {editingScrollingTextId ? 'Update' : 'Add'} scrolling text
            </button>
            {editingScrollingTextId && (
              <button
                type="button"
                className={btnSecondary}
                onClick={() => {
                  setEditingScrollingTextId(null);
                  setScrollingTextForm({ text_content: '' });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-slate-900/70">
        <h2 className="text-lg font-extrabold">Scrolling texts</h2>
        {scrollingTexts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No scrolling texts found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2">Content</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scrollingTexts.map((text) => (
                  <tr key={text.id} className="border-t border-black/5 dark:border-white/10">
                    <td className="px-3 py-3">{text.text_content}</td>
                    <td className="px-3 py-3 text-slate-500">{new Date(text.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className={`${btnSm} bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`}
                          onClick={() => {
                            setScrollingTextForm({ text_content: text.text_content });
                            setEditingScrollingTextId(text.id);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${btnSm} bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300`}
                          onClick={() => handleScrollingTextDelete(text.id)}
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
      </section>
    </div>
  );
}
