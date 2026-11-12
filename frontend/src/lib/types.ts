export type ProductCategory =
  | "shirts"
  | "pants"
  | "shoes"
  | "cargo-pants"
  | "trousers"
  | "t-shirts"
  | "jackets"
  | "hoodies";

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export interface SizeStock {
  size: string;
  stock: number;
}

export interface ProductColorway {
  color: string;
  images: string[];
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  category: ProductCategory;
  price: number;
  compareAtPrice?: number;
  sizes: SizeStock[];
  images: string[];
  /** Hang-rail color variants (usually 3: base + 2) */
  colorways?: ProductColorway[];
  description: string;
  featured?: boolean;
  colors?: string[];
  inStock?: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  avatar?: string;
  bio?: string;
  token?: string;
}

export interface CartItem {
  _id: string;
  product: Product;
  size: string;
  quantity: number;
  price: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  subtotal?: number;
}

export interface Order {
  _id: string;
  user?: string | { _id: string; name?: string; email?: string } | null;
  isGuest?: boolean;
  items: Array<{
    product: string;
    name: string;
    size: string;
    quantity: number;
    price: number;
    image: string;
    category?: string;
  }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    email?: string;
  };
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: OrderStatus | string;
  totalAmount: number;
  createdAt: string;
}

export interface DashboardStats {
  period?: string;
  kpis: {
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    returningBuyers: number;
    pendingOrders: number;
    productsCount: number;
    featuredCount?: number;
    trends: {
      orders: number;
      customers: number;
      revenue: number;
      returning: number;
    };
  };
  revenueByMonth: Array<{
    key: string;
    month: string;
    earning: number;
    sales: number;
    refunds: number;
  }>;
  salesOverview: {
    growth: number;
    sales: number;
    target: number;
  };
  recentSales: Array<{
    _id: string;
    orderId: string;
    date: string;
    customer: string;
    category: string;
    status: string;
    items: number;
    total: number;
    isGuest?: boolean;
  }>;
}

export interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  createdAt: string;
  href: string;
  unread: boolean;
}

export interface AdminCustomer {
  _id: string;
  name: string;
  email: string;
  type: "member" | "guest" | string;
  orders: number;
  spent: number;
  lastOrderAt?: string | null;
  createdAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
