"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { createOrderRequest, getErrorMessage } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, refreshCart, clearLocalCart, isGuestCart } = useCart();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Pakistan",
    paymentMethod: "cod",
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }
    try {
      setSubmitting(true);
      const payload: Parameters<typeof createOrderRequest>[0] = {
        shippingAddress: {
          fullName: form.fullName,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
          email: form.email || undefined,
        },
        paymentMethod: form.paymentMethod,
      };

      if (isGuestCart || !user) {
        payload.items = items.map((item) => ({
          productId:
            typeof item.product === "object" ? item.product._id : String(item.product),
          size: item.size,
          quantity: item.quantity,
        }));
      }

      const order = await createOrderRequest(payload);
      if (isGuestCart || !user) {
        clearLocalCart();
      } else {
        await refreshCart();
      }
      toast.success("Order placed successfully");
      router.push(`/orders?placed=${order._id}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Checkout failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <p className="text-sm text-neutral-500">Your bag is empty.</p>
        <Button className="mt-6" asChild>
          <Link href="/">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl tracking-[0.2em]">CHECKOUT</h1>
      <p className="mt-2 text-sm text-muted">
        {user
          ? "Review shipping details and place your order."
          : "Guest checkout — no account required."}
      </p>

      <form onSubmit={onSubmit} className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              className="mt-2"
              required
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="email">Email {user ? "(optional)" : ""}</Label>
            <Input
              id="email"
              type="email"
              className="mt-2"
              required={!user}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              className="mt-2"
              required
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              className="mt-2"
              required
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                className="mt-2"
                required
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal code</Label>
              <Input
                id="postalCode"
                className="mt-2"
                required
                value={form.postalCode}
                onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="paymentMethod">Payment</Label>
            <select
              id="paymentMethod"
              className="mt-2 flex h-11 w-full border border-black/15 bg-white/70 px-4 text-sm"
              value={form.paymentMethod}
              onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
            >
              <option value="cod">Cash on Delivery</option>
              <option value="card">Card (demo)</option>
            </select>
          </div>
        </div>

        <aside className="h-fit border border-black/10 bg-white/70 p-6">
          <p className="text-[11px] uppercase tracking-[0.22em] text-neutral-500">
            Your bag
          </p>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between gap-3 text-sm">
                <span>
                  {item.product?.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-between border-t border-black/10 pt-4 text-sm font-medium">
            <span>Total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={submitting || !items.length}>
            {submitting ? "Placing order..." : "Place order"}
          </Button>
          {!user && (
            <p className="mt-3 text-center text-xs text-muted">
              Already have an account?{" "}
              <Link href="/auth?redirect=/checkout" className="text-teal underline">
                Sign in
              </Link>
            </p>
          )}
        </aside>
      </form>
    </div>
  );
}
