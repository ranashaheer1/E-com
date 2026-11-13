"use client";

import { useMemo, useState } from "react";
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
import {
  FULL_FIT_SECTION_DEFAULT,
  slotBlurPx,
} from "@/lib/fullFitLayout";

type ResolvedLook = {
  recipe: WinterLookRecipe;
  outer: Product;
  tee: Product | null;
  pants: Product;
  shoes: Product;
};

const VISIBLE_SLOTS = 4;

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
            sizes="240px"
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
            sizes="200px"
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
            sizes="160px"
            draggable={false}
          />
        </div>
      </div>
    </button>
  );
}

/** Site beige above the green footer (ivory-deep) — no sky teal */
const FULLFIT_BEIGE = "#e8dccb";

/** Same shirts room wall — zoomed out so plaster reads behind the dummies */
const FULLFIT_WALL = {
  src: "/rooms/beige-room-wall.jpg",
  /** Wrapper size vs stage; scale < 1 = zoom out */
  framePct: 128,
  wallZoom: 0.78,
  objectPos: "center 42%",
};

function ParadeArrow({
  dir,
  onClick,
}: {
  dir: "left" | "right";
  onClick: () => void;
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Previous look" : "Next look"}
      onClick={onClick}
      className={cn(
        "group absolute top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center",
        "rounded-full border border-teal-deep/15 bg-white/80 text-teal-deep",
        "shadow-[0_8px_28px_rgba(20,28,28,0.12)] backdrop-blur-md",
        "transition duration-300 hover:border-coral/40 hover:bg-white hover:text-coral hover:shadow-[0_12px_32px_rgba(232,93,76,0.22)]",
        "active:scale-95",
        dir === "left" ? "left-2" : "right-2"
      )}
    >
      <span
        className={cn(
          "absolute inset-[3px] rounded-full border border-teal-deep/10 transition group-hover:border-coral/25"
        )}
        aria-hidden
      />
      <Icon
        className={cn(
          "relative h-5 w-5 transition duration-300",
          dir === "left"
            ? "group-hover:-translate-x-0.5"
            : "group-hover:translate-x-0.5"
        )}
        strokeWidth={1.75}
      />
    </button>
  );
}

/** One of three equal shop cells — image on top, name + price left below */
function ShopCell({
  product,
  nested,
}: {
  product: Product;
  nested?: Product | null;
}) {
  const [showTee, setShowTee] = useState(false);
  const visible = showTee && nested ? nested : product;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col border-b border-teal-deep/10 last:border-b-0">
      <div className="relative min-h-0 flex-1 overflow-hidden">
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
  const looks = useMemo(() => resolveLooks(products), [products]);
  const [active, setActive] = useState(0);
  const { addItem } = useCart();
  const { openCart, flyToBag } = useCartUI();

  const n = looks.length;
  const safeIndex = n ? ((active % n) + n) % n : 0;
  const current = looks[safeIndex];

  const parade = useMemo(() => {
    if (!n) return [];
    return Array.from({ length: Math.min(VISIBLE_SLOTS, n) }, (_, slot) => {
      const index = (safeIndex + slot) % n;
      return { look: looks[index], slot, index };
    });
  }, [looks, n, safeIndex]);

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

  const { stage, shop, dummies } = frames;

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
        {/* Shirts beige room wall — zoomed out behind dummies */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${FULLFIT_WALL.framePct}%`,
              height: `${FULLFIT_WALL.framePct}%`,
              transform: `translate(-50%, -50%) scale(${FULLFIT_WALL.wallZoom})`,
            }}
          >
            <Image
              src={FULLFIT_WALL.src}
              alt=""
              fill
              unoptimized
              priority
              sizes="70vw"
              className="object-cover"
              style={{ objectPosition: FULLFIT_WALL.objectPos }}
            />
          </div>
          <div className="shirt-studio-atmosphere absolute inset-0" />
        </div>

        {parade.map(({ look, slot, index }) => {
          const box = dummies[slot];
          const front = slot === 0;
          const blur = slotBlurPx(slot);
          return (
            <div
              key={look.recipe.id}
              className="absolute will-change-[filter,left,top,width,height]"
              style={{
                left: `${box.x}%`,
                top: `${box.y}%`,
                width: `${box.w}%`,
                height: `${box.h}%`,
                zIndex: VISIBLE_SLOTS - slot,
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

        <ParadeArrow dir="left" onClick={() => go(-1)} />
        <ParadeArrow dir="right" onClick={() => go(1)} />

        <p className="absolute bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white/85 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-teal-deep/65 shadow-sm backdrop-blur-sm">
          {safeIndex + 1} / {n}
        </p>
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
        <div className="flex min-h-0 flex-1 flex-col">
          <ShopCell product={current.outer} nested={current.tee} />
          <ShopCell product={current.pants} />
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
      </aside>
    </section>
  );
}
