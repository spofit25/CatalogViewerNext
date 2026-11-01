// Shared domain types for the MNS-Traders catalogue.

export interface SizeOption {
  size: string;
  price: number;
  quantity_available?: number;
  product_image?: string;
  inches?: number;
}

export interface Product {
  id: number;
  product_name: string;
  category_name: string;
  product_image?: string;
  sizes?: SizeOption[];
}

export interface Category {
  id: number;
  category_name: string;
  category_description?: string;
  order?: number;
}

export interface MasterProduct {
  id: number;
  product_name: string;
  category_name: string;
}

export interface SubProduct {
  sub_product_id: number;
  product_name: string;
  size: string;
  price: number;
  quantity_available: number;
  product_image: string;
  inches?: number;
}

// Database row types
export interface ProductSizeRow {
  id: number;
  product_name: string;
  size: string;
  price: number;
  quantity_available: number;
  product_image: string;
  inches?: number;
  created_at: string;
  updated_at: string;
}

// Cart types
export interface CartItem {
  id: string; // unique identifier for cart item
  product: Product;
  selectedSize: SizeOption;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, selectedSize: SizeOption, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export interface ScrollingText {
  id: number;
  text_content: string;
  created_at: string;
}

export interface OrderProduct {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  size: string | null;
}

export interface Order {
  order_id: number;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_mobile: number | null;
  customer_gstin: string | null;
  billing_address: string | null;
  order_type: string;
  order_status: string;
  products: OrderProduct[];
  total_amount: number;
  updated_at: string;
  order_date: string;
  order_cancelled: boolean;
  order_completed: boolean;
  completed_date: string | null;
  cancelled_date: string | null;
}

export const SIZE_ORDER = ['SET', 'XL', 'L', 'M', 'S', 'XS'];
