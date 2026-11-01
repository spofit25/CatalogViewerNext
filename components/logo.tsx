import Link from 'next/link';
import Image from 'next/image';

export default function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="flex shrink-0 items-center gap-2.5" aria-label="MNS-Traders home">
      <span>
        <Image src="/LOGO_WEB.svg" alt="MNS-Traders" width={52} height={52} />
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white">MNS-Traders</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-400">
          Catalogue
        </span>
      </span>
    </Link>
  );
}
