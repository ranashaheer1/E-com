"use client";

import Link from "next/link";
import { User, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartUI } from "@/context/CartUIContext";

export function Navbar() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { openCart } = useCartUI();

  return (
    <header
      className="sticky top-0 z-50 border-b border-coral/35 backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(180deg, rgba(11,79,84,0.97) 0%, rgba(8,59,63,0.96) 100%)",
        boxShadow: "0 10px 28px rgba(8, 59, 63, 0.22)",
      }}
    >
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-end px-4 sm:px-6 lg:px-8">
        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <span className="font-display text-xl tracking-brand text-white sm:text-2xl">
            UNKNOWN
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href={user ? "/orders" : "/auth"}
            className="inline-flex h-10 w-10 items-center justify-center text-white/85 transition hover:text-coral"
            aria-label="Account"
          >
            <User size={18} />
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex h-10 w-10 items-center justify-center text-white/85 transition hover:text-coral"
            aria-label="Open cart"
          >
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] text-white shadow-lg shadow-coral/30">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
