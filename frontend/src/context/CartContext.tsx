"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addToCartRequest,
  fetchCart,
  getErrorMessage,
  removeCartItemRequest,
  updateCartItemRequest,
} from "@/lib/api";
import type { Cart, CartItem, Product } from "@/lib/types";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

const GUEST_CART_KEY = "unknown_guest_cart";

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  isGuestCart: boolean;
  refreshCart: () => Promise<void>;
  clearLocalCart: () => void;
  addItem: (
    productId: string,
    size: string,
    quantity?: number,
    previewProduct?: Product
  ) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function readGuestCart(): Cart {
  if (typeof window === "undefined") {
    return { _id: "guest", user: "guest", items: [] };
  }
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return { _id: "guest", user: "guest", items: [] };
    const items = JSON.parse(raw) as CartItem[];
    return { _id: "guest", user: "guest", items: Array.isArray(items) ? items : [] };
  } catch {
    return { _id: "guest", user: "guest", items: [] };
  }
}

function writeGuestCart(items: CartItem[]) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  const clearLocalCart = useCallback(() => {
    localStorage.removeItem(GUEST_CART_KEY);
    if (!user) {
      setCart({ _id: "guest", user: "guest", items: [] });
    }
  }, [user]);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(readGuestCart());
      hasLoadedRef.current = true;
      return;
    }
    if (!hasLoadedRef.current) setLoading(true);
    try {
      const data = await fetchCart();
      setCart(data);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addItem = useCallback(
    async (
      productId: string,
      size: string,
      quantity = 1,
      previewProduct?: Product
    ) => {
      if (!user) {
        if (!previewProduct) {
          toast.error("Could not add item — missing product details");
          throw new Error("PRODUCT_REQUIRED");
        }

        setCart((prev) => {
          const base = prev ?? { _id: "guest", user: "guest", items: [] };
          const existing = base.items.find(
            (item) =>
              (typeof item.product === "object"
                ? item.product._id
                : item.product) === productId && item.size === size
          );
          let nextItems: CartItem[];
          if (existing) {
            nextItems = base.items.map((item) =>
              item === existing
                ? { ...item, quantity: item.quantity + quantity }
                : item
            );
          } else {
            nextItems = [
              ...base.items,
              {
                _id: `guest-${productId}-${size}-${Date.now()}`,
                product: previewProduct,
                size,
                quantity,
                price: previewProduct.price,
              },
            ];
          }
          writeGuestCart(nextItems);
          return { ...base, items: nextItems };
        });
        toast.success("Added to cart");
        return;
      }

      if (previewProduct) {
        setCart((prev) => {
          const base: Cart = prev ?? {
            _id: "optimistic",
            user: user._id,
            items: [],
          };
          const existing = base.items.find(
            (item) =>
              (typeof item.product === "object"
                ? item.product._id
                : item.product) === productId && item.size === size
          );
          if (existing) {
            return {
              ...base,
              items: base.items.map((item) =>
                item === existing
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            ...base,
            items: [
              ...base.items,
              {
                _id: `optimistic-${productId}-${size}`,
                product: previewProduct,
                size,
                quantity,
                price: previewProduct.price,
              },
            ],
          };
        });
        toast.success("Added to cart");
      }

      try {
        const data = await addToCartRequest(productId, size, quantity);
        setCart(data);
        hasLoadedRef.current = true;
        if (!previewProduct) toast.success("Added to cart");
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not add to cart"));
        try {
          const data = await fetchCart();
          setCart(data);
        } catch {
          /* keep optimistic until next refresh */
        }
        throw error;
      }
    },
    [user]
  );

  const updateItem = useCallback(
    async (itemId: string, quantity: number) => {
      if (!user) {
        setCart((prev) => {
          const base = prev ?? { _id: "guest", user: "guest", items: [] };
          const nextItems =
            quantity <= 0
              ? base.items.filter((item) => item._id !== itemId)
              : base.items.map((item) =>
                  item._id === itemId ? { ...item, quantity } : item
                );
          writeGuestCart(nextItems);
          return { ...base, items: nextItems };
        });
        return;
      }
      try {
        const data = await updateCartItemRequest(itemId, quantity);
        setCart(data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not update cart"));
      }
    },
    [user]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!user) {
        setCart((prev) => {
          const base = prev ?? { _id: "guest", user: "guest", items: [] };
          const nextItems = base.items.filter((item) => item._id !== itemId);
          writeGuestCart(nextItems);
          return { ...base, items: nextItems };
        });
        toast.success("Item removed");
        return;
      }
      try {
        const data = await removeCartItemRequest(itemId);
        setCart(data);
        toast.success("Item removed");
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not remove item"));
      }
    },
    [user]
  );

  const itemCount = useMemo(
    () => cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      loading,
      itemCount,
      isGuestCart: !user,
      refreshCart,
      clearLocalCart,
      addItem,
      updateItem,
      removeItem,
    }),
    [
      cart,
      loading,
      itemCount,
      user,
      refreshCart,
      clearLocalCart,
      addItem,
      updateItem,
      removeItem,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
