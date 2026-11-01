'use client';

import { useScrollingText } from '@/lib/use-scrolling-text';

const FALLBACK = [
  'Wait for it… Big Sale Coming Soon!',
  'New arrivals added weekly — explore the latest collection',
  'Bulk & wholesale enquiries welcome',
];

export default function Marquee() {
  const { scrollingTexts } = useScrollingText();

  const source = scrollingTexts.length > 0 ? scrollingTexts.map((t) => t.text_content) : FALLBACK;
  // Duplicate the list so the translate(-50%) loop is seamless.
  const items = [...source, ...source];

  return (
    <div className="fixed top-16 z-10 w-full overflow-hidden border-y border-brand-900/10 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 py-2 text-white dark:border-white/5">
      <div className="flex w-max animate-marquee items-center gap-10 pr-10">
        {items.map((text, index) => (
          <span key={index} className="flex items-center gap-10 text-[13px] font-medium tracking-wide whitespace-nowrap">
            <span className="opacity-95">{text}</span>
            <span className="text-accent-400">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
