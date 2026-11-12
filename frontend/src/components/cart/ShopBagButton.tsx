"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useCartUI } from "@/context/CartUIContext";
import { cn } from "@/lib/utils";

interface ShopBagButtonProps {
  /** Placement inside the Drop room floor */
  className?: string;
  style?: CSSProperties;
}

/** Photoreal kraft bag — sits on the room floor, opens cart on click */
export function ShopBagButton({ className, style }: ShopBagButtonProps) {
  const { itemCount } = useCart();
  const { openCart, bagRef, flyJobs } = useCartUI();
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (!flyJobs.length) return;
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 700);
    return () => window.clearTimeout(t);
  }, [flyJobs.length]);

  return (
    <button
      ref={bagRef}
      type="button"
      onClick={openCart}
      aria-label={`Shopping bag${itemCount ? `, ${itemCount} items` : ""}`}
      className={cn(
        "group origin-bottom outline-none transition-transform duration-300",
        bump && "scale-[1.06]",
        className
      )}
      style={style}
    >
      {/* Wide kraft bag — width comes from parent (% of room photo) */}
      <span className="relative block w-full">
        <Image
          src="/ui/unknown-shop-bag-clean.png"
          alt="UNKNOWN shopping bag"
          width={320}
          height={280}
          unoptimized
          priority
          sizes="(max-width: 768px) 110px, 160px"
          className="h-auto w-full select-none object-contain object-bottom drop-shadow-[6px_14px_18px_rgba(30,24,18,0.38)] transition duration-300 group-hover:brightness-[1.03] !bg-transparent"
          style={{ background: "transparent" }}
          draggable={false}
        />

        <AnimatePresence>
          {itemCount > 0 ? (
            <motion.span
              key={itemCount}
              initial={{ scale: 0.4, opacity: 0, y: 6 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.4, opacity: 0 }}
              className="absolute -right-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-coral px-1.5 text-[11px] font-semibold text-white shadow-md ring-2 ring-[#f7f4ef] sm:top-2"
            >
              {itemCount > 99 ? "99+" : itemCount}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </span>
    </button>
  );
}
