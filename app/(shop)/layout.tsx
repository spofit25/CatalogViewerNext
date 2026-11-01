import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "MNS-Traders Catalogue",
    template: "%s · MNS-Traders",
  },
  description:
    "Browse the MNS-Traders product catalogue, compare sizes and prices, and place orders or request quotations online.",
};

export const viewport: Viewport = {
  themeColor: "#0d745e",
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before paint to avoid a flash of the wrong color scheme.
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
        {/* Global watermark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/image.svg"
          alt=""
          aria-hidden
          className="pointer-events-none fixed bottom-3 right-3 z-10 w-40 opacity-[0.06] select-none dark:opacity-[0.09]"
        />
      </body>
    </html>
  );
}
