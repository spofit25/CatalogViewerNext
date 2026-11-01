'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { CartItem, CartContextType, Product, SizeOption } from '@/lib/types';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'mns_traders_cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing cart from localStorage:', error);
      }
    }
    setHydrated(true);
  }, []);

  // Persist cart whenever it changes
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, hydrated]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.id !== itemId);
      }
      return prev.map((item) => {
        if (item.id === itemId) {
          const maxQuantity = item.selectedSize.quantity_available || quantity;
          return { ...item, quantity: Math.min(quantity, maxQuantity) };
        }
        return item;
      });
    });
  }, []);

  const addItem = useCallback(
    (product: Product, selectedSize: SizeOption, quantity: number = 1) => {
      const itemId = `${product.id}-${selectedSize.size}`;
      setItems((prev) => {
        const existing = prev.find((item) => item.id === itemId);
        if (existing) {
          const maxQuantity = existing.selectedSize.quantity_available || existing.quantity + quantity;
          return prev.map((item) =>
            item.id === itemId
              ? { ...item, quantity: Math.min(item.quantity + quantity, maxQuantity) }
              : item
          );
        }
        return [
          ...prev,
          {
            id: itemId,
            product,
            selectedSize,
            quantity: Math.min(quantity, selectedSize.quantity_available || quantity),
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotalItems = useCallback(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const getTotalPrice = useCallback(
    () => items.reduce((total, item) => total + item.selectedSize.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
