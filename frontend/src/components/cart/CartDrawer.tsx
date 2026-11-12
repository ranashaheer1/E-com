"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { user } = useAuth();
  const { cart, loading, updateItem, removeItem, itemCount } = useCart();
  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close cart backdrop"
            className="fixed inset-0 z-[70] bg-teal-deep/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col bg-ivory-soft shadow-2xl"
            style={{ background: "var(--ivory-soft)" }}
          >
            <div className="flex items-center justify-between border-b border-teal/10 px-5 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} className="text-teal" />
                <h2 className="font-display text-lg tracking-[0.18em] text-teal-deep">
                  YOUR BAG
                </h2>
                <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] text-white">
                  {itemCount}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-teal/5 text-teal-deep transition hover:bg-coral hover:text-white"
                aria-label="Close cart"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!user ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted">Sign in to view your bag.</p>
                  <Button className="mt-5 bg-teal hover:bg-teal-soft" asChild>
                    <Link href="/auth?redirect=/" onClick={onClose}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              ) : loading ? (
                <div className="space-y-3">
                  <div className="h-24 skeleton" />
                  <div className="h-24 skeleton" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-muted">Your bag is empty.</p>
                  <Button
                    className="mt-5 bg-teal hover:bg-teal-soft"
                    onClick={onClose}
                  >
                    Keep browsing
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item._id}
                      className="flex gap-3 rounded-2xl border border-teal/10 bg-white/70 p-3"
                    >
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-ivory">
                        <Image
                          src={item.product?.images?.[0] || "/next.svg"}
                          alt={item.product?.name || "Product"}
                          fill
                          unoptimized
                          className="object-contain p-1"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-ink">
                            {item.product?.name}
                          </h3>
                          <p className="mt-1 text-xs text-muted">Size {item.size}</p>
                          <p className="mt-1 text-sm text-teal-deep">
                            {formatPrice(item.price)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center overflow-hidden rounded-full border border-teal/15">
                            <button
                              className="px-2.5 py-1 text-teal"
                              onClick={() => updateItem(item._id, item.quantity - 1)}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 text-xs">{item.quantity}</span>
                            <button
                              className="px-2.5 py-1 text-teal"
                              onClick={() => updateItem(item._id, item.quantity + 1)}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <button
                            className="text-[10px] uppercase tracking-[0.16em] text-coral"
                            onClick={() => removeItem(item._id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {user && items.length > 0 ? (
              <div className="border-t border-teal/10 bg-white/80 px-5 py-5">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-muted">Subtotal</span>
                  <span className="font-medium text-teal-deep">{formatPrice(subtotal)}</span>
                </div>
                <Button className="w-full bg-coral hover:bg-coral-soft" asChild>
                  <Link href="/checkout" onClick={onClose}>
                    Checkout
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="mt-2 w-full border-teal/20 text-teal"
                  asChild
                >
                  <Link href="/cart" onClick={onClose}>
                    View full cart
                  </Link>
                </Button>
              </div>
            ) : null}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
