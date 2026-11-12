"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { FloatingShopBag } from "@/components/cart/FloatingShopBag";

export type FlyJob = {
  id: number;
  image: string;
  from: DOMRect;
};

interface CartUIContextValue {
  openCart: () => void;
  closeCart: () => void;
  cartOpen: boolean;
  bagRef: RefObject<HTMLButtonElement | null>;
  flyJobs: FlyJob[];
  /** Animate a product image into the left shopping bag */
  flyToBag: (image: string, from?: DOMRect | null) => void;
  completeFlyJob: (id: number) => void;
}

const CartUIContext = createContext<CartUIContextValue | undefined>(undefined);

let flySeq = 0;

export function CartUIProvider({ children }: { children: React.ReactNode }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [flyJobs, setFlyJobs] = useState<FlyJob[]>([]);
  const bagRef = useRef<HTMLButtonElement | null>(null);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const flyToBag = useCallback((image: string, from?: DOMRect | null) => {
    if (!image) return;
    const rect =
      from ??
      new DOMRect(
        typeof window !== "undefined" ? window.innerWidth / 2 - 60 : 200,
        typeof window !== "undefined" ? window.innerHeight / 2 - 80 : 200,
        120,
        160
      );
    const id = ++flySeq;
    setFlyJobs((prev) => [...prev, { id, image, from: rect }]);
  }, []);

  const completeFlyJob = useCallback((id: number) => {
    setFlyJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      openCart,
      closeCart,
      cartOpen,
      bagRef,
      flyJobs,
      flyToBag,
      completeFlyJob,
    }),
    [openCart, closeCart, cartOpen, flyJobs, flyToBag, completeFlyJob]
  );

  return (
    <CartUIContext.Provider value={value}>
      {children}
      <FloatingShopBag />
      <CartDrawer open={cartOpen} onClose={closeCart} />
    </CartUIContext.Provider>
  );
}

export function useCartUI() {
  const ctx = useContext(CartUIContext);
  if (!ctx) throw new Error("useCartUI must be used within CartUIProvider");
  return ctx;
}
