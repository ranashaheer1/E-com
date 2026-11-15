import axios, { AxiosError } from "axios";
import type {
  AdminCustomer,
  AdminNotification,
  ApiResponse,
  Cart,
  DashboardStats,
  Order,
  Product,
  User,
} from "./types";

/**
 * Same-origin `/api` on Vercel (Next + Express catch-all).
 * Override with NEXT_PUBLIC_API_URL only if API is hosted separately.
 */
const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  (typeof window !== "undefined" ? "/api" : "http://127.0.0.1:3000/api");

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  /** Fail fast when API/DB is down instead of hanging the storefront */
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("unknown_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (axios.isAxiosError(error)) {
    const ax = error as AxiosError<{ message?: string }>;
    return ax.response?.data?.message || ax.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function fetchProducts(params?: {
  category?: string;
  featured?: boolean;
  search?: string;
  limit?: number;
}) {
  const response = await api.get<ApiResponse<Product[]>>("/products", {
    params: {
      ...params,
      featured: params?.featured === true ? "true" : undefined,
    },
  });
  return response.data;
}

export async function fetchProduct(id: string) {
  const { data } = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return data.data;
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<ApiResponse<User>>("/auth/login", { email, password });
  return data.data;
}

export async function adminLoginRequest(password: string, email?: string) {
  const { data } = await api.post<ApiResponse<User>>("/auth/admin-login", {
    password,
    email,
  });
  return data.data;
}

export async function registerRequest(name: string, email: string, password: string) {
  const { data } = await api.post<ApiResponse<User>>("/auth/register", {
    name,
    email,
    password,
  });
  return data.data;
}

export async function fetchCart() {
  const { data } = await api.get<ApiResponse<Cart>>("/cart");
  return data.data;
}

export async function addToCartRequest(productId: string, size: string, quantity = 1) {
  const { data } = await api.post<ApiResponse<Cart>>("/cart", {
    productId,
    size,
    quantity,
  });
  return data.data;
}

export async function updateCartItemRequest(itemId: string, quantity: number) {
  const { data } = await api.put<ApiResponse<Cart>>(`/cart/${itemId}`, { quantity });
  return data.data;
}

export async function removeCartItemRequest(itemId: string) {
  const { data } = await api.delete<ApiResponse<Cart>>(`/cart/${itemId}`);
  return data.data;
}

export async function createOrderRequest(payload: {
  shippingAddress: Order["shippingAddress"];
  paymentMethod: string;
  items?: Array<{ productId: string; size: string; quantity: number }>;
}) {
  const { data } = await api.post<ApiResponse<Order>>("/orders", payload);
  return data.data;
}

export async function fetchOrders() {
  const { data } = await api.get<ApiResponse<Order[]>>("/orders");
  return data.data;
}

export async function fetchAdminStats(period?: string) {
  const { data } = await api.get<ApiResponse<DashboardStats>>("/admin/stats", {
    params: period ? { period } : undefined,
  });
  return data.data;
}

export async function fetchAdminNotifications(since?: string) {
  const { data } = await api.get<
    ApiResponse<{ unread: number; items: AdminNotification[] }>
  >("/admin/notifications", { params: since ? { since } : undefined });
  return data.data;
}

export async function fetchAdminCustomers() {
  const { data } = await api.get<ApiResponse<AdminCustomer[]>>("/admin/customers");
  return data.data;
}

export async function updateAdminProfile(payload: {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  password?: string;
  currentPassword?: string;
}) {
  const { data } = await api.put<ApiResponse<User>>("/admin/profile", payload);
  return data.data;
}

export async function fetchAdminOrders(params?: { status?: string; search?: string }) {
  const { data } = await api.get<ApiResponse<Order[]>>("/admin/orders", { params });
  return data.data;
}

export async function updateAdminOrderStatus(
  id: string,
  payload: { orderStatus?: string; paymentStatus?: string }
) {
  const { data } = await api.put<ApiResponse<Order>>(`/admin/orders/${id}/status`, payload);
  return data.data;
}

export async function createAdminProduct(payload: Partial<Product>) {
  const { data } = await api.post<ApiResponse<Product>>("/admin/products", payload);
  return data.data;
}

export async function updateAdminProduct(id: string, payload: Partial<Product>) {
  const { data } = await api.put<ApiResponse<Product>>(`/admin/products/${id}`, payload);
  return data.data;
}

export async function deleteAdminProduct(id: string) {
  const { data } = await api.delete<ApiResponse<null>>(`/admin/products/${id}`);
  return data;
}
