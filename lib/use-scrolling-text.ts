'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { ScrollingText } from './types';

export function useScrollingText() {
  const [scrollingTexts, setScrollingTexts] = useState<ScrollingText[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScrollingTexts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('scrolling_text')
        .select('*')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setScrollingTexts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scrolling texts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScrollingTexts();
  }, [fetchScrollingTexts]);

  return { scrollingTexts, loading, error, refetch: fetchScrollingTexts };
}
