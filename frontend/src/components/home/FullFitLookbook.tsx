"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice, cn } from "@/lib/utils";
import {
  WINTER_LOOKS,
  findByNameHint,
  type WinterLookRecipe,
} from "@/lib/winterLooks";
import { useCart } from "@/context/CartContext";
import { useCartUI } from "@/context/CartUIContext";
import { ShopBagButton } from "@/components/cart/ShopBagButton";
import {
  FULL_FIT_SECTION_DEFAULT,
  FULLFIT_VISIBLE_SLOTS,
  dummiesForBreakpoint,
  slotBlurPx,
  type FullFitBreakpoint,
} from "@/lib/fullFitLayout";

type ResolvedLook = {
  recipe: WinterLookRecipe;
  outer: Product;
  tee: Product | null;
  pants: Product;
  shoes: Product;
};

function resolveLooks(products: Product[]): ResolvedLook[] {
  const out: ResolvedLook[] = [];
  for (const recipe of WINTER_LOOKS) {
    const outer = findByNameHint(products, recipe.match.outer);
    const pants = findByNameHint(products, recipe.match.pants);
    const shoes = findByNameHint(products, recipe.match.shoes);
    if (!outer || !pants || !shoes) continue;
    const tee =
      recipe.outerKind === "jacket"
        ? findByNameHint(products, recipe.match.tee) || null
        : null;
    if (recipe.outerKind === "jacket" && !tee) continue;
    out.push({ recipe, outer, tee, pants, shoes });
  }
  return out;
}

function shortName(name: string) {
  return name.replace(/^UNKNOWN\s+/i, "").trim();
}

function useFullFitBreakpoint(): FullFitBreakpoint {
  const [bp, setBp] = useState<FullFitBreakpoint>("desktop");

  useEffect(() => {
    const mqPhone = window.matchMedia("(max-width: 767px)");
    const mqTablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px)"
    );
    const sync = () => {
      if (mqPhone.matches) setBp("phone");
      else if (mqTablet.matches) setBp("tablet");
      else setBp("desktop");
    };
    sync();
    mqPhone.addEventListener("change", sync);
    mqTablet.addEventListener("change", sync);
    return () => {
      mqPhone.removeEventListener("change", sync);
      mqTablet.removeEventListener("change", sync);
    };
  }, []);

  return bp;
}

function LookDummy({
  look,
  front,
  onClick,
}: {
  look: ResolvedLook;
  front: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={front}
      className="group relative flex h-full w-full flex-col items-center justify-end outline-none"
    >
      <div className="relative flex h-full w-full flex-col items-center justify-end">
        <div className="relative z-[3] h-[38%] w-[82%]">
          <Image
            src={look.outer.images[0]}
            alt={shortName(look.outer.name)}
            fill
            unoptimized
            className="object-contain object-bottom drop-shadow-[0_18px_28px_rgba(20,24,24,0.28)]"
            sizes="(max-width: 767px) 55vw, (max-width: 1023px) 40vw, 240px"
            draggable={false}
            priority={front}
          />
        </div>
        <div className="relative z-[2] -mt-[8%] h-[48%] w-[76%]">
          <Image
            src={look.pants.images[0]}
            alt={shortName(look.pants.name)}
            fill
            unoptimized
            className="object-contain object-top drop-shadow-[0_16px_24px_rgba(20,24,24,0.22)]"
            sizes="(max-width: 767px) 50vw, (max-width: 1023px) 34vw, 200px"
            draggable={false}
          />
        </div>
        <div className="relative z-[4] -mt-[4%] h-[14%] w-[70%]">
          <Image
            src={look.shoes.images[0]}
            alt={shortName(look.shoes.name)}
            fill
            unoptimized
            className="object-contain object-center drop-shadow-[0_10px_16px_rgba(20,24,24,0.25)]"
            sizes="(max-width: 767px) 40vw, (max-width: 1023px) 28vw, 160px"
            draggable={false}
          />
        </div>
      </div>
    </button>
  );
}

const FULLFIT_BEIGE = "#f3ebe0";

const FULLFIT_WALL = {
  src: "/rooms/beige-room-wall.jpg",
  bgWidthPct: 165,
  wallPosY: 48,
  wallZoom: 1.05,
};

function ParadeArrow({
  dir,
  onClick,
  compact,
}: {
  dir: "left" | "right";
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Previous look" : "Next look"}
      onClick={onClick}
      className={cn(
        "group absolute top-1/2 z-50 flex -translate-y-1/2 items-center justify-center",
        "rounded-full border border-teal-deep/15 bg-white/80 text-teal-deep",
        "shadow-[0_8px_28px_rgba(20,28,28,0.12)] backdrop-blur-md",
        "transition duration-300 hover:border-coral/40 hover:bg-white hover:text-coral",
        "active:scale-95",
        compact ? "h-10 w-10" : "h-12 w-12",
        dir === "left" ? "left-1.5 sm:left-2" : "right-1.5 sm:right-2"
      )}
    >
      <span
        className="absolute inset-[3px] rounded-full border border-teal-deep/10 transition group-hover:border-coral/25"
        aria-hidden
      />
      <Icon
        className={cn(
          "relative transition duration-300",
          compact ? "h-4 w-4" : "h-5 w-5",
          dir === "left"
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5"
        )}
        strokeWidth={1.75}
      />
    </button>
  );
}

function ShopDivider() {
  return (
    <div
      className="pointer-events-none my-1 flex w-full shrink-0 items-center gap-2 px-1"
      aria-hidden
    >
      <span
        className="h-px min-w-0 flex-1"
        style={{ background: "rgba(8, 59, 63, 0.28)" }}
      />
      <span
        className="h-1 w-1 shrink-0 rounded-full"
        style={{ background: "rgba(8, 59, 63, 0.35)" }}
      />
      <span
        className="h-px min-w-0 flex-1"
        style={{ background: "rgba(8, 59, 63, 0.28)" }}
      />
    </div>
  );
}

function ShopCell({
  product,
  nested,
  compact,
}: {
  product: Product;
  nested?: Product | null;
  /** Horizontal card layout for phone */
  compact?: boolean;
}) {
  const [showTee, setShowTee] = useState(false);
  const visible = showTee && nested ? nested : product;

  if (compact) {
    return (
      <div className="relative flex min-w-0 flex-1 flex-col items-stretch">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[120px] overflow-hidden sm:max-w-[140px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={visible._id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              <Image
                src={visible.images[0]}
                alt={shortName(visible.name)}
                fill
                unoptimized
                className="object-contain object-center p-1"
                sizes="140px"
              />
            </motion.div>
          </AnimatePresence>
          {nested ? (
            <button
              type="button"
              aria-label={showTee ? "Show jacket" : "Reveal tee under jacket"}
              onClick={() => setShowTee((v) => !v)}
              className="absolute left-0.5 top-1/2 z-10 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-teal-deep/20 bg-white/95 text-teal-deep shadow-sm"
            >
              {showTee ? (
                <ChevronRight className="h-3 w-3" strokeWidth={2} />
              ) : (
                <ChevronLeft className="h-3 w-3" strokeWidth={2} />
              )}
            </button>
          ) : null}
        </div>
        <div className="mt-1.5 px-0.5 text-center">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.1em] text-teal-deep">
            {shortName(visible.name)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{formatPrice(visible.price)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="relative min-h-0 flex-1 overflow-hidden px-0.5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={visible._id}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={visible.images[0]}
              alt={shortName(visible.name)}
              fill
              unoptimized
              className="object-contain object-center p-2"
              sizes="220px"
            />
          </motion.div>
        </AnimatePresence>

        {nested ? (
          <button
            type="button"
            aria-label={showTee ? "Show jacket" : "Reveal tee under jacket"}
            onClick={() => setShowTee((v) => !v)}
            className="absolute left-1.5 top-1/2 z-10 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-teal-deep/20 bg-white/95 text-teal-deep shadow-sm transition hover:border-teal-deep/45"
          >
            {showTee ? (
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            )}
          </button>
        ) : null}
      </div>

      <div className="shrink-0 px-1 pb-2 pt-1 text-left">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em] text-teal-deep">
          {shortName(visible.name)}
        </p>
        <p className="mt-0.5 text-sm text-muted">{formatPrice(visible.price)}</p>
      </div>
    </div>
  );
}

interface FullFitLookbookProps {
  products: Product[];
  loading?: boolean;
}

export function FullFitLookbook({ products, loading }: FullFitLookbookProps) {
  const frames = FULL_FIT_SECTION_DEFAULT;
  const bp = useFullFitBreakpoint();
  const visibleSlots = FULLFIT_VISIBLE_SLOTS[bp];
  const dummies = dummiesForBreakpoint(bp);
  const isDesktop = bp === "desktop";
  const isPhone = bp === "phone";
  const isTablet = bp === "tablet";

  const looks = useMemo(() => resolveLooks(products), [products]);
  const [active, setActive] = useState(0);
  const { addItem } = useCart();
  const { openCart, flyToBag } = useCartUI();

  const n = looks.length;
  const safeIndex = n ? ((active % n) + n) % n : 0;
  const current = looks[safeIndex];

  const parade = useMemo(() => {
    if (!n) return [];
    return Array.from({ length: Math.min(visibleSlots, n) }, (_, slot) => {
      const index = (safeIndex + slot) % n;
      return { look: looks[index], slot, index };
    });
  }, [looks, n, safeIndex, visibleSlots]);

  const onAdd = async (product: Product) => {
    const size =
      product.sizes.find((s) => s.stock > 0)?.size ||
      product.sizes[0]?.size ||
      "";
    if (!size) return;
    const image = product.images?.[0] || "";
    if (image) flyToBag(image, null);
    try {
      await addItem(product._id, size, 1, product);
      openCart();
    } catch {
      // cart toast
    }
  };

  const go = (dir: -1 | 1) => {
    if (!n) return;
    setActive((i) => (i + dir + n) % n);
  };

  if (loading) {
    return (
      <div className="mx-auto min-h-[70vh] max-w-7xl animate-pulse px-4 py-10">
        <div className="h-[60vh] rounded-[24px] bg-black/5" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-sm text-muted">
          Winter looks need jackets/hoodies, pants, and shoes in the catalog.
          Run the seed, then refresh.
        </p>
      </div>
    );
  }

  const { stage, shop } = frames;

  const stageInner = (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ background: FULLFIT_BEIGE }}
        aria-hidden
      >
        {/* Phone/iPad: cover-fill + zoom so no beige bands; desktop keeps locked framing */}
        {!isDesktop ? (
          <Image
            src={FULLFIT_WALL.src}
            alt=""
            fill
            unoptimized
            priority
            sizes="100vw"
            className="object-cover object-center"
            style={{
              transform: `scale(${isPhone ? 1.28 : 1.18})`,
              transformOrigin: "center 42%",
            }}
          />
        ) : (
          <Image
            src={FULLFIT_WALL.src}
            alt=""
            width={2307}
            height={1540}
            unoptimized
            priority
            sizes="70vw"
            className="absolute left-1/2 h-auto max-w-none"
            style={{
              width: `${FULLFIT_WALL.bgWidthPct}%`,
              top: `${FULLFIT_WALL.wallPosY}%`,
              transform: `translate(-50%, -50%) scale(${FULLFIT_WALL.wallZoom})`,
            }}
          />
        )}
        <div className="shirt-studio-atmosphere absolute inset-0" />
      </div>

      {parade.map(({ look, slot, index }) => {
        const box = dummies[slot];
        if (!box) return null;
        const front = slot === 0;
        const blur = slotBlurPx(slot, visibleSlots);
        return (
          <div
            key={look.recipe.id}
            className="absolute will-change-[filter,left,top,width,height]"
            style={{
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
              zIndex: visibleSlots - slot,
              filter: `blur(${blur}px)`,
              transition:
                "filter 0.45s ease, left 0.45s ease, top 0.45s ease, width 0.45s ease, height 0.45s ease",
            }}
          >
            <div
              className={cn(
                "fullfit-dummy-shadow",
                front && "fullfit-dummy-shadow-main"
              )}
              aria-hidden
            />
            <div className="relative z-[1] h-full w-full">
              <LookDummy
                look={look}
                front={front}
                onClick={() => setActive(index)}
              />
            </div>
          </div>
        );
      })}

      <ParadeArrow dir="left" onClick={() => go(-1)} compact={!isDesktop} />
      <ParadeArrow dir="right" onClick={() => go(1)} compact={!isDesktop} />

      {/* Kraft bag — fly-to target; click opens cart. Bottom-left empty corner. */}
      <ShopBagButton
        className={cn(
          "absolute z-[45]",
          isPhone && "bottom-3 left-3 w-[58px]",
          isTablet && "bottom-4 left-4 w-[72px]",
          isDesktop && "bottom-[3%] left-[3%] w-[96px]"
        )}
      />

      <p className="absolute bottom-2 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-teal-deep/65 shadow-sm backdrop-blur-sm sm:bottom-3">
        {safeIndex + 1} / {n}
      </p>
    </>
  );

  const shopBody = isPhone ? (
    <>
      <div className="flex gap-2 sm:gap-3">
        <ShopCell product={current.outer} nested={current.tee} compact />
        <ShopCell product={current.pants} compact />
        <ShopCell product={current.shoes} compact />
      </div>
      <button
        type="button"
        onClick={() => {
          void onAdd(current.outer);
          void onAdd(current.pants);
          void onAdd(current.shoes);
          if (current.tee) void onAdd(current.tee);
        }}
        className="mt-3 inline-flex h-11 w-full shrink-0 items-center justify-center rounded-full bg-teal-deep text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal"
      >
        Add full look
      </button>
    </>
  ) : (
    <>
      <div className="flex min-h-0 flex-1 flex-col">
        <ShopCell product={current.outer} nested={current.tee} />
        <ShopDivider />
        <ShopCell product={current.pants} />
        <ShopDivider />
        <ShopCell product={current.shoes} />
      </div>
      <button
        type="button"
        onClick={() => {
          void onAdd(current.outer);
          void onAdd(current.pants);
          void onAdd(current.shoes);
          if (current.tee) void onAdd(current.tee);
        }}
        className="mt-2 inline-flex h-10 w-full shrink-0 items-center justify-center rounded-full bg-teal-deep text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-teal"
      >
        Add full look
      </button>
    </>
  );

  /* —— Desktop: locked absolute frames (laptop pad) —— */
  if (isDesktop) {
    return (
      <section
        className="relative min-h-[100dvh] overflow-hidden pb-28"
        style={{ background: FULLFIT_BEIGE }}
      >
        <div
          className="absolute overflow-hidden"
          style={{
            left: `${stage.x}vw`,
            top: stage.y,
            width: `${stage.w}vw`,
            height: stage.h,
            background: FULLFIT_BEIGE,
          }}
        >
          {stageInner}
        </div>

        <aside
          className="absolute flex flex-col overflow-hidden rounded-[20px] p-3 shadow-[0_18px_40px_rgba(30,24,18,0.08)] sm:p-4"
          style={{
            left: `${shop.x}vw`,
            top: shop.y,
            width: `${shop.w}vw`,
            height: shop.h,
            background: FULLFIT_BEIGE,
          }}
        >
          {shopBody}
        </aside>
      </section>
    );
  }

  /* —— Phone / iPad: stacked stage + shop —— */
  return (
    <section
      className="relative flex flex-col pb-28"
      style={{ background: FULLFIT_BEIGE }}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden",
          isPhone ? "h-[min(68vh,560px)]" : "h-[min(72vh,680px)]"
        )}
        style={{ background: FULLFIT_BEIGE }}
      >
        {stageInner}
      </div>

      <aside
        className={cn(
          "relative mx-auto w-full max-w-3xl px-3 pt-3",
          isPhone ? "pb-2" : "flex min-h-[420px] flex-col px-4 pb-4 pt-4"
        )}
        style={{ background: FULLFIT_BEIGE }}
      >
        <div
          className={cn(
            "overflow-hidden rounded-[18px] p-3 shadow-[0_12px_32px_rgba(30,24,18,0.08)]",
            !isPhone && "flex h-full min-h-[400px] flex-col p-4"
          )}
          style={{ background: FULLFIT_BEIGE }}
        >
          {shopBody}
        </div>
      </aside>
    </section>
  );
}
