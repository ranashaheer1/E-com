"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ProductCard } from "@/components/home/ProductCard";
import { fetchProducts, getErrorMessage } from "@/lib/api";
import type { Product, ProductCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORIES: Array<{ value: "" | ProductCategory; label: string }> = [
  { value: "", label: "All" },
  { value: "shirts", label: "Shirts" },
  { value: "pants", label: "Pants" },
  { value: "shoes", label: "Shoes" },
  { value: "trousers", label: "Trousers" },
  { value: "t-shirts", label: "T-Shirts" },
  { value: "jackets", label: "Jackets" },
  { value: "hoodies", label: "Hoodies" },
];

function ShopContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchProducts({
          category: category || undefined,
          limit: 60,
        });
        if (alive) {
          setProducts(res.data);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(getErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [category]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl tracking-[0.2em]">SHOP</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            href={cat.value ? `/shop?category=${cat.value}` : "/shop"}
            className={cn(
              "border px-3 py-2 text-[11px] uppercase tracking-[0.18em] transition",
              category === cat.value
                ? "border-black bg-black text-white"
                : "border-black/15 bg-white/60 hover:border-black/40"
            )}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {error ? <p className="mt-8 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] skeleton" />
          ))}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard key={product._id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm">Loading shop...</div>}>
      <ShopContent />
    </Suspense>
  );
}
