"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { HangingRailSection } from "@/components/home/HangingRailSection";
import { StudioRailSection } from "@/components/home/StudioRailSection";
import { ShoeShelf } from "@/components/home/ShoeShelf";
import { fetchProducts, getErrorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";
import {
  categoryPageTitle,
  sectionsForCategory,
  type NavCategory,
} from "@/lib/nav";

interface CategoryStoreViewProps {
  category: Exclude<NavCategory, "all">;
}

export function CategoryStoreView({ category }: CategoryStoreViewProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hanging = useMemo(() => sectionsForCategory(category), [category]);
  const title = categoryPageTitle(category);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetchProducts({ limit: 60 });
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;
        if (!list.length) {
          setError("No products returned from API. Run backend seed.");
        } else {
          setError(null);
        }
        setProducts(list);
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

  const byCategory = useMemo(() => {
    return products.reduce<Record<string, Product[]>>((acc, product) => {
      acc[product.category] = acc[product.category] || [];
      acc[product.category].push(product);
      return acc;
    }, {});
  }, [products]);

  return (
    <div
      id="store-top"
      className={
        category === "shirts"
          ? "flex min-h-[calc(100dvh-4rem)] flex-col pb-0"
          : "pb-8"
      }
    >
      <div
        className={
          category === "shirts"
            ? "shrink-0 px-4 pb-1 pt-3 text-center sm:pb-2 sm:pt-5 lg:pt-6"
            : "shrink-0 px-4 pb-2 pt-8 text-center sm:pt-10"
        }
      >
        <h1
          className={
            category === "shirts"
              ? "font-display text-2xl tracking-[0.28em] text-teal-deep sm:text-3xl lg:text-4xl"
              : "font-display text-3xl tracking-[0.28em] text-teal-deep sm:text-4xl"
          }
        >
          {title}
        </h1>
      </div>

      {error ? (
        <div className="mx-auto max-w-3xl px-4 py-10 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <p className="mt-2 text-xs text-neutral-500">
            Make sure the API is running on localhost:5000 and MongoDB is seeded.
          </p>
        </div>
      ) : null}

      <div
        className={
          category === "shirts"
            ? "relative min-h-[calc(100dvh-8rem)] flex-1"
            : "relative"
        }
      >
        {category === "shirts" ? (
          <motion.div
            className="h-[calc(100dvh-8rem)] min-h-[560px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <StudioRailSection
              id="shirts"
              products={(byCategory.shirts || []).slice(0, 10)}
              loading={loading}
            />
          </motion.div>
        ) : null}

        {category !== "shirts"
          ? hanging.map((section, i) => {
              let list = [...(byCategory[section.categoryKey] || [])];
              if (section.categoryKey === "pants") {
                list = [...list, ...(byCategory.trousers || [])];
              }

              return (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <HangingRailSection
                    id={section.id}
                    title={section.title}
                    subtitle={section.subtitle}
                    products={list.slice(0, section.limit ?? 12)}
                    loading={loading}
                    focused
                    columns={3}
                    swipeable={false}
                    hideHeader
                  />
                </motion.div>
              );
            })
          : null}

        {category === "shoes" ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ShoeShelf
              products={byCategory.shoes || []}
              loading={loading}
              focused
              hideHeader
            />
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
