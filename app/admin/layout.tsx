import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../(shop)/globals.css';
import Providers from '@/components/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Admin',
    template: '%s · MNS-Traders Admin',
  },
  description: 'MNS-Traders catalogue admin for products, categories, and orders.',
};

export const viewport: Viewport = {
  themeColor: '#0d745e',
  width: 'device-width',
  initialScale: 1,
};

const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    var r = document.documentElement;
    r.classList.toggle('dark', t === 'dark');
    r.setAttribute('data-theme', t);
    r.style.colorScheme = t;
  } catch (e) {}
})();
`;

export default function AdminRootLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
