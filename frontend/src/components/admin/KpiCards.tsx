"use client";

import { motion } from "framer-motion";
import {
  Package,
  Users,
  DollarSign,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { CountUp } from "./CountUp";
import { adminCardClass } from "./admin-ui";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

const icons: LucideIcon[] = [Package, Users, DollarSign, RotateCcw];

export function KpiCards({ kpis }: { kpis: DashboardStats["kpis"] }) {
  const cards = [
    {
      label: "Total Orders",
      value: kpis.totalOrders,
      trend: kpis.trends.orders,
      prefix: "",
    },
    {
      label: "Total Customers",
      value: kpis.totalCustomers,
      trend: kpis.trends.customers,
      prefix: "",
    },
    {
      label: "Total Revenue",
      value: kpis.totalRevenue,
      trend: kpis.trends.revenue,
      prefix: "PKR ",
    },
    {
      label: "Completed Orders",
      value: kpis.returningBuyers,
      trend: kpis.trends.returning,
      prefix: "",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = icons[index];
        const up = card.trend >= 0;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.45 }}
            className={cn(adminCardClass, "flex items-center gap-4 p-5")}
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(11,79,84,0.1)] text-teal">
              <Icon size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                {card.label}
              </p>
              <p className="mt-1 truncate font-display text-2xl text-ink">
                <CountUp value={card.value} prefix={card.prefix} />
              </p>
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  up ? "text-teal-soft" : "text-coral"
                )}
              >
                {up ? "+" : ""}
                {card.trend}% from last month
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
