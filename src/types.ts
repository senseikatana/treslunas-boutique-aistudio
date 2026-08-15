export type PageView =
  | 'home'
  | 'collection'
  | 'product-detail'
  | 'cart'
  | 'checkout'
  | 'order-success'
  | 'about'
  | 'branding'
  | 'contact'
  | 'not-found';

export type Category = 'Vestidos' | 'Tops & Blusas' | 'Pantalones' | 'Accesorios' | 'Joyería';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: Category;
  description: string;
  erikaAdvice?: string;
  images: string[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  isNew?: boolean;
  isBestseller?: boolean;
  completeTheLookIds?: string[];
  details: string[];
  careGuide: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: { name: string; hex: string };
  quantity: number;
}

export interface ShippingDetails {
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  email: string;
  phone?: string;
  deliveryOption: 'local' | 'standard';
}

export type PaymentMethod = 'card' | 'paypal' | 'bizum' | 'apple_pay' | 'google_pay' | 'klarna';

export interface Order {
  id: string;
  items: CartItem[];
  shipping: ShippingDetails;
  paymentMethod: PaymentMethod;
  subtotal: number;
  shippingCost: number;
  total: number;
  createdAt: string;
  status: 'Confirmado' | 'En preparación' | 'En camino';
}
