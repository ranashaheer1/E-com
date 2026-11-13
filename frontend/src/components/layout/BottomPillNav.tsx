"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCategoryNav, type NavCategory } from "@/context/CategoryNavContext";
import { pathForCategory } from "@/lib/nav";
import { cn } from "@/lib/utils";

const items: Array<{ id: NavCategory | "store" | "full-fit"; label: string; href?: string }> = [
  { id: "store", label: "Store" },
  { id: "full-fit", label: "Full Fit", href: "/full-fit" },
  { id: "shirts", label: "Shirts" },
  { id: "pants", label: "Pants" },
  { id: "hoodies", label: "Hoodies" },
  { id: "jackets", label: "Jackets" },
  { id: "shoes", label: "Shoes" },
];

export function BottomPillNav() {
  const { activeCategory } = useCategoryNav();
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-3 sm:bottom-7">
      <motion.nav
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="pointer-events-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full pill-nav px-2 py-2 text-white scrollbar-none"
      >
        {items.map((item) => {
          const href =
            item.href ||
            (item.id === "store" ? "/" : pathForCategory(item.id as NavCategory));
          const active =
            item.id === "full-fit"
              ? pathname === "/full-fit"
              : item.id === "store"
                ? activeCategory === "all" && pathname !== "/full-fit"
                : activeCategory === item.id;

          return (
            <Link
              key={item.id}
              href={href}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.16em] transition sm:px-4",
                active
                  ? "bg-coral text-white shadow-lg shadow-coral/30"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/shop"
          className="ml-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/90 transition hover:bg-coral hover:text-white"
          aria-label="Search shop"
        >
          <Search size={15} />
        </Link>
      </motion.nav>
    </div>
  );
}
