"use client";

import { motion } from "framer-motion";
import { adminCardClass } from "./admin-ui";
import { CountUp } from "./CountUp";
import { formatPrice } from "@/lib/utils";

export function SalesGauge({
  growth,
  sales,
  target,
}: {
  growth: number;
  sales: number;
  target: number;
}) {
  const clamped = Math.max(0, Math.min(100, growth));
  const radius = 78;
  const stroke = 14;
  const circumference = Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className={`${adminCardClass} flex h-full flex-col p-6`}>
      <h3 className="font-display text-lg text-ink">Sales Overview</h3>
      <p className="mt-1 text-sm text-muted">Progress toward monthly target</p>

      <div className="relative mx-auto mt-6 flex w-full max-w-[240px] flex-1 flex-col items-center justify-center">
        <svg viewBox="0 0 200 120" className="w-full">
          <path
            d="M 22 110 A 78 78 0 0 1 178 110"
            fill="none"
            stroke="rgba(11,79,84,0.1)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <motion.path
            d="M 22 110 A 78 78 0 0 1 178 110"
            fill="none"
            stroke="url(#gaugeGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e8934c" />
              <stop offset="55%" stopColor="#e85d4c" />
              <stop offset="100%" stopColor="#0b4f54" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-x-0 top-[42%] text-center">
          <p className="font-display text-3xl text-ink">
            <CountUp value={clamped} decimals={1} suffix="%" />
          </p>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
            Sales Growth
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[rgba(11,79,84,0.08)] pt-4 text-sm">
        <div>
          <p className="text-xs text-muted">Sales</p>
          <p className="mt-1 font-medium text-ink">{formatPrice(sales)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Target</p>
          <p className="mt-1 font-medium text-ink">{formatPrice(target)}</p>
        </div>
      </div>
    </div>
  );
}
