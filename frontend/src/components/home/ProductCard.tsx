"use client";

import type { Product } from "@/lib/types";
import { HangingProductCard } from "./HangingProductCard";

interface ProductCardProps {
  product: Product;
  index?: number;
}

/** Apparel renders on hangers; shoes skip the hanger (see HangingProductCard). */
export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return <HangingProductCard product={product} index={index} />;
}
