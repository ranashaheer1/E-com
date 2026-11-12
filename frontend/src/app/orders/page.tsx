"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchOrders, getErrorMessage } from "@/lib/api";
import type { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { statusLabel } from "@/lib/orderStatus";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const placedId = searchParams.get("placed");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchOrders();
        if (alive) {
          setOrders(data);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        {placedId ? (
          <>
            <p className="font-display text-2xl tracking-[0.14em]">Order placed</p>
            <p className="mt-3 text-sm text-neutral-500">
              Thanks for shopping as a guest. Reference{" "}
              <span className="font-medium text-teal">
                #{placedId.slice(-6).toUpperCase()}
              </span>{" "}
              is in the admin dashboard.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/">Continue shopping</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-neutral-500">Sign in to view orders.</p>
            <Button className="mt-6" asChild>
              <Link href="/auth?redirect=/orders">Sign in</Link>
            </Button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl tracking-[0.2em]">ORDERS</h1>
      {placedId && (
        <p className="mt-3 text-sm text-teal">
          Order #{placedId.slice(-6).toUpperCase()} placed successfully.
        </p>
      )}

      {loading ? (
        <div className="mt-8 space-y-4">
          <div className="h-24 skeleton" />
          <div className="h-24 skeleton" />
        </div>
      ) : error ? (
        <p className="mt-8 text-sm text-red-600">{error}</p>
      ) : orders.length === 0 ? (
        <p className="mt-8 text-sm text-neutral-500">No orders yet.</p>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <article key={order._id} className="border border-black/10 bg-white/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm font-medium">{formatPrice(order.totalAmount)}</p>
                </div>
                <span className="border border-black/15 px-3 py-1 text-[11px] uppercase tracking-[0.16em]">
                  {statusLabel(order.orderStatus)}
                </span>
              </div>
              <ul className="mt-4 space-y-1 text-sm text-neutral-600">
                {order.items.map((item, idx) => (
                  <li key={`${order._id}-${idx}`}>
                    {item.name} · {item.size} × {item.quantity}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
