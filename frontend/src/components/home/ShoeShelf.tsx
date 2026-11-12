"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shuffle, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartUI } from "@/context/CartUIContext";
import { Button } from "@/components/ui/button";

type GridCols = 2 | 3;

interface ShoeShelfProps {
  products: Product[];
  loading?: boolean;
  focused?: boolean;
  /** When the category page already shows the collection title */
  hideHeader?: boolean;
}

/**
 * Center-wall photo width vs stage (%). Cover on a tall stage ≈ 150%+ and crops corners.
 * Full-bleed room photo — real side walls come from the image, not CSS panels.
 */
const SHOE_WALL_BG_WIDTH_PCT = 100;

/** Match New Season Drop presence on laptop (nav 4rem + title/toolbar ~5.5rem). */
const LAPTOP_STAGE_MIN_VH = 0.78;

type RackPad = {
  zoom: number;
  x: number;
  y: number;
};

type LayoutPad = {
  colGap: number;
  rowGap: number;
  wallZoom: number;
  wallPosY: number;
  shoeSize: number;
};

/** Locked Rack framing — laptop/tablet (keep these; do not reuse on phone). */
const LOCKED_RACK_PAD: Record<GridCols, RackPad> = {
  2: { zoom: 0.48, x: -18, y: -40 },
  /** Upward nudge vs prior y:4 — shoes + rails move together via rack translate. */
  3: { zoom: 0.67, x: 6, y: -18 },
};

/** Locked Layout framing — laptop/tablet. */
const LOCKED_LAYOUT_PAD: Record<GridCols, LayoutPad> = {
  2: {
    colGap: 58,
    rowGap: 0,
    wallZoom: 1.19,
    wallPosY: 34,
    shoeSize: 0.62,
  },
  3: {
    colGap: 80,
    rowGap: 0,
    wallZoom: 1.12,
    wallPosY: 34,
    shoeSize: 0.63,
  },
};

/** Locked 2-col shoe tile size (laptop/tablet). */
const LOCKED_TWO_COL_SHOE_H = 2.56;
const LOCKED_TWO_COL_SHOE_W = 94;

/** Mobile Pure Showcasing–style clean stage (no room-wall photo). */
const MOBILE_SHOE_STAGE_BG = "#f6f5f2";

/**
 * Extra vertical tighten for 2-col only (CSS gap:0 still left shelf/aspect/label air).
 * In layout px before rack zoom — slightly less aggressive than -88.
 */
const TWO_COL_ROW_PULL_PX = -64;

type RectMap = Map<string, DOMRect>;

function shuffleArray<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** Capture absolute positions of shoe image tiles for FLIP (rails excluded). */
function captureTileRects(root: HTMLElement | null): RectMap {
  const map: RectMap = new Map();
  if (!root) return map;
  root.querySelectorAll<HTMLElement>("[data-shoe-tile]").forEach((el) => {
    const id = el.dataset.shoeTile;
    if (id) map.set(id, el.getBoundingClientRect());
  });
  return map;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function shoeDisplayName(name: string) {
  return name.replace(/^UNKNOWN\s+/i, "");
}

function shoeImage(shoe: Product, angle: "front" | "back") {
  if (angle === "back") return shoe.images[1] || shoe.images[0];
  return shoe.images[0];
}

/** Warm browser cache so focus / buy panel paint instantly. */
function preloadShoeSources(products: Product[]) {
  const seen = new Set<string>();
  for (const product of products) {
    for (const src of product.images || []) {
      if (!src || seen.has(src)) continue;
      seen.add(src);
      const img = new window.Image();
      img.decoding = "async";
      img.src = src;
    }
  }
}

function GridColsIcon({ cols, active }: { cols: GridCols; active: boolean }) {
  const bars = cols === 2 ? 2 : 3;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-end gap-[3px]",
        active ? "text-teal-deep" : "text-teal-deep/35"
      )}
      aria-hidden
    >
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-[5px] rounded-[1px] transition",
            active ? "bg-teal-deep" : "bg-teal-deep/35",
            i === 0 || i === bars - 1 ? "h-[14px]" : "h-[18px]"
          )}
        />
      ))}
    </span>
  );
}

export function ShoeShelf({
  products,
  loading,
  focused = false,
  hideHeader = false,
}: ShoeShelfProps) {
  const baseShoes = useMemo(
    () => products.slice(0, focused ? 18 : 12),
    [products, focused]
  );

  const [shoes, setShoes] = useState<Product[]>(baseShoes);
  const [cols, setCols] = useState<GridCols>(3);
  const [isMobile, setIsMobile] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [view, setView] = useState<"front" | "back">("front");
  const [buyProduct, setBuyProduct] = useState<Product | null>(null);
  const [buySize, setBuySize] = useState("");
  const [buySubmitting, setBuySubmitting] = useState(false);
  const [shufflePulse, setShufflePulse] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [stageHeight, setStageHeight] = useState<number | null>(null);
  const [rackCenterY, setRackCenterY] = useState(0);
  const [mobilePage, setMobilePage] = useState(0);

  useEffect(() => {
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const sync = () => setIsMobile(mqMobile.matches);
    sync();
    mqMobile.addEventListener("change", sync);
    return () => mqMobile.removeEventListener("change", sync);
  }, []);

  const rackPad: RackPad = useMemo(() => {
    if (isMobile) return { zoom: 1, x: 0, y: 0 };
    return LOCKED_RACK_PAD[cols];
  }, [cols, isMobile]);

  const layoutPad: LayoutPad = useMemo(() => {
    if (isMobile) {
      return {
        colGap: cols === 2 ? 18 : 12,
        rowGap: cols === 2 ? 28 : 22,
        wallZoom: 1.28,
        wallPosY: 42,
        shoeSize: 1,
      };
    }
    return LOCKED_LAYOUT_PAD[cols];
  }, [cols, isMobile]);

  const twoColPull = TWO_COL_ROW_PULL_PX;
  const shoeTileW = cols === 2 ? LOCKED_TWO_COL_SHOE_W : 94;
  const shoeAspectH = cols === 2 ? LOCKED_TWO_COL_SHOE_H : 3;

  /** Rack zoom shrinks labels — pre-zoom px so on-screen size reads ~13/13.5px. */
  const labelNamePx = round2(13 / Math.max(0.35, rackPad.zoom));
  const labelPricePx = round2(13.5 / Math.max(0.35, rackPad.zoom));
  /** Reserve matches name+price+gaps in layout (pre-zoom) space. */
  const labelReservePx = Math.ceil(labelNamePx + labelPricePx + (cols === 2 ? 20 : 24));

  /**
   * 2-col only: seat soles flush on the rail top.
   * Aspect-box bottom already meets the shelf; PNGs keep a few px of transparent
   * pad under the sole. Post-scale translate (~5px on-screen) closes that pad.
   * More than ~6–7px buries soles into the shelf board (looks “perched on top”).
   */
  const twoColShoeSitPx =
    cols === 2 ? Math.round(5 / Math.max(0.35, rackPad.zoom)) : 0;

  const stageRef = useRef<HTMLDivElement | null>(null);
  const rackInnerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const pendingFlipRef = useRef<RectMap | null>(null);
  const shuffleTimerRef = useRef<number | null>(null);
  const preloadedRef = useRef<Set<string>>(new Set());

  const { addItem } = useCart();
  const { user } = useAuth();
  const { flyToBag } = useCartUI();

  useEffect(() => {
    setShoes(baseShoes);
  }, [baseShoes]);

  useEffect(() => {
    preloadShoeSources(baseShoes);
    for (const product of baseShoes) {
      for (const src of product.images || []) {
        if (src) preloadedRef.current.add(src);
      }
    }
  }, [baseShoes]);

  useEffect(() => {
    return () => {
      if (shuffleTimerRef.current != null) {
        window.clearTimeout(shuffleTimerRef.current);
      }
    };
  }, []);

  const perPage = cols === 2 ? 6 : 9;
  const mobilePages = Math.max(1, Math.ceil(shoes.length / perPage));
  const mobileShoes = useMemo(() => {
    if (!isMobile) return shoes;
    const start = mobilePage * perPage;
    return shoes.slice(start, start + perPage);
  }, [isMobile, mobilePage, perPage, shoes]);

  useEffect(() => {
    setMobilePage(0);
  }, [cols, shoes.length]);

  useEffect(() => {
    if (mobilePage > mobilePages - 1) {
      setMobilePage(Math.max(0, mobilePages - 1));
    }
  }, [mobilePage, mobilePages]);

  /** Clip stage to scaled rack height; laptop floor matches Drop section presence. */
  useLayoutEffect(() => {
    if (isMobile) {
      setStageHeight(null);
      setRackCenterY(0);
      return;
    }

    const inner = rackInnerRef.current;
    if (!inner) return;

    const measure = () => {
      const raw = inner.offsetHeight;
      const contentH =
        raw * rackPad.zoom + Math.max(0, Math.abs(rackPad.y)) + 48;
      const vhFloor = Math.round(window.innerHeight * LAPTOP_STAGE_MIN_VH);
      const next = Math.max(vhFloor, Math.round(contentH));
      setStageHeight(next);
      const centered = Math.max(0, Math.round((next - contentH) / 2));
      setRackCenterY(centered);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [cols, shoes.length, rackPad.zoom, rackPad.y, isMobile, layoutPad]);

  /** After React commits the new order, invert shoe image positions and play FLIP. */
  useLayoutEffect(() => {
    const first = pendingFlipRef.current;
    const root = gridRef.current;
    if (!first || !root) return;
    pendingFlipRef.current = null;

    const last = captureTileRects(root);
    const durationMs = 780;

    first.forEach((firstRect, id) => {
      const el = root.querySelector<HTMLElement>(`[data-shoe-tile="${id}"]`);
      const lastRect = last.get(id);
      if (!el || !lastRect) return;

      const dx = firstRect.left - lastRect.left;
      const dy = firstRect.top - lastRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

      el.style.zIndex = "12";
      el.style.transition = "none";
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.willChange = "transform";

      void el.offsetWidth;

      const delay = Math.random() * 90;
      el.style.transition = `transform ${durationMs}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`;
      el.style.transform = "translate(0px, 0px)";
    });

    if (shuffleTimerRef.current != null) {
      window.clearTimeout(shuffleTimerRef.current);
    }
    shuffleTimerRef.current = window.setTimeout(() => {
      root.querySelectorAll<HTMLElement>("[data-shoe-tile]").forEach((el) => {
        el.style.transition = "";
        el.style.transform = "";
        el.style.willChange = "";
        el.style.zIndex = "";
      });
      setIsShuffling(false);
      shuffleTimerRef.current = null;
    }, durationMs + 140);
  }, [shoes]);

  const onShuffle = useCallback(() => {
    if (isShuffling) return;
    setFocusId(null);
    setView("front");
    setBuyProduct(null);

    const first = captureTileRects(gridRef.current);
    if (first.size === 0 && !isMobile) return;

    const prev = shoes;
    if (prev.length < 2) return;
    let next = shuffleArray(prev);
    let guard = 0;
    while (
      next.every((item, i) => item._id === prev[i]._id) &&
      guard < 8
    ) {
      next = shuffleArray(prev);
      guard += 1;
    }
    if (next.every((item, i) => item._id === prev[i]._id)) return;

    if (!isMobile) pendingFlipRef.current = first;
    setIsShuffling(true);
    setShufflePulse((n) => n + 1);
    setShoes(next);
    if (isMobile) {
      window.setTimeout(() => setIsShuffling(false), 420);
    }
  }, [isMobile, isShuffling, shoes]);

  const focusedShoe = useMemo(
    () => shoes.find((s) => s._id === focusId) ?? null,
    [shoes, focusId]
  );

  const focusedSrc = focusedShoe ? shoeImage(focusedShoe, view) : null;

  useEffect(() => {
    if (!focusedSrc) return;
    if (preloadedRef.current.has(focusedSrc)) return;
    const img = new window.Image();
    img.decoding = "async";
    img.src = focusedSrc;
    preloadedRef.current.add(focusedSrc);
  }, [focusedSrc]);

  useEffect(() => {
    if (!focusId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusId(null);
        setBuyProduct(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusId]);

  const clearFocus = useCallback(() => {
    setFocusId(null);
    setView("front");
  }, []);

  const openBuy = useCallback((product: Product) => {
    const src = product.images?.[0];
    if (src && !preloadedRef.current.has(src)) {
      const img = new window.Image();
      img.src = src;
      preloadedRef.current.add(src);
    }
    setBuyProduct(product);
    setBuySize(
      product.sizes.find((s) => s.stock > 0)?.size ||
        product.sizes[0]?.size ||
        ""
    );
  }, []);

  const onShoeClick = (product: Product) => (e: MouseEvent) => {
    e.stopPropagation();
    if (focusId && focusId !== product._id) {
      clearFocus();
      return;
    }
    const src = product.images?.[0];
    if (src) {
      const img = new window.Image();
      img.src = src;
      preloadedRef.current.add(src);
    }
    setFocusId(product._id);
    setView("front");
  };

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
      // toast from cart context
    } finally {
      setBuySubmitting(false);
    }
  }, [buyProduct, buySize, user, addItem, flyToBag]);

  const toolbar = (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        isMobile ? "mb-3 px-0.5" : "mb-4 px-0.5"
      )}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1 p-1",
          isMobile
            ? "gap-2 bg-transparent p-0"
            : "rounded-full border border-teal-deep/15 bg-white/55 shadow-sm backdrop-blur-sm"
        )}
        role="group"
        aria-label="Product grid density"
      >
        <button
          type="button"
          aria-label="2 column grid"
          aria-pressed={cols === 2}
          onClick={() => setCols(2)}
          className={cn(
            "inline-flex items-center justify-center transition",
            isMobile
              ? "h-8 w-9"
              : "h-9 w-10 rounded-full",
            !isMobile && (cols === 2 ? "bg-white shadow-sm" : "hover:bg-white/70")
          )}
        >
          <GridColsIcon cols={2} active={cols === 2} />
        </button>
        <button
          type="button"
          aria-label="3 column grid"
          aria-pressed={cols === 3}
          onClick={() => setCols(3)}
          className={cn(
            "inline-flex items-center justify-center transition",
            isMobile
              ? "h-8 w-9"
              : "h-9 w-10 rounded-full",
            !isMobile && (cols === 3 ? "bg-white shadow-sm" : "hover:bg-white/70")
          )}
        >
          <GridColsIcon cols={3} active={cols === 3} />
        </button>
      </div>

      <button
        type="button"
        onClick={onShuffle}
        disabled={shoes.length < 2 || isShuffling}
        aria-label="Shuffle shoe order"
        aria-busy={isShuffling}
        className={cn(
          "inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-teal-deep transition",
          isMobile
            ? "h-8 px-2"
            : "h-9 rounded-full border border-teal-deep/15 bg-white/70 px-3.5 shadow-sm backdrop-blur-sm hover:border-teal-deep/30 hover:bg-white",
          "disabled:cursor-not-allowed disabled:opacity-40"
        )}
      >
        <Shuffle
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-500",
            isShuffling && "animate-spin",
            !isShuffling && shufflePulse > 0 && "rotate-180"
          )}
        />
        {isShuffling ? "Shuffling" : "Shuffle"}
      </button>

      <p className="min-w-[3.5rem] text-right text-[10px] uppercase tracking-[0.22em] text-teal-deep/45">
        {shoes.length ? `${String(shoes.length).padStart(2, "0")} pairs` : "—"}
      </p>
    </div>
  );

  const gridPadClass =
    cols === 2
      ? "grid-cols-2 py-5 sm:px-10 sm:py-6"
      : "grid-cols-3 py-8 sm:px-10 sm:py-10";

  const gridStyle = {
    columnGap: `${layoutPad.colGap}px`,
    rowGap: `${layoutPad.rowGap}px`,
  } as const;

  const shelfBlock = (index: number) => (
    <div
      key={`rail-${cols}-${index}`}
      className={cn("relative", cols === 2 && "pb-0")}
      style={cols === 2 ? { marginBottom: twoColPull } : undefined}
      aria-hidden
    >
      <div
        className="relative mx-auto"
        style={{
          width: `${shoeTileW}%`,
          aspectRatio: `5 / ${shoeAspectH}`,
        }}
      />
      <div className="relative mx-auto -mt-[1px] w-full">
        <div
          className={cn(
            "shoe-float-shelf w-full",
            cols === 2 ? "h-1.5 sm:h-2" : "h-2 sm:h-2.5"
          )}
        />
        <div
          className={cn(
            "shoe-float-shelf-edge w-full",
            cols === 2 ? "h-[2px]" : "h-[3px]"
          )}
        />
        <div
          className={cn(
            "shoe-float-shelf-shadow mx-auto w-[94%]",
            cols === 2 ? "h-1.5" : "h-3"
          )}
        />
      </div>
      <div
        className={cols === 2 ? "mt-1" : "mt-2"}
        style={{ height: `${labelReservePx}px` }}
      />
    </div>
  );

  const renderDesktopShoe = (shoe: Product, index: number) => {
    const isFocused = focusId === shoe._id;
    const gridDimmed = Boolean(focusId);
    const src = shoe.images[0];

    return (
      <div
        key={shoe._id}
        data-shoe-tile={shoe._id}
        className={cn(
          "relative",
          gridDimmed && "pointer-events-none z-[5]",
          isShuffling && "pointer-events-none",
          cols === 2 && "pb-0"
        )}
        style={cols === 2 ? { marginBottom: twoColPull } : undefined}
      >
        <motion.div
          initial={false}
          animate={{
            opacity: gridDimmed ? 0.18 : 1,
            scale: 1,
            filter: gridDimmed ? "blur(5px)" : "blur(0px)",
          }}
          transition={{
            duration: isShuffling ? 0.2 : 0.28,
            delay: 0,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <button
            type="button"
            className="group w-full cursor-pointer text-left outline-none"
            aria-label={
              isFocused ? `${shoe.name} selected` : `Focus ${shoe.name}`
            }
            aria-pressed={isFocused}
            onClick={onShoeClick(shoe)}
            disabled={gridDimmed}
          >
            <div
              className={cn(
                "relative mx-auto overflow-visible transition duration-300",
                !focusId &&
                  "group-hover:-translate-y-1 group-hover:scale-[1.04]"
              )}
              style={{
                width: `${shoeTileW}%`,
                aspectRatio: `5 / ${shoeAspectH}`,
              }}
            >
              <div
                className="absolute inset-0 origin-bottom"
                style={{
                  /* translateY after scale in the list → not multiplied by shoeSize */
                  transform:
                    cols === 2
                      ? `translateY(${twoColShoeSitPx}px) scale(${layoutPad.shoeSize})`
                      : `scale(${layoutPad.shoeSize})`,
                }}
              >
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-x-[10%] bottom-[8%] h-1/2 rounded-full bg-white/0 blur-2xl transition duration-300",
                    !focusId && "group-hover:bg-white/50"
                  )}
                />
                <Image
                  src={src}
                  alt={shoe.name}
                  fill
                  unoptimized
                  priority={index < 6}
                  loading={index < 6 ? "eager" : "lazy"}
                  sizes={cols === 2 ? "280px" : "180px"}
                  className={cn(
                    "object-contain object-bottom drop-shadow-[0_8px_12px_rgba(40,28,16,0.22)] transition duration-300",
                    cols !== 2 && "translate-y-[2px]",
                    !focusId &&
                      "group-hover:brightness-110 group-hover:drop-shadow-[0_12px_16px_rgba(40,28,16,0.3)]"
                  )}
                  draggable={false}
                />
              </div>
            </div>

            <div className="relative mx-auto -mt-[1px] w-full" aria-hidden>
              <div
                className={cn(
                  "w-full opacity-0",
                  cols === 2 ? "h-1.5 sm:h-2" : "h-2 sm:h-2.5"
                )}
              />
              <div
                className={cn(
                  "w-full opacity-0",
                  cols === 2 ? "h-[2px]" : "h-[3px]"
                )}
              />
              <div
                className={cn(
                  "mx-auto w-[94%] opacity-0",
                  cols === 2 ? "h-1.5" : "h-3"
                )}
              />
            </div>

            <div
              className={cn(
                "text-center transition duration-300",
                cols === 2 ? "mt-1 leading-tight" : "mt-1.5 leading-tight",
                gridDimmed && "opacity-0"
              )}
            >
              <p
                className="font-medium uppercase tracking-[0.06em] text-teal-deep/90"
                style={{ fontSize: `${labelNamePx}px` }}
              >
                {shoeDisplayName(shoe.name)}
              </p>
              <p
                className="mt-1 font-medium text-coral"
                style={{ fontSize: `${labelPricePx}px` }}
              >
                {formatPrice(shoe.price)}
              </p>
            </div>
          </button>
        </motion.div>
      </div>
    );
  };

  const renderMobileShoe = (shoe: Product, index: number) => {
    const isFocused = focusId === shoe._id;
    const gridDimmed = Boolean(focusId);
    const src = shoe.images[0];

    return (
      <div
        key={shoe._id}
        data-shoe-tile={shoe._id}
        className={cn(
          "relative",
          gridDimmed && "pointer-events-none opacity-25"
        )}
      >
        <button
          type="button"
          className="group w-full cursor-pointer text-center outline-none"
          aria-label={
            isFocused ? `${shoe.name} selected` : `Focus ${shoe.name}`
          }
          aria-pressed={isFocused}
          onClick={onShoeClick(shoe)}
          disabled={gridDimmed}
        >
          <div
            className={cn(
              "relative mx-auto w-[92%] transition duration-300",
              cols === 2 ? "aspect-[5/3.1]" : "aspect-[5/3.4]"
            )}
          >
            <Image
              src={src}
              alt={shoe.name}
              fill
              unoptimized
              priority={index < perPage}
              loading="eager"
              sizes={cols === 2 ? "46vw" : "30vw"}
              className="object-contain object-bottom drop-shadow-[0_8px_12px_rgba(40,28,16,0.22)]"
              draggable={false}
            />
          </div>

          {/* Thin platform line — Pure Showcasing aesthetic */}
          <div
            className="mx-auto mt-1 h-px w-[88%] bg-[#2a2a2a]/55"
            aria-hidden
          />

          <div className="mt-2 px-0.5">
            <p
              className={cn(
                "truncate font-semibold leading-snug text-[#141414]",
                cols === 2 ? "text-[13px]" : "text-[11px]"
              )}
            >
              {shoeDisplayName(shoe.name)}
            </p>
            <p
              className={cn(
                "mt-1 font-medium text-coral",
                cols === 2 ? "text-[13px]" : "text-[11px]"
              )}
            >
              {formatPrice(shoe.price)}
            </p>
          </div>
        </button>
      </div>
    );
  };

  const focusOverlay = (
    <AnimatePresence>
      {focusedShoe && focusedSrc ? (
        <motion.div
          key={`focus-${focusedShoe._id}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.22 }}
          className="absolute inset-0 z-[35] flex flex-col items-center justify-center px-4 pb-6 pt-12"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dedicated focus image — preloaded / priority so it paints immediately */}
          <div
            className={cn(
              "relative w-full max-w-[280px]",
              isMobile ? "h-[42vw] max-h-[220px]" : "h-[min(38vh,320px)]"
            )}
          >
            <Image
              key={`focus-hero-${focusedShoe._id}-${view}`}
              src={focusedSrc}
              alt={shoeDisplayName(focusedShoe.name)}
              fill
              unoptimized
              priority
              loading="eager"
              sizes="(max-width: 768px) 70vw, 320px"
              className="object-contain object-center drop-shadow-[0_24px_36px_rgba(40,28,16,0.4)]"
              draggable={false}
            />
          </div>
          <p className="mt-3 text-center text-[11px] font-medium uppercase tracking-[0.16em] text-teal-deep">
            {shoeDisplayName(focusedShoe.name)}
          </p>
          <p className="mt-1 text-[12px] text-coral">
            {formatPrice(focusedShoe.price)}
          </p>
          <div className="mt-3 flex items-center justify-center gap-1.5">
            {(["front", "back"] as const).map((angle) => (
              <button
                key={angle}
                type="button"
                onClick={() => setView(angle)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] transition",
                  view === angle
                    ? "border-teal-deep bg-teal-deep text-white"
                    : "border-teal-deep/20 bg-white/90 text-teal-deep hover:border-teal-deep/40"
                )}
              >
                {angle}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => openBuy(focusedShoe)}
            className="mt-3 inline-flex h-9 items-center justify-center rounded-full bg-coral px-5 text-[10px] uppercase tracking-[0.18em] text-white shadow-md shadow-coral/25 transition hover:bg-coral-soft"
          >
            Buy now
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  const buyModal = buyProduct ? (
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
            className="relative mx-auto mt-6 h-36 w-40 sm:mx-0 sm:mt-0 sm:h-full sm:min-h-[200px] sm:w-full sm:bg-white/50"
          >
            <Image
              src={buyProduct.images[0]}
              alt={buyProduct.name}
              fill
              unoptimized
              priority
              loading="eager"
              className="object-contain object-center p-3"
              sizes="160px"
            />
          </div>

          <div className="space-y-4 px-5 pb-6 pt-4 sm:pt-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-muted">
                {buyProduct.category}
              </p>
              <h3 className="mt-1 font-display text-xl tracking-[0.06em] text-teal-deep">
                {shoeDisplayName(buyProduct.name)}
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
  ) : null;

  const wallBg = (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <Image
        src="/rooms/shoes-room-wall.jpg"
        alt=""
        width={1280}
        height={720}
        unoptimized
        priority
        sizes="(max-width: 1024px) 100vw, 1100px"
        className={cn(
          "absolute left-1/2 h-auto max-w-none transition duration-500",
          focusId && "blur-[7px] brightness-[0.88]"
        )}
        style={{
          width: `${SHOE_WALL_BG_WIDTH_PCT}%`,
          top: `${layoutPad.wallPosY}%`,
          transform: `translate(-50%, -50%) scale(${round2(
            layoutPad.wallZoom * (focusId ? 1.03 : 1)
          )})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-[rgba(8,59,63,0.07)]" />
    </div>
  );

  return (
    <section
      id="shoes"
      className={cn(
        "scroll-mt-28",
        isMobile
          ? "px-3 py-4"
          : "px-4 py-10 sm:px-6 lg:px-8",
        focused && !isMobile ? "min-h-[calc(100dvh-4rem-3.25rem)]" : "",
        focused && isMobile ? "min-h-0" : ""
      )}
    >
      <div
        className={cn(
          "mx-auto",
          isMobile ? "max-w-lg" : "max-w-6xl lg:max-w-[1400px]"
        )}
      >
        {!hideHeader ? (
          <div className={cn("text-center", isMobile ? "mb-3" : "mb-6")}>
            <h2 className="font-display text-3xl tracking-[0.22em] text-teal-deep sm:text-4xl">
              SHOES
            </h2>
            {!isMobile ? (
              <p className="mt-3 text-sm text-muted">
                Studio wall grid — switch 2 or 3 columns, tap a pair to focus and
                buy.
              </p>
            ) : null}
          </div>
        ) : null}

        {isMobile ? (
          <div className="mb-2 text-center">
            <p className="text-[10px] uppercase tracking-[0.28em] text-teal-deep/45">
              Shoe wall
            </p>
            <p className="mt-1 font-display text-[1.35rem] tracking-[0.04em] text-teal-deep">
              A place for every pair.
            </p>
          </div>
        ) : null}

        {toolbar}

        {loading ? (
          <div
            className={cn(
              "skeleton rounded-[28px]",
              isMobile ? "h-[min(72dvh,560px)]" : "h-[min(78vh,720px)]"
            )}
          />
        ) : shoes.length === 0 ? (
          <div className="shoe-bamboo-wall relative flex h-[min(56vh,480px)] items-center justify-center overflow-hidden rounded-[28px]">
            <p className="relative z-10 text-sm text-teal-deep/70">
              No shoes on the wall yet.
            </p>
          </div>
        ) : isMobile ? (
          /* —— Mobile: Pure Showcasing clean stage (no room-wall photo) —— */
          <div
            ref={stageRef}
            className={cn(
              "relative mx-auto w-full overflow-hidden rounded-[22px] shadow-[0_18px_40px_rgba(8,59,63,0.1)] ring-1 ring-black/[0.04]",
              cols === 2 ? "min-h-[min(78dvh,640px)]" : "min-h-[min(72dvh,600px)]"
            )}
            style={{ background: MOBILE_SHOE_STAGE_BG }}
            onClick={() => {
              if (buyProduct) return;
              clearFocus();
            }}
          >

            {focusId ? (
              <div className="absolute left-2 right-2 top-2 z-[40] flex items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFocus();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-teal-deep shadow-sm backdrop-blur-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </div>
            ) : null}

            {focusId ? (
              <button
                type="button"
                aria-label="Clear focused shoe"
                className="absolute inset-0 z-[20] cursor-pointer bg-[#2a2018]/22"
                onClick={() => clearFocus()}
              />
            ) : null}

            <div
              ref={gridRef}
              className={cn(
                "relative z-10 grid px-3 pb-14 pt-5",
                cols === 2 ? "grid-cols-2 gap-x-4 gap-y-7" : "grid-cols-3 gap-x-2.5 gap-y-6"
              )}
            >
              {mobileShoes.map((shoe, index) => renderMobileShoe(shoe, index))}
            </div>

            {/* Pagination feel */}
            <div className="absolute inset-x-4 bottom-3 z-[15] flex items-center gap-3">
              <div className="relative h-px flex-1 bg-teal-deep/15">
                <div
                  className="absolute inset-y-0 left-0 bg-teal-deep/55"
                  style={{
                    width: `${((mobilePage + 1) / mobilePages) * 100}%`,
                  }}
                />
              </div>
              <p className="shrink-0 text-[10px] tabular-nums tracking-[0.14em] text-teal-deep/45">
                {String(mobilePage + 1).padStart(2, "0")} /{" "}
                {String(mobilePages).padStart(2, "0")}
              </p>
              {mobilePages > 1 ? (
                <div className="flex gap-1">
                  <button
                    type="button"
                    aria-label="Previous page"
                    disabled={mobilePage <= 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobilePage((p) => Math.max(0, p - 1));
                    }}
                    className="rounded-full border border-teal-deep/15 bg-white/70 px-2 py-0.5 text-[10px] text-teal-deep disabled:opacity-30"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    aria-label="Next page"
                    disabled={mobilePage >= mobilePages - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobilePage((p) => Math.min(mobilePages - 1, p + 1));
                    }}
                    className="rounded-full border border-teal-deep/15 bg-white/70 px-2 py-0.5 text-[10px] text-teal-deep disabled:opacity-30"
                  >
                    ›
                  </button>
                </div>
              ) : null}
            </div>

            {focusOverlay}
          </div>
        ) : (
          /* —— Laptop / tablet: taller stage, locked 3-col framing —— */
          <div
            ref={stageRef}
            className="shoe-bamboo-wall relative mx-auto w-full overflow-hidden rounded-[28px]"
            style={stageHeight != null ? { height: stageHeight } : undefined}
            onClick={() => {
              if (buyProduct) return;
              clearFocus();
            }}
          >
            {wallBg}

            {focusId ? (
              <div className="absolute left-3 right-3 top-3 z-[40] flex items-center sm:left-4 sm:right-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFocus();
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/90 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-teal-deep shadow-sm backdrop-blur-sm"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
              </div>
            ) : null}

            {focusId ? (
              <button
                type="button"
                aria-label="Clear focused shoe"
                className="absolute inset-0 z-[20] cursor-pointer bg-[#2a2018]/25"
                onClick={() => clearFocus()}
              />
            ) : null}

            <div
              className="relative z-10 origin-top"
              style={{
                transform: `translate(${rackPad.x}px, ${
                  rackCenterY + rackPad.y
                }px) scale(${rackPad.zoom})`,
                transformOrigin: "top center",
                willChange: "transform",
              }}
            >
              <div ref={rackInnerRef} className="relative">
                <div
                  className={cn(
                    "relative grid px-6 lg:px-12",
                    gridPadClass,
                    cols === 2 && "auto-rows-min"
                  )}
                  style={gridStyle}
                  aria-hidden
                >
                  {shoes.map((_, index) => shelfBlock(index))}
                </div>

                <div
                  ref={gridRef}
                  className={cn(
                    "absolute inset-0 grid px-6 lg:px-12",
                    gridPadClass,
                    cols === 2 && "auto-rows-min"
                  )}
                  style={gridStyle}
                >
                  {shoes.map((shoe, index) => renderDesktopShoe(shoe, index))}
                </div>
              </div>
            </div>

            {focusOverlay}

            <p className="pointer-events-none absolute bottom-3 left-1/2 z-[5] -translate-x-1/2 text-[9px] uppercase tracking-[0.28em] text-teal-deep/55 sm:text-[10px]">
              Shoe wall
            </p>
          </div>
        )}
      </div>

      {buyModal}
    </section>
  );
}
