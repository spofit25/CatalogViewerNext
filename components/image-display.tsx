'use client';

import { useEffect, useState } from 'react';
import { getSignedUrl } from '@/lib/storage-utils';

interface ImageDisplayProps {
  imagePath?: string | null;
  alt?: string;
  className?: string;
}

/** Renders a product image stored in Supabase Storage (private bucket) via a signed URL. */
export default function ImageDisplay({ imagePath, alt = 'Product', className = '' }: ImageDisplayProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    let active = true;

    if (!imagePath) {
      setStatus('idle');
      setUrl(null);
      return;
    }

    setStatus('loading');
    getSignedUrl(imagePath)
      .then((signed) => {
        if (!active) return;
        setUrl(signed);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [imagePath]);

  if (status === 'idle' || status === 'error') {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800/60 dark:text-slate-500 ${className}`}>
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.4">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  if (status === 'loading') {
    return <div className={`h-full w-full animate-pulse bg-slate-100 dark:bg-slate-800/60 ${className}`} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url ?? ''}
      alt={alt}
      loading="lazy"
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
