"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Box } from "lucide-react";
import type { Product, ProductColorway } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";

export type HangView = "front" | "back";

interface HangingProductCardProps {
  product: Product;
  index?: number;
  /** Soft elongated cast shadow on the wall behind the garment */
  wallShadow?: boolean;
  /** This card is the focused piece (front + controls) */
  isFocused?: boolean;
  /** Another card is focused — blur / dim this one */
  isDimmed?: boolean;
  /** Disable CSS idle hang-swing (GSAP rail owns transform) */
  railMotion?: boolean;
  view?: HangView;
  onViewChange?: (view: HangView) => void;
  onFocus?: (product: Product) => void;
  onBuy?: (product: Product) => void;
  /** Exit focus mode (dimmed side click) */
  onDismiss?: () => void;
  /** Show Studio 3D control (pants) */
  show3D?: boolean;
  onOpen3D?: (product: Product) => void;
}

/** Local hanging mockups already include a hanger in the photo */
function isHangingMockup(src: string) {
  return src.includes("/hanging/") || src.includes("/products/hanging/");
}

/** Air-cut ghosts available on disk (avoid 404 for redesign SKUs). */
const GHOST_FRONT_RE =
  /\/products\/hanging\/(shirts\/tee(?:[1-9]|1[0-3])|jackets\/jacket[1-3]|pants\/pant[12]|trousers\/trouser1)-front\.png$/;

function preferHangGhost(src: string) {
  if (!src || src.includes("-ghost.")) return src;
  if (!GHOST_FRONT_RE.test(src)) return src;
  return src.replace(/-front\.png$/, "-front-ghost.png");
}

function resolveColorways(product: Product): ProductColorway[] {
  if (product.colorways && product.colorways.length > 0) {
    return product.colorways;
  }
  return [
    {
      color: product.colors?.[0] || "#0a0a0a",
      images: product.images,
    },
  ];
}

function WoodenHanger({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 140 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("mx-auto h-9 w-32", className)}
      aria-hidden
    >
      <path
        d="M70 3c0 0 7.5.2 7.5 7.2S72.2 17 70 17s-7.5-1.8-7.5-6.5"
        stroke="#6b7280"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M70 17v5" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M14 36 L70 23 L126 36"
        stroke="#b8956a"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22 36h96" stroke="#9a7548" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function HangingProductCard({
  product,
  index = 0,
  wallShadow = false,
  isFocused = false,
  isDimmed = false,
  railMotion = false,
  view = "front",
  onViewChange,
  onFocus,
  onBuy,
  onDismiss,
  show3D = false,
  onOpen3D,
}: HangingProductCardProps) {
  const ways = useMemo(() => resolveColorways(product), [product]);
  const supportsColor = ways.length > 1;
  const [colorIdx, setColorIdx] = useState(0);
  const [wipeFrom, setWipeFrom] = useState<number | null>(null);
  const [wiping, setWiping] = useState(false);
  const [droppedCard, setDroppedCard] = useState<number | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setColorIdx(0);
      setWipeFrom(null);
      setWiping(false);
      setDroppedCard(null);
    }
  }, [isFocused, product._id]);

  const active = ways[Math.min(colorIdx, ways.length - 1)] || ways[0];
  const prev =
    wipeFrom != null ? ways[Math.min(wipeFrom, ways.length - 1)] : null;
  const front = preferHangGhost(active.images[0] || product.images[0] || "");
  const back = active.images[1] || active.images[0] || product.images[0];
  const src = view === "back" ? back : front;
  const prevSrc = prev
    ? view === "back"
      ? prev.images[1] || prev.images[0]
      : preferHangGhost(prev.images[0] || "")
    : null;

  const hangingPhoto = isHangingMockup(front || "");
  const isShoe = product.category === "shoes";
  /** Shoes in mixed search/all grids: no wooden hanger (apparel keeps hangers). */
  const showHanger = !hangingPhoto && !isShoe;
  const isJacketHang =
    product.category === "jackets" ||
    Boolean(hangingPhoto && front?.includes("/jackets/"));
  /** Tall frame for pants/trousers only — jackets share hoodie-like crop */
  const isPantsHang =
    !isJacketHang &&
    hangingPhoto &&
    (front?.includes("/pants/") || front?.includes("/trousers/"));
  const showColorRail =
    isFocused &&
    supportsColor &&
    (product.category === "shirts" ||
      product.category === "t-shirts" ||
      product.category === "pants");

  const pickColor = (next: number) => {
    if (next === colorIdx || wiping) return;
    setDroppedCard(next);
    setWipeFrom(colorIdx);
    setColorIdx(next);
    setWiping(true);
    window.setTimeout(() => {
      setWiping(false);
      setWipeFrom(null);
      setDroppedCard(null);
    }, 700);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{
        opacity: isDimmed ? 0.28 : 1,
        scale: isFocused ? 1.06 : 1,
        filter: isDimmed ? "blur(5px)" : "blur(0px)",
        zIndex: isFocused ? 40 : isDimmed ? 1 : 10,
      }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative",
        isFocused && "z-40",
        isDimmed && "select-none"
      )}
    >
      <button
        type="button"
        onClick={() => {
          if (isDimmed) {
            onDismiss?.();
            return;
          }
          onFocus?.(product);
        }}
        className="block w-full cursor-pointer text-left outline-none"
        aria-pressed={isFocused}
        aria-label={
          isDimmed
            ? "Back to rack"
            : isFocused
              ? `${product.name} selected`
              : `Focus ${product.name}`
        }
      >
        <div className="relative mx-auto flex w-full max-w-[280px] flex-col items-center pt-1">
          {showHanger ? (
            <div className="relative z-30 -mt-2 flex flex-col items-center">
              <div className="h-4 w-[2px] bg-[#1a1a1a]/80" />
              <WoodenHanger className="relative z-20 -mt-1 transition duration-300 group-hover:-translate-y-0.5" />
            </div>
          ) : null}

          {wallShadow ? (
            <span
              aria-hidden
              className={cn(
                "rack-wall-shadow pointer-events-none absolute left-1/2 top-[10%] -z-10",
                isFocused && "rack-wall-shadow-active"
              )}
            />
          ) : null}

          <div
            data-hang-piece
            className={cn(
              "relative z-10 w-full origin-top transition duration-300 ease-out",
              !railMotion && !isFocused && !isShoe && "hang-swing",
              !railMotion &&
                !isFocused &&
                "group-hover:scale-[1.05] group-hover:rotate-[-1deg] group-hover:brightness-110 group-hover:[animation-play-state:paused]",
              hangingPhoto ? "-mt-5" : isShoe ? "mt-0" : "-mt-1",
              isFocused && "scale-[1.04] brightness-110"
            )}
            style={
              railMotion
                ? undefined
                : {
                    filter: isFocused
                      ? "drop-shadow(0 30px 36px rgba(8,59,63,0.38))"
                      : "drop-shadow(0 26px 32px rgba(8,59,63,0.28))",
                  }
            }
          >
            <span
              aria-hidden
              className={cn(
                "pointer-events-none absolute inset-x-[12%] top-[20%] h-1/2 rounded-full bg-teal-deep/0 blur-2xl transition duration-300",
                !isFocused && !isDimmed && "group-hover:bg-teal-deep/10",
                isFocused && "bg-teal-deep/12"
              )}
            />

            <div
              className={cn(
                "relative mx-auto w-[92%] overflow-hidden",
                isPantsHang
                  ? "aspect-[2/5] max-h-[420px]"
                  : isJacketHang
                    ? "aspect-[3/4] max-h-[360px]"
                    : isShoe
                      ? "aspect-[4/3]"
                      : hangingPhoto
                        ? "aspect-[3/4]"
                        : "aspect-[3/4.15]"
              )}
            >
              {/* Base / outgoing layer during wipe */}
              {prevSrc && wiping ? (
                <Image
                  src={prevSrc}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width:768px) 45vw, 280px"
                  className="!bg-transparent object-contain object-top"
                  draggable={false}
                />
              ) : null}

              {/* Incoming color — clips top → bottom */}
              <motion.div
                key={`${src}-${wiping ? "wipe" : "idle"}-${colorIdx}`}
                className="absolute inset-0"
                initial={
                  wiping
                    ? { clipPath: "inset(0% 0 100% 0)" }
                    : { clipPath: "inset(0% 0 0% 0)" }
                }
                animate={{ clipPath: "inset(0% 0 0% 0)" }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src={src}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width:768px) 45vw, 280px"
                  style={{ background: "transparent" }}
                  className={cn(
                    "!bg-transparent object-contain",
                    isShoe ? "object-center" : "object-top",
                    /* Hide leftover white cutout fringe on the light studio stage */
                    hangingPhoto && !isShoe && "mix-blend-mode-darken"
                  )}
                  priority={index < 3}
                  draggable={false}
                />
              </motion.div>
            </div>

            {!wallShadow ? (
              <div
                className={cn(
                  "mx-auto mt-2 h-3 w-1/2 rounded-full bg-teal/15 blur-md transition duration-300",
                  !isFocused && "group-hover:w-2/3 group-hover:bg-teal/30",
                  isFocused && "w-2/3 bg-teal/30"
                )}
              />
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            "space-y-1 text-center transition duration-300",
            isJacketHang ? "mt-1.5" : "mt-3",
            isDimmed && "opacity-0"
          )}
        >
          <h3 className="text-[12px] font-medium uppercase tracking-[0.14em] text-teal-deep">
            {product.name.replace(/^UNKNOWN\s+/i, "")}
          </h3>
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <span>{formatPrice(product.price)}</span>
          </div>
        </div>
      </button>

      {/* Hanging color cards from the rack rope */}
      <AnimatePresence>
        {showColorRail ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-auto absolute -top-3 left-[calc(50%+4.5rem)] z-[55] flex -translate-x-1/2 items-start gap-2.5 sm:left-[calc(50%+5.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            {ways.map((way, i) => {
              const activeCard = colorIdx === i;
              const dropping = droppedCard === i;
              return (
                <button
                  key={`${way.color}-${i}`}
                  type="button"
                  aria-label={`Color ${way.color}`}
                  aria-pressed={activeCard}
                  disabled={wiping}
                  onClick={() => pickColor(i)}
                  className="group/swatch flex flex-col items-center outline-none"
                >
                  {/* string from rope */}
                  <span
                    aria-hidden
                    className="mb-0.5 h-5 w-px bg-teal-deep/35"
                  />
                  <motion.span
                    animate={{
                      y: dropping ? 10 : activeCard ? 4 : 0,
                      scale: dropping ? 0.94 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 22 }}
                    className={cn(
                      "block h-11 w-8 rounded-[4px] border shadow-md transition",
                      activeCard
                        ? "border-teal-deep ring-2 ring-teal-deep/25"
                        : "border-white/80 group-hover/swatch:border-teal-deep/40",
                      way.color.toLowerCase() === "#ffffff" ||
                        way.color.toLowerCase() === "#f5f0e6"
                        ? "shadow-inner"
                        : ""
                    )}
                    style={{ backgroundColor: way.color }}
                  />
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {isFocused ? (
        <div
          className="relative z-50 mt-4 flex flex-col items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center gap-2">
            {(["front", "back"] as HangView[]).map((angle) => (
              <button
                key={angle}
                type="button"
                onClick={() => onViewChange?.(angle)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition",
                  view === angle
                    ? "border-teal-deep bg-teal-deep text-white"
                    : "border-teal-deep/20 bg-white/80 text-teal-deep hover:border-teal-deep/40"
                )}
              >
                {angle}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {show3D ? (
              <button
                type="button"
                onClick={() => onOpen3D?.(product)}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-teal-deep/25 bg-white/90 px-5 text-[11px] uppercase tracking-[0.18em] text-teal-deep shadow-sm transition hover:border-teal-deep/50"
              >
                <Box className="h-3.5 w-3.5" strokeWidth={1.75} />
                3D view
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onBuy?.(product)}
              className="inline-flex h-10 items-center justify-center rounded-full bg-coral px-7 text-[11px] uppercase tracking-[0.2em] text-white shadow-lg shadow-coral/25 transition hover:bg-coral-soft"
            >
              Buy now
            </button>
          </div>
        </div>
      ) : null}
    </motion.article>
  );
}
