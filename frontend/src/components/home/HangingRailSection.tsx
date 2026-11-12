"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { HangingProductCard, type HangView } from "./HangingProductCard";
import { useInchwormRail } from "@/hooks/useInchwormRail";
import type { Product } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartUI } from "@/context/CartUIContext";
import { Button } from "@/components/ui/button";
import {
  getPants3DMockupSrc,
  Hang3DMockupModal,
} from "@/components/home/Hang3DMockupModal";

/** Original CSS stage — no wall photo, product stays the hero */
function StoreWallBackdrop() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[28px]"
        aria-hidden
      >
        <div className="store-wall-atmosphere absolute inset-0" />
        <div className="store-wall-grain absolute inset-0" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-24 bg-gradient-to-b from-[#fffaf3]/35 to-transparent" />
    </>
  );
}

interface HangingRailSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  products: Product[];
  loading?: boolean;
  focused?: boolean;
  /** Store rack columns — shirts use 3 like the video rail */
  columns?: 3 | 4;
  /**
   * Pants: GSAP mwg_effect070-style pin + inchworm beats
   * (3 visible, measured horizontal steps, scroll + swipe).
   */
  swipeable?: boolean;
  /** When the category page already shows the collection title */
  hideHeader?: boolean;
}

/** Parade long enough for seamless-feeling steps past the first trio */
function buildParade(products: Product[]) {
  if (!products.length) return [];
  if (products.length >= 9) return products;
  const copies = Math.ceil(9 / products.length);
  return Array.from({ length: copies }, () => products).flat();
}

function InchwormPantsRail({ products }: { products: Product[] }) {
  const parade = useMemo(() => buildParade(products), [products]);
  const rail = useInchwormRail({
    itemCount: parade.length,
    enabled: parade.length >= 3,
  });

  if (!products.length) {
    return (
      <p className="py-16 text-center text-sm text-muted">
        No pieces hanging in this collection yet.
      </p>
    );
  }

  return (
    <div ref={rail.sectionRef} className="pants-inchworm relative">
      <div ref={rail.pinHeightRef} className="pin-height relative w-full">
        <div
          ref={rail.containerRef}
          className="container store-wall relative mx-auto w-full max-w-7xl overflow-hidden rounded-[28px] px-2 pb-10 pt-12 touch-pan-x select-none sm:px-6"
          style={{ cursor: "grab" }}
          onClickCapture={(e) => {
            if (rail.didDrag()) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        >
          <StoreWallBackdrop />
          <p className="pointer-events-none absolute left-1/2 top-5 z-[2] -translate-x-1/2 font-display text-[11px] tracking-[0.35em] text-teal/40">
            UNKNOWN
          </p>

          <div className="pointer-events-none relative z-30 mx-auto mb-0 max-w-5xl">
            <div className="absolute -top-1.5 left-[7%] h-3 w-3 rounded-full bg-[#1a1a1a] shadow-sm ring-1 ring-white/15" />
            <div className="absolute -top-1.5 right-[7%] h-3 w-3 rounded-full bg-[#1a1a1a] shadow-sm ring-1 ring-white/15" />
            <div className="rack-line relative z-40" />
          </div>

          <div className="relative z-10 -mt-1 flex w-full pt-1">
            {parade.map((product, index) => (
              <div
                key={`${product._id}-inch-${index}`}
                data-inchworm-media
                className="media shrink-0 px-1.5 sm:px-3"
                style={{
                  flex: "0 0 33.333%",
                  width: "33.333%",
                  maxWidth: "33.333%",
                }}
              >
                <HangingProductCard
                  product={product}
                  index={index % products.length}
                  railMotion
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FocusRailGrid({
  products,
  columns,
}: {
  products: Product[];
  columns: 3 | 4;
}) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [view, setView] = useState<HangView>("front");
  const [buyProduct, setBuyProduct] = useState<Product | null>(null);
  const [buySize, setBuySize] = useState("");
  const [buySubmitting, setBuySubmitting] = useState(false);
  const [mockupProduct, setMockupProduct] = useState<Product | null>(null);

  const { addItem } = useCart();
  const { user } = useAuth();
  const { flyToBag } = useCartUI();

  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusId(null);
        setView("front");
        setBuyProduct(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId]);

  const onFocus = useCallback((product: Product) => {
    setFocusId(product._id);
    setView("front");
  }, []);

  const clearFocus = useCallback(() => {
    setFocusId(null);
    setView("front");
  }, []);

  const openBuy = useCallback((product: Product) => {
    setBuyProduct(product);
    setBuySize(
      product.sizes.find((s) => s.stock > 0)?.size ||
        product.sizes[0]?.size ||
        ""
    );
  }, []);

  const onAddToCart = useCallback(async () => {
    if (!buyProduct || !buySize) return;
    const source = document.querySelector<HTMLElement>("[data-fly-source]");
    const from = source?.getBoundingClientRect() ?? null;
    const image = buyProduct.images?.[0] || "";
    setBuyProduct(null);
    if (image) flyToBag(image, from);
    if (!user) return;
    try {
      setBuySubmitting(true);
      await addItem(buyProduct._id, buySize, 1, buyProduct);
    } catch {
      // toast from cart
    } finally {
      setBuySubmitting(false);
    }
  }, [buyProduct, buySize, user, addItem, flyToBag]);

  return (
    <>
      <div
        className={cn(
          "store-wall relative rounded-[28px] px-2 pb-10 pt-12 sm:px-6",
          focusId ? "overflow-visible" : "overflow-hidden"
        )}
        onClick={() => {
          if (buyProduct) return;
          if (focusId) clearFocus();
        }}
      >
        <StoreWallBackdrop />
        <p className="pointer-events-none absolute left-1/2 top-5 z-[2] -translate-x-1/2 font-display text-[11px] tracking-[0.35em] text-teal/40">
          UNKNOWN
        </p>

        <div className="pointer-events-none relative z-30 mx-auto mb-0 max-w-5xl">
          <div className="absolute -top-1.5 left-[7%] h-3 w-3 rounded-full bg-[#1a1a1a] shadow-sm ring-1 ring-white/15" />
          <div className="absolute -top-1.5 right-[7%] h-3 w-3 rounded-full bg-[#1a1a1a] shadow-sm ring-1 ring-white/15" />
          <div className="rack-line relative z-40" />
        </div>

        {focusId ? (
          <>
            <div
              className="absolute inset-0 z-[5] cursor-pointer bg-teal-deep/15 backdrop-blur-[2px] transition"
              aria-hidden
              onClick={(e) => {
                e.stopPropagation();
                clearFocus();
              }}
            />
            <div className="absolute left-3 right-3 top-3 z-[25] flex items-center justify-between sm:left-5 sm:right-5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFocus();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-teal-deep/15 bg-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-teal-deep shadow-sm backdrop-blur-sm transition hover:border-teal-deep/35"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>
            </div>
          </>
        ) : null}

        <div
          className={cn(
            "relative z-10 grid grid-cols-2 gap-x-3 gap-y-12 -mt-1 pt-1 md:gap-x-10",
            columns === 3 ? "md:grid-cols-3" : "md:grid-cols-4"
          )}
        >
          {products.map((product, index) => {
            const isFocused = focusId === product._id;
            const isDimmed = Boolean(focusId) && !isFocused;
            return (
              <div
                key={product._id}
                className={cn(isFocused && "relative z-20")}
                onClick={(e) => {
                  if (isDimmed) {
                    e.stopPropagation();
                    clearFocus();
                    return;
                  }
                  e.stopPropagation();
                }}
              >
                <HangingProductCard
                  product={product}
                  index={index}
                  isFocused={isFocused}
                  isDimmed={isDimmed}
                  view={isFocused ? view : "front"}
                  onViewChange={setView}
                  onFocus={onFocus}
                  onBuy={openBuy}
                  onDismiss={clearFocus}
                  show3D={Boolean(getPants3DMockupSrc(product))}
                  onOpen3D={setMockupProduct}
                />
              </div>
            );
          })}
        </div>
      </div>

      {mockupProduct ? (
        <Hang3DMockupModal
          open
          product={mockupProduct}
          onClose={() => setMockupProduct(null)}
        />
      ) : null}

      {buyProduct ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-teal-deep/35 p-3 backdrop-blur-[1px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Buy ${buyProduct.name}`}
          onClick={() => setBuyProduct(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-teal-deep/10 bg-[#f7f4ef] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setBuyProduct(null)}
              className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-teal-deep shadow-sm"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
              <div
                data-fly-source
                className="relative mx-auto mt-6 h-44 w-28 sm:mx-0 sm:mt-0 sm:h-full sm:min-h-[220px] sm:w-full sm:bg-white/50"
              >
                <Image
                  src={buyProduct.images[0]}
                  alt={buyProduct.name}
                  fill
                  unoptimized
                  className="object-contain object-top p-3"
                  sizes="140px"
                />
              </div>

              <div className="space-y-4 px-5 pb-6 pt-4 sm:pt-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
                    {buyProduct.category}
                  </p>
                  <h3 className="mt-1 font-display text-xl tracking-[0.06em] text-teal-deep">
                    {buyProduct.name.replace(/^UNKNOWN\s+/i, "")}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-coral">
                    {formatPrice(buyProduct.price)}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">
                    Size
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {buyProduct.sizes.map((entry) => (
                      <button
                        key={entry.size}
                        type="button"
                        disabled={entry.stock <= 0}
                        onClick={() => setBuySize(entry.size)}
                        className={cn(
                          "min-w-10 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition",
                          buySize === entry.size
                            ? "border-teal-deep bg-teal-deep text-white"
                            : "border-teal-deep/20 bg-white text-teal-deep hover:border-teal-deep/40",
                          "disabled:cursor-not-allowed disabled:opacity-35"
                        )}
                      >
                        {entry.size}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={onAddToCart}
                  disabled={buySubmitting || !buySize}
                  size="lg"
                  className="w-full"
                >
                  {buySubmitting ? "Adding…" : "Add to cart"}
                </Button>

                <Link
                  href={`/product/${buyProduct._id}`}
                  className="block text-center text-[11px] uppercase tracking-[0.18em] text-teal-deep/70 underline-offset-4 hover:underline"
                  onClick={() => setBuyProduct(null)}
                >
                  View full details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function HangingRailSection({
  id,
  title,
  subtitle,
  products,
  loading,
  focused = false,
  columns = 4,
  swipeable = false,
  hideHeader = false,
}: HangingRailSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-28 px-4 sm:px-6 lg:px-8 ${
        hideHeader ? "pb-14 pt-6" : "py-14"
      } ${focused ? "min-h-[70vh]" : ""}`}
    >
      <div className={swipeable ? "mx-auto w-full" : "mx-auto max-w-7xl"}>
        {!hideHeader ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h2 className="font-display text-3xl tracking-[0.22em] text-teal-deep sm:text-4xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mx-auto mt-3 max-w-xl text-sm text-muted">{subtitle}</p>
            ) : null}
          </motion.div>
        ) : null}

        {loading ? (
          <div className="store-wall relative overflow-hidden rounded-[28px] px-2 pb-10 pt-12 sm:px-6">
            <StoreWallBackdrop />
            <div
              className={`relative z-10 grid grid-cols-2 gap-6 pt-8 ${columns === 3 ? "md:grid-cols-3" : "md:grid-cols-4"}`}
            >
              {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="mx-auto h-64 w-40 skeleton" />
              ))}
            </div>
          </div>
        ) : swipeable ? (
          <InchwormPantsRail products={products} />
        ) : products.length === 0 ? (
          <div className="store-wall relative overflow-hidden rounded-[28px] px-2 pb-10 pt-12 sm:px-6">
            <StoreWallBackdrop />
            <p className="relative z-10 py-16 text-center text-sm text-muted">
              No pieces hanging in this collection yet.
            </p>
          </div>
        ) : (
          <FocusRailGrid products={products} columns={columns} />
        )}
      </div>
    </section>
  );
}
