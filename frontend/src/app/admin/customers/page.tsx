"use client";

import { useEffect, useState } from "react";
import { fetchAdminCustomers, getErrorMessage } from "@/lib/api";
import type { AdminCustomer } from "@/lib/types";
import { adminCardClass } from "@/components/admin/admin-ui";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminCustomersPage() {
  const [rows, setRows] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setRows((await fetchAdminCustomers()) || []);
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not load customers"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((r) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (
      r.name.toLowerCase().includes(s) ||
      (r.email || "").toLowerCase().includes(s) ||
      r.type.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Members and guest buyers from checkout — no login required for guests.
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, type..."
          className="h-10 min-w-[220px] rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm outline-none focus:border-teal"
        />
      </div>

      <div className={`${adminCardClass} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(11,79,84,0.08)] text-xs uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Orders</th>
                <th className="px-3 py-3 font-medium">Spent</th>
                <th className="px-5 py-3 font-medium">Last order</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    Loading customers...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-[rgba(11,79,84,0.06)] last:border-0"
                  >
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{row.name}</p>
                      <p className="text-xs text-muted">{row.email || "—"}</p>
                    </td>
                    <td className="px-3 py-4 capitalize">
                      <span
                        className={
                          row.type === "guest"
                            ? "rounded-full bg-[rgba(232,147,76,0.16)] px-2.5 py-1 text-xs text-[#c46a1f]"
                            : "rounded-full bg-[rgba(11,79,84,0.12)] px-2.5 py-1 text-xs text-teal"
                        }
                      >
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3 py-4">{row.orders}</td>
                    <td className="px-3 py-4 font-medium">{formatPrice(row.spent)}</td>
                    <td className="px-5 py-4 text-muted">
                      {row.lastOrderAt
                        ? new Date(row.lastOrderAt).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
