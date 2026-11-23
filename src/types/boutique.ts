export type ProductCategory =
  | 'Bridal Silks'
  | 'Designer Kurtis'
  | 'Aari Blouses'
  | 'Lehengas';

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';

export type PaymentMethod = 'UPI' | 'COD';

export interface Product {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  sizes: string[];
  image_url: string;
  in_stock: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  saved_address: string;
  city: string;
  pincode: string;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  category: ProductCategory;
  price: number;
  size: string;
  quantity: number;
  image_url: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: PaymentMethod;
  upi_transaction_id: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export const CATEGORY_META: Record<
  ProductCategory,
  { en: string; ta: string; subtitle: string }
> = {
  'Bridal Silks': {
    en: 'Bridal Silks',
    ta: 'மணமகள் பட்டு',
    subtitle: 'Pure Mulberry Kanchipuram Korvai & Zari Weaves',
  },
  'Designer Kurtis': {
    en: 'Designer Kurtis',
    ta: 'டிசைனர் குர்தி',
    subtitle: 'Handloom Chanderi & Silk-Brocade Festive Ensembles',
  },
  'Aari Blouses': {
    en: 'Aari Blouses',
    ta: 'ஆரி பிளவுஸ்',
    subtitle: 'Bespoke Maggam Zardosi & Kasu Coin Handwork',
  },
  Lehengas: {
    en: 'Lehengas',
    ta: 'லெஹங்கா',
    subtitle: 'Woven Zari Brocade & Heritage Bridal Skirts',
  },
};
