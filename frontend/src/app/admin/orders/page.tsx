"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchAdminOrders,
  getErrorMessage,
  updateAdminOrderStatus,
} from "@/lib/api";
import type { Order } from "@/lib/types";
import { ADMIN_STATUS_OPTIONS, statusLabel } from "@/lib/orderStatus";
import { adminCardClass, statusBadgeClass } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("search");
    if (q) setSearch(q);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAdminOrders({
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
      });
      setOrders(data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load orders"));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const onStatusChange = async (id: string, orderStatus: string) => {
    try {
      const updated = await updateAdminOrderStatus(id, { orderStatus });
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
      toast.success(`Marked ${statusLabel(orderStatus)}`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Status update failed"));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Manage guest and member orders. Update fulfillment status anytime.
        </p>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, category, id..."
            className="h-10 min-w-[220px] rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm outline-none focus:border-teal"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {ADMIN_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${adminCardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(11,79,84,0.08)] text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Items</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Update</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    Loading orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const itemCount = order.items.reduce((n, i) => n + i.quantity, 0);
                  const catList: string[] = [];
                  order.items.forEach((i) => {
                    if (i.category && !catList.includes(i.category)) {
                      catList.push(i.category);
                    }
                  });
                  const categories = catList.join(", ");
                  return (
                    <tr
                      key={order._id}
                      className="border-b border-[rgba(11,79,84,0.06)] last:border-0 align-top"
                    >
                      <td className="px-5 py-4">
                        <p className="font-medium text-teal">
                          #{String(order._id).slice(-6).toUpperCase()}
                        </p>
                        <p className="mt-1 text-xs capitalize text-muted">
                          {categories || "General"}
                          {order.isGuest ? " · Guest" : ""}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-ink/80">
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-ink">{order.shippingAddress.fullName}</p>
                        <p className="text-xs text-muted">
                          {order.shippingAddress.phone}
                          {order.shippingAddress.email
                            ? ` · ${order.shippingAddress.email}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-ink/80">
                        {itemCount} item{itemCount === 1 ? "" : "s"}
                        <ul className="mt-1 space-y-0.5 text-xs text-muted">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <li key={`${order._id}-${idx}`}>
                              {item.name} ({item.size}) × {item.quantity}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-4">
                        <span className={statusBadgeClass(order.orderStatus)}>
                          {statusLabel(order.orderStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-4 font-medium">
                        {formatPrice(order.totalAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => onStatusChange(order._id, e.target.value)}
                          className="h-9 rounded-lg border border-[rgba(11,79,84,0.12)] bg-white px-2 text-xs"
                        >
                          {ADMIN_STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
