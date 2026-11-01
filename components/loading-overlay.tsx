'use client';

export default function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-float dark:bg-slate-900">
        <span
          className="h-9 w-9 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600 dark:border-brand-900 dark:border-t-brand-400"
          aria-hidden
        />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Please wait…</span>
      </div>
    </div>
  );
}
