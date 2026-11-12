"use client";

import Link from "next/link";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/types";

interface CategorySectionProps {
  id: string;
  title: string;
  subtitle?: string;
  products: Product[];
  loading?: boolean;
}

export function CategorySection({
  id,
  title,
  subtitle,
  products,
  loading,
}: CategorySectionProps) {
  return (
    <section id={id} className="scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl tracking-[0.18em] text-black sm:text-4xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 max-w-xl text-sm text-neutral-500">{subtitle}</p>
            ) : null}
          </div>
          <Link
            href={`/shop?category=${id}`}
            className="hidden text-[11px] uppercase tracking-[0.22em] text-neutral-600 underline-offset-4 hover:text-black hover:underline sm:inline"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] skeleton" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-neutral-500">No pieces in this collection yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {products.map((product, index) => (
              <ProductCard key={product._id} product={product} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
