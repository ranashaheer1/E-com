"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { user } = useAuth();
  const { cart, loading, updateItem, removeItem } = useCart();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-2xl tracking-[0.18em]">CART</h1>
        <p className="mt-4 text-sm text-neutral-500">Sign in to view your bag.</p>
        <Button className="mt-6" asChild>
          <Link href="/auth?redirect=/cart">Sign in</Link>
        </Button>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl tracking-[0.2em]">CART</h1>

      {loading ? (
        <div className="mt-8 space-y-4">
          <div className="h-28 skeleton" />
          <div className="h-28 skeleton" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-10 text-center">
          <p className="text-sm text-neutral-500">Your cart is empty.</p>
          <Button className="mt-6" asChild>
            <Link href="/shop">Continue shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex gap-4 border border-black/10 bg-white/60 p-4"
              >
                <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-neutral-100">
                  <Image
                    src={item.product?.images?.[0] || "/next.svg"}
                    alt={item.product?.name || "Product"}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-medium">{item.product?.name}</h2>
                    <p className="mt-1 text-xs text-neutral-500">Size {item.size}</p>
                    <p className="mt-2 text-sm">{formatPrice(item.price)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-black/15">
                      <button
                        className="px-3 py-1 text-sm"
                        onClick={() => updateItem(item._id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="px-3 text-sm">{item.quantity}</span>
                      <button
                        className="px-3 py-1 text-sm"
                        onClick={() => updateItem(item._id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="text-xs uppercase tracking-[0.16em] text-neutral-500 underline"
                      onClick={() => removeItem(item._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <aside className="h-fit border border-black/10 bg-white/70 p-6">
            <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              Order summary
            </p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-neutral-500">Shipping calculated at checkout.</p>
            <Button className="mt-6 w-full" asChild>
              <Link href="/checkout">Checkout</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
