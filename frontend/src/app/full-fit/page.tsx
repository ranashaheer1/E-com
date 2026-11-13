"use client";

import { useEffect, useState } from "react";
import { FullFitLookbook } from "@/components/home/FullFitLookbook";
import { fetchProducts, getErrorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function FullFitPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchProducts({ limit: 80 });
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;
        setProducts(list);
        setError(list.length ? null : "No products from API. Run backend seed.");
      } catch (err) {
        if (alive) setError(getErrorMessage(err, "Failed to load products"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div id="store-top" className="pb-8">
      {error ? (
        <div className="mx-auto max-w-3xl px-4 pt-8 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : null}
      <FullFitLookbook products={products} loading={loading} />
    </div>
  );
}
