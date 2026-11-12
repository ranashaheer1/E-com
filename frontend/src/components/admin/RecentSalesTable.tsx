"use client";

import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";
import { motion } from "framer-motion";
import { adminCardClass, statusBadgeClass } from "./admin-ui";
import { statusLabel } from "@/lib/orderStatus";
import type { DashboardStats } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function RecentSalesTable({
  rows,
}: {
  rows: DashboardStats["recentSales"];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((row) => {
      row.category.split(",").forEach((c) => {
        const t = c.trim();
        if (t) set.add(t);
      });
    });
    return ["all", ...Array.from(set)];
  }, [rows]);

  const filtered = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      row.customer.toLowerCase().includes(q) ||
      row.orderId.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q);
    const matchesCategory =
      category === "all" ||
      row.category.toLowerCase().includes(category.toLowerCase());
    return matchesQuery && matchesCategory;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.45 }}
      className={`${adminCardClass} overflow-hidden`}
    >
      <div className="flex flex-col gap-4 border-b border-[rgba(11,79,84,0.08)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-display text-lg text-ink">Recent Sales</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[180px] flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="h-10 w-full rounded-xl border border-[rgba(11,79,84,0.12)] bg-ivory-soft/80 pl-9 pr-3 text-sm outline-none transition focus:border-teal"
            />
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm outline-none"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Category" : c}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm text-ink"
          >
            <Filter size={14} />
            Filter
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(11,79,84,0.08)] text-xs uppercase tracking-[0.12em] text-muted">
              <th className="px-5 py-3 font-medium">
                <input type="checkbox" className="rounded border-teal/30" aria-label="Select all" />
              </th>
              <th className="px-3 py-3 font-medium">Order ID</th>
              <th className="px-3 py-3 font-medium">Date</th>
              <th className="px-3 py-3 font-medium">Customer</th>
              <th className="px-3 py-3 font-medium">Category</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Items</th>
              <th className="px-5 py-3 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-10 text-center text-muted">
                  No sales match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row._id}
                  className="border-b border-[rgba(11,79,84,0.06)] last:border-0"
                >
                  <td className="px-5 py-4">
                    <input type="checkbox" className="rounded border-teal/30" aria-label={`Select ${row.orderId}`} />
                  </td>
                  <td className="px-3 py-4 font-medium text-teal">#{row.orderId}</td>
                  <td className="px-3 py-4 text-ink/80">
                    {new Date(row.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-4 text-ink">
                    {row.customer}
                    {row.isGuest ? (
                      <span className="ml-2 rounded-full bg-[rgba(232,147,76,0.15)] px-2 py-0.5 text-[10px] font-medium text-[#c46a1f]">
                        Guest
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-4 capitalize text-ink/80">{row.category}</td>
                  <td className="px-3 py-4">
                    <span className={statusBadgeClass(row.status)}>
                      {statusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-ink/80">
                    {row.items} Item{row.items === 1 ? "" : "s"}
                  </td>
                  <td className="px-5 py-4 font-medium text-ink">
                    {formatPrice(row.total)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
