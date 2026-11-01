'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { LoadingProvider } from '@/context/loading-context';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
