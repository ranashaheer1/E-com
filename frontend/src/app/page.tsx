"use client";

import { useEffect, useState } from "react";
import { ClothingRackHero } from "@/components/home/ClothingRackHero";
import { fetchProducts, getErrorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchProducts({ limit: 60 });
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;
        setProducts(list);
        if (!list.length) {
          setError("No products returned from API. Run backend seed.");
        }
      } catch (err) {
        if (alive) setError(getErrorMessage(err, "Failed to load products"));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const featured = products.filter((p) => p.featured);
  const heroProducts = featured.length ? featured : products;

  return (
    <div id="store-top">
      {error ? (
        <div className="mx-auto max-w-3xl px-4 py-6 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : null}
      <ClothingRackHero products={heroProducts} />
    </div>
  );
}
