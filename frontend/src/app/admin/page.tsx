"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { fetchAdminStats, getErrorMessage } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { KpiCards } from "@/components/admin/KpiCards";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { SalesGauge } from "@/components/admin/SalesGauge";
import { RecentSalesTable } from "@/components/admin/RecentSalesTable";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Period = "this_month" | "last_month" | "this_year";

const PERIOD_LABEL: Record<Period, string> = {
  this_month: "This Month",
  last_month: "Last Month",
  this_year: "This Year",
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("this_month");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchAdminStats(period);
        if (alive) setStats(data);
      } catch (error) {
        toast.error(getErrorMessage(error, "Could not load dashboard"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [period]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const exportCsv = () => {
    if (!stats) return;
    const rows = [
      ["Order ID", "Date", "Customer", "Category", "Status", "Items", "Total"],
      ...stats.recentSales.map((r) => [
        r.orderId,
        new Date(r.date).toISOString(),
        r.customer,
        r.category,
        r.status,
        String(r.items),
        String(r.total),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unknown-sales-${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported recent sales CSV");
  };

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="h-16 animate-pulse rounded-2xl bg-white/70" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/70" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <div className="h-80 animate-pulse rounded-2xl bg-white/70" />
          <div className="h-80 animate-pulse rounded-2xl bg-white/70" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h2 className="font-display text-2xl text-ink sm:text-3xl">
            Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
          </h2>
          <p className="mt-1 text-sm text-muted">
            {today} · showing <span className="font-medium text-ink">{PERIOD_LABEL[period]}</span>
            {" · "}
            {formatPrice(stats.kpis.totalRevenue)} revenue
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="h-10 rounded-xl border border-[rgba(11,79,84,0.12)] bg-white px-3 text-sm outline-none focus:border-teal"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-teal px-4 text-sm font-medium text-white"
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </motion.div>

      <div className={loading ? "opacity-60 transition" : "transition"}>
        <KpiCards kpis={stats.kpis} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <RevenueChart
          months={stats.revenueByMonth}
          currentRevenue={stats.kpis.totalRevenue}
          trend={stats.kpis.trends.revenue}
        />
        <SalesGauge
          growth={stats.salesOverview.growth}
          sales={stats.salesOverview.sales}
          target={stats.salesOverview.target}
        />
      </div>

      <RecentSalesTable rows={stats.recentSales} />
    </div>
  );
}
