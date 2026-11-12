"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { adminCardClass } from "./admin-ui";
import { CountUp } from "./CountUp";
import type { DashboardStats } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export function RevenueChart({
  months,
  currentRevenue,
  trend,
}: {
  months: DashboardStats["revenueByMonth"];
  currentRevenue: number;
  trend: number;
}) {
  const max = Math.max(...months.map((m) => Math.max(m.earning, m.refunds)), 1);
  const peakIndex = Math.max(
    0,
    months.reduce((best, m, i, arr) => (m.earning >= arr[best].earning ? i : best), 0)
  );
  const [hover, setHover] = useState<number | null>(null);
  const activeIndex = hover ?? peakIndex;
  const active = months[activeIndex];

  return (
    <div className={`${adminCardClass} p-6`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink">Revenue Insights</h3>
          <p className="mt-1 text-sm text-muted">Hover a month for earning / sales / refunds</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-ink">
            <CountUp value={currentRevenue} prefix="PKR " />
          </p>
          <p className={`text-xs font-medium ${trend >= 0 ? "text-teal-soft" : "text-coral"}`}>
            {trend >= 0 ? "+" : ""}
            {trend}% vs prior period
          </p>
        </div>
      </div>

      <div className="mt-8 flex h-52 items-end gap-2 sm:gap-3">
        {months.map((month, index) => {
          const height = Math.max(8, (month.earning / max) * 100);
          const refundH = Math.max(0, (month.refunds / max) * 100);
          const isActive = index === activeIndex;
          return (
            <div
              key={month.key}
              className="relative flex flex-1 flex-col items-center gap-2"
              onMouseEnter={() => setHover(index)}
              onMouseLeave={() => setHover(null)}
            >
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-16 z-10 w-max max-w-[140px] rounded-lg bg-ink px-2.5 py-2 text-[10px] text-white shadow-lg"
                >
                  <p className="font-semibold">{month.month}</p>
                  <p>Earn {formatPrice(month.earning)}</p>
                  <p>Sales {month.sales}</p>
                  <p>Refund {formatPrice(month.refunds)}</p>
                </motion.div>
              )}
              <div className="relative flex h-44 w-full items-end justify-center gap-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: 0.08 * index, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full max-w-[22px] cursor-pointer rounded-t-lg"
                  style={{
                    background: isActive
                      ? "linear-gradient(180deg, #e85d4c 0%, #0b4f54 100%)"
                      : "linear-gradient(180deg, rgba(232,147,76,0.55) 0%, rgba(11,79,84,0.32) 100%)",
                  }}
                />
                {refundH > 0 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(refundH, 40)}%` }}
                    transition={{ delay: 0.1 * index, duration: 0.55 }}
                    className="w-[6px] max-w-[8px] rounded-t-md bg-[rgba(232,93,76,0.55)]"
                  />
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${isActive ? "text-teal" : "text-muted"}`}
              >
                {month.month}
              </span>
            </div>
          );
        })}
      </div>

      {active && (
        <p className="mt-4 text-xs text-muted">
          Selected <span className="font-medium text-ink">{active.month}</span>:{" "}
          {formatPrice(active.earning)} earned · {active.sales} sales
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <LegendDot color="#0b4f54" label="Earning" />
        <LegendDot color="rgba(232,147,76,0.85)" label="Sales volume" />
        <LegendDot color="rgba(232,93,76,0.7)" label="Refunds" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
