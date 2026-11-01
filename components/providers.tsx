'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
