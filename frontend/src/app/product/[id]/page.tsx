"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fetchProduct, getErrorMessage } from "@/lib/api";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartUI } from "@/context/CartUIContext";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { openCart } = useCartUI();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState(0);
  const [size, setSize] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchProduct(params.id);
        if (!alive) return;
        setProduct(data);
        setSize(data.sizes.find((s) => s.stock > 0)?.size || data.sizes[0]?.size || "");
        setError(null);
      } catch (err) {
        if (alive) setError(getErrorMessage(err, "Product not found"));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [params.id]);

  const onAdd = async () => {
    if (!product || !size) return;
    try {
      setSubmitting(true);
      await addItem(product._id, size, 1, product);
      openCart();
    } catch {
      // toast handled in context
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2">
        <div className="aspect-[4/5] skeleton" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 skeleton" />
          <div className="h-4 w-1/3 skeleton" />
          <div className="h-24 w-full skeleton" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-sm text-red-600">{error || "Product not found"}</p>
        <Link href="/shop" className="mt-4 inline-block text-sm underline">
          Back to shop
        </Link>
      </div>
    );
  }

  const glow = product.colors?.[0] || "#a3a3a3";

  return (
    <div className="relative overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* Soft color blooms behind product like the video */}
      <div
        className="pointer-events-none absolute left-1/2 top-24 h-72 w-40 -translate-x-[140%] rounded-full opacity-40 blur-3xl"
        style={{ background: glow }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-32 h-80 w-36 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
        style={{ background: product.colors?.[1] || "#d4d4d4" }}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-20 h-72 w-40 translate-x-[40%] rounded-full opacity-35 blur-3xl"
        style={{ background: product.colors?.[0] || "#c4c4c4" }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mx-auto aspect-[4/5] w-full max-w-lg"
          >
            <Image
              src={product.images[activeImage]}
              alt={product.name}
              fill
              className="object-contain drop-shadow-xl"
              sizes="(max-width:1024px) 90vw, 480px"
              priority
            />
          </motion.div>

          {product.images.length > 1 && (
            <div className="mt-4 flex justify-center gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-14 overflow-hidden border ${
                    i === activeImage ? "border-black" : "border-transparent opacity-70"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col justify-center"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] text-neutral-500">
            {product.category.replace("-", " ")}
          </p>
          <h1 className="mt-3 font-display text-3xl tracking-[0.12em] text-black sm:text-4xl">
            {product.name.toUpperCase()}
          </h1>
          <p className="mt-4 text-lg text-neutral-700">{formatPrice(product.price)}</p>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-500">
            {product.description}
          </p>

          <div className="mt-8">
            <p className="mb-3 text-[11px] uppercase tracking-[0.22em] text-neutral-500">
              Select size
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((entry) => (
                <button
                  key={entry.size}
                  disabled={entry.stock <= 0}
                  onClick={() => setSize(entry.size)}
                  className={`min-w-12 border px-3 py-2 text-sm transition ${
                    size === entry.size
                      ? "border-black bg-black text-white"
                      : "border-black/15 bg-white/70 hover:border-black/40"
                  } disabled:cursor-not-allowed disabled:opacity-30`}
                >
                  {entry.size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onAdd} disabled={submitting || !size} size="lg">
              {submitting ? "Adding..." : "Add to Cart"}
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/cart">Go to Cart</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
