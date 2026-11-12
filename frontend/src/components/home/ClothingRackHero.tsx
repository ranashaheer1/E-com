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
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartUI } from "@/context/CartUIContext";
import { Button } from "@/components/ui/button";
import { RoomFloorBag } from "@/components/cart/RoomFloorBag";
import {
  DROP_MOBILE_LAYOUT,
  getPiece,
  type MobileStageLayout,
  type PieceTweak,
} from "@/lib/mobileStageLayout";
import { X } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

interface ClothingRackHeroProps {
  products: Product[];
}

const HANGING_BY_CATEGORY: Partial<Record<ProductCategory, string[]>> = {
  shirts: [
    "/products/hanging/shirts/tee1-front-ghost.png",
    "/products/hanging/shirts/tee2-front-ghost.png",
    "/products/hanging/shirts/tee3-front-ghost.png",
  ],
  "t-shirts": [
    "/products/hanging/shirts/tee1-front-ghost.png",
    "/products/hanging/shirts/tee2-front-ghost.png",
    "/products/hanging/shirts/tee3-front-ghost.png",
  ],
  jackets: [
    "/products/hanging/jackets/jacket1-front-ghost.png",
    "/products/hanging/jackets/jacket2-front-ghost.png",
    "/products/hanging/jackets/jacket3-front-ghost.png",
    "/products/hanging/jackets/jacket4-front.png",
  ],
  pants: [
    "/products/hanging/pants/pant1-front-ghost.png",
    "/products/hanging/pants/pant2-front-ghost.png",
    "/products/hanging/pants/pant3-front.png",
  ],
  trousers: [
    "/products/hanging/trousers/trouser1-front-ghost.png",
    "/products/hanging/trousers/trouser2-front.png",
    "/products/hanging/trousers/trouser3-front.png",
  ],
  hoodies: [
    "/products/hanging/hoodies/hoodie1-front.png",
    "/products/hanging/hoodies/hoodie2-front.png",
    "/products/hanging/hoodies/hoodie3-front.png",
    "/products/hanging/hoodies/hoodie4-front.png",
  ],
};

const FALLBACK_IMAGES = [
  "/products/hanging/shirts/tee1-front-ghost.png",
  "/products/hanging/jackets/jacket1-front-ghost.png",
  "/products/hanging/pants/pant1-front-ghost.png",
  "/products/hanging/trousers/trouser1-front-ghost.png",
  "/products/hanging/shirts/tee2-front-ghost.png",
  "/products/hanging/jackets/jacket2-front-ghost.png",
  "/products/hanging/pants/pant2-front-ghost.png",
  "/products/hanging/jackets/jacket3-front-ghost.png",
];

const DRAG_PX_PER_STEP = 220;
/** Crest scale stays ≤1 so garments grow down from the rail, not over it */
const SCALE_BASE = 0.78;
const SCALE_CREST = 0.22;
/** Straight pipe inset from each side — no pipe / products in the outer 10% */
const EDGE_PAD = 0.1;
/** How many pieces fully readable on the pipe at once */
const VISIBLE_SLOTS = 5;

type Slide = {
  id: string;
  src: string;
  alt: string;
  name: string;
  price?: number;
  href?: string;
  productId?: string;
  product?: Product;
  /** 10 or 20 — badge on left shoulder + price math */
  discountPercent: 10 | 20;
};

function discountForSlot(slot: number): 10 | 20 {
  // Alternate 20% / 10% across the rail for variety
  return slot % 2 === 0 ? 20 : 10;
}

function discountedPrice(price: number, percent: number) {
  return Math.round(price * (1 - percent / 100));
}

function isHangingAsset(src?: string) {
  return Boolean(src && src.includes("/hanging/"));
}

function resolveImage(product: Product, slot: number) {
  const primary = product.images?.[0];
  if (isHangingAsset(primary)) return primary;
  const catPool = HANGING_BY_CATEGORY[product.category];
  if (catPool?.length) return catPool[slot % catPool.length];
  return FALLBACK_IMAGES[slot % FALLBACK_IMAGES.length];
}

function toSlide(product: Product, slot: number): Slide {
  return {
    id: product._id,
    src: resolveImage(product, slot),
    alt: product.name,
    name: product.name,
    price: product.price,
    href: `/product/${product._id}`,
    productId: product._id,
    product,
    discountPercent: discountForSlot(slot),
  };
}

/**
 * Drop rail stays on the frozen Season set — never pulls new category
 * inventory (shirts/pants/jackets redesigns stay on their pages only).
 */
function pickSlides(products: Product[]): Slide[] {
  const byCat = (cat: ProductCategory) =>
    products.find((p) => p.category === cat);

  const slots: Array<{ src: string; cat?: ProductCategory; label: string }> = [
    { src: FALLBACK_IMAGES[0], cat: "shirts", label: "Season tee" },
    { src: FALLBACK_IMAGES[1], cat: "jackets", label: "Season jacket" },
    { src: FALLBACK_IMAGES[2], cat: "pants", label: "Season pant" },
    { src: FALLBACK_IMAGES[3], cat: "trousers", label: "Season trouser" },
    { src: FALLBACK_IMAGES[4], cat: "shirts", label: "Season tee" },
    { src: FALLBACK_IMAGES[5], cat: "jackets", label: "Season jacket" },
    { src: FALLBACK_IMAGES[6], cat: "pants", label: "Season pant" },
    { src: FALLBACK_IMAGES[7], cat: "jackets", label: "Season jacket" },
  ];

  return slots.map((slot, i) => {
    const match = slot.cat ? byCat(slot.cat) : undefined;
    if (match) {
      return {
        ...toSlide(match, i),
        // Force Drop artwork — ignore product.images from new catalog
        src: slot.src,
        id: `drop-${i}-${match._id}`,
      };
    }
    return {
      id: `fallback-${i}`,
      src: slot.src,
      alt: slot.label,
      name: slot.label,
      href: "/shop",
      price: 4990,
      discountPercent: discountForSlot(i),
    };
  });
}

function wrapIndex(i: number, n: number) {
  return ((i % n) + n) % n;
}

/** Straight chrome pipe between side pads (y = hang height in viewport). */
function buildStraightRail(w: number, y: number, pad = EDGE_PAD) {
  const x1 = w * pad;
  const x2 = w * (1 - pad);
  return `M${x1.toFixed(1)} ${y.toFixed(1)} L${x2.toFixed(1)} ${y.toFixed(1)}`;
}

export function ClothingRackHero({ products }: ClothingRackHeroProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const railSvgRef = useRef<SVGSVGElement>(null);
  const railPathRef = useRef<SVGPathElement>(null);
  const proxyRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hangRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadowRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const dragRef = useRef<Draggable | null>(null);
  /** Pixel gap between adjacent hang points on the straight pipe */
  const spacingRef = useRef(180);
  /** How many slots fit — fewer on mobile for a clean crest */
  const slotsRef = useRef(VISIBLE_SLOTS);
  const stepRef = useRef(1);
  const animatingRef = useRef(false);
  const activeIndexRef = useRef(0);
  const pressPos = useRef({ x: 0, y: 0 });
  const lastProxyXRef = useRef(0);
  const lastHangTimeRef = useRef(0);
  const hangVelRef = useRef(0);
  const hangSettleTimer = useRef<number | null>(null);
  const hangRotQuickTo = useRef<Array<ReturnType<typeof gsap.quickTo> | null>>([]);
  const hangXQuickTo = useRef<Array<ReturnType<typeof gsap.quickTo> | null>>([]);
  const slidesRef = useRef<Slide[]>([]);
  const openBuyRef = useRef<(slide: Slide | undefined) => void>(() => {});
  const snapProxyToRef = useRef<(index: number, animate: boolean) => void>(
    () => {}
  );

  const router = useRouter();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { flyToBag } = useCartUI();
  /** Phone / iPad only — laptop keeps the locked desktop rack */
  const [isCompact, setIsCompact] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [mobileLayout] = useState<MobileStageLayout>(DROP_MOBILE_LAYOUT);
  const [pieceMap] = useState<Record<number, PieceTweak>>({});
  const mobileLayoutRef = useRef(mobileLayout);
  const pieceMapRef = useRef(pieceMap);
  mobileLayoutRef.current = mobileLayout;
  pieceMapRef.current = pieceMap;

  const slides = useMemo(
    () => (products.length ? pickSlides(products) : []),
    [products]
  );

  // Compact: 3 hang points — base card size; placeCards scales crest vs sides
  const cardW = isCompact
    ? "clamp(112px, 29vw, 172px)"
    : "clamp(150px, 13.5vw, 260px)";
  const cardH = isCompact
    ? "clamp(168px, 29vh, 252px)"
    : "clamp(210px, 36vh, 360px)";
  const slideKey = slides.map((s) => s.id).join("|");
  const [activeIndex, setActiveIndex] = useState(0);
  /** Full slide snapshot so buy sheet matches the clicked crest image/name */
  const [buySlide, setBuySlide] = useState<Slide | null>(null);
  const [buySize, setBuySize] = useState("");
  const [buySubmitting, setBuySubmitting] = useState(false);
  const active = slides[activeIndex] ?? slides[0];
  const buyProduct = buySlide?.product ?? null;

  const openBuy = useCallback(
    (slide: Slide | undefined) => {
      if (!slide) return;
      if (!slide.product) {
        if (slide.href) router.push(slide.href);
        return;
      }
      // Lock the exact crest slide (image + product) at click time
      setBuySlide(slide);
      setBuySize(
        slide.product.sizes.find((s) => s.stock > 0)?.size ||
          slide.product.sizes[0]?.size ||
          ""
      );
    },
    [router]
  );

  slidesRef.current = slides;
  openBuyRef.current = openBuy;

  /** Prefer the topmost visible card under the pointer (ignore faded side pieces). */
  const hitTestCard = useCallback((cx: number, cy: number) => {
    let best = -1;
    let bestZ = -Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const opacity = Number(gsap.getProperty(card, "opacity"));
      if (opacity < 0.4) return;
      const r = card.getBoundingClientRect();
      if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return;
      const z = Number(gsap.getProperty(card, "zIndex")) || 0;
      if (z >= bestZ) {
        bestZ = z;
        best = i;
      }
    });
    return best;
  }, []);

  const openBuyAtIndex = useCallback((index: number, animateSnap: boolean) => {
    const slide = slidesRef.current[index];
    if (!slide) return;
    if (index !== activeIndexRef.current) {
      snapProxyToRef.current(index, animateSnap);
    }
    openBuyRef.current(slide);
  }, []);

  const onAddToCart = useCallback(async () => {
    if (!buyProduct || !buySize || !buySlide) return;
    const source = document.querySelector<HTMLElement>("[data-fly-source]");
    const from = source?.getBoundingClientRect() ?? null;
    const image = buySlide.src || buyProduct.images?.[0] || "";
    // Close sheet + fly piece into left shopping bag
    setBuySlide(null);
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
  }, [buyProduct, buySize, buySlide, user, addItem, flyToBag]);

  const placeCards = useCallback((scrollIndex: number) => {
    const cards = cardRefs.current;
    const spacing = spacingRef.current;
    const n = cards.length;
    if (!n || spacing <= 0) return;

    const slots = slotsRef.current;
    const halfRail = ((slots - 1) / 2) * spacing;
    const fadeStart = halfRail * 0.78;
    const fadeEnd = halfRail * 1.05;
    const compactThree = slots === 3;

    for (let i = 0; i < n; i++) {
      const card = cards[i];
      if (!card) continue;

      // Shortest wrapped distance along the circular product list
      let pos = i - scrollIndex;
      while (pos > n / 2) pos -= n;
      while (pos < -n / 2) pos += n;

      const L = mobileLayoutRef.current;
      const piece = getPiece(pieceMapRef.current, i);
      const vw = viewportRef.current?.clientWidth || 0;
      const vh = viewportRef.current?.clientHeight || 0;
      // Compact 3-up: main centered, left + right beside
      const xShift = compactThree ? (vw * L.productX) / 100 : 0;
      const x =
        pos * spacing + xShift + (compactThree ? (vw * piece.x) / 100 : 0);
      const absX = Math.abs(pos * spacing);
      const crest = gsap.utils.clamp(0, 1, 1 - absX / (spacing * 2.15));
      // Main (crest) big · side pieces smaller — laptop hierarchy on phone
      let scale = SCALE_BASE + crest * SCALE_CREST;
      if (compactThree) {
        const slotDist = absX / Math.max(spacing, 1);
        if (slotDist < 0.4) {
          scale *= L.productZoom * 1.12 * piece.zoom;
        } else {
          scale *= L.productZoom * 0.68 * piece.zoom;
        }
      }
      const yNudge = compactThree ? (vh * piece.y) / 100 : 0;

      let opacity = 1;
      let blur = 0;
      if (compactThree) {
        // Phone/iPad: left + center + right (3 products)
        if (absX > spacing * 1.25) {
          opacity = 0;
          blur = 10;
        } else if (absX > spacing * 1.02) {
          const t = (absX - spacing * 1.02) / (spacing * 0.23);
          opacity = 1 - gsap.utils.clamp(0, 1, t);
          blur = t * 6;
        }
      } else if (absX >= fadeEnd) {
        opacity = 0;
        blur = 10;
      } else if (absX > fadeStart) {
        const t = (absX - fadeStart) / (fadeEnd - fadeStart);
        opacity = 1 - t;
        blur = t * 10;
      }

      gsap.set(card, {
        x,
        y: yNudge,
        rotation: 0,
        scale,
        opacity,
        filter: blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "blur(0px)",
        zIndex: Math.round(10 + crest * 90),
        transformOrigin: "50% 0%",
        force3D: true,
        pointerEvents: opacity < 0.2 ? "none" : "auto",
      });

      const shadow = shadowRefs.current[i];
      if (shadow) {
        const activeCrest = crest > 0.78;
        shadow.style.opacity = String(opacity > 0.15 ? 0.5 + crest * 0.45 : 0);
        shadow.classList.toggle("rack-wall-shadow-active", activeCrest);
      }
    }
  }, []);

  const settleHangPieces = useCallback(() => {
    hangVelRef.current = 0;
    hangRefs.current.forEach((hang, i) => {
      if (!hang) return;
      // Soft overshoot settle once motion stops / snaps
      gsap.to(hang, {
        rotation: 0,
        x: 0,
        duration: 0.75,
        ease: "elastic.out(1, 0.52)",
        overwrite: "auto",
        transformOrigin: "50% 0%",
        onComplete: () => {
          // Rebind quickTo after settle tween so live drag stays responsive
          hangRotQuickTo.current[i] = gsap.quickTo(hang, "rotation", {
            duration: 0.22,
            ease: "power3.out",
          });
          hangXQuickTo.current[i] = gsap.quickTo(hang, "x", {
            duration: 0.28,
            ease: "power3.out",
          });
        },
      });
    });
  }, []);

  const applyHangSway = useCallback((proxyX: number) => {
    const now = performance.now();
    const prevT = lastHangTimeRef.current || now;
    const dt = Math.max(8, Math.min(48, now - prevT));
    lastHangTimeRef.current = now;

    const dx = proxyX - lastProxyXRef.current;
    lastProxyXRef.current = proxyX;

    // px/ms → smoothed hang velocity (lag opposite to carousel travel)
    const instant = dx / dt;
    hangVelRef.current = hangVelRef.current * 0.55 + instant * 0.45;

    const v = hangVelRef.current;
    // Obvious hang: rotateZ lag + slight lateral wobble
    const swayRot = gsap.utils.clamp(-18, 18, -v * 22);
    const swayX = gsap.utils.clamp(-14, 14, -v * 14);

    hangRefs.current.forEach((hang, i) => {
      if (!hang) return;
      // Per-card mass variance so pieces don't lock-step
      const mass = 0.82 + (i % 4) * 0.1;
      const rotQt = hangRotQuickTo.current[i];
      const xQt = hangXQuickTo.current[i];
      if (rotQt) rotQt(swayRot * mass);
      else {
        gsap.set(hang, { rotation: swayRot * mass, transformOrigin: "50% 0%" });
      }
      if (xQt) xQt(swayX * mass);
      else {
        gsap.set(hang, { x: swayX * mass });
      }
    });

    if (hangSettleTimer.current != null) {
      window.clearTimeout(hangSettleTimer.current);
    }
    // Only settle after motion has clearly stopped (not mid-drag)
    hangSettleTimer.current = window.setTimeout(() => {
      if (Math.abs(hangVelRef.current) < 0.04) {
        settleHangPieces();
      } else {
        hangVelRef.current *= 0.35;
        hangSettleTimer.current = window.setTimeout(settleHangPieces, 160);
      }
    }, 140);
  }, [settleHangPieces]);

  const syncFromProxy = useCallback(() => {
    const proxy = proxyRef.current;
    if (!proxy) return;
    const x = Number(gsap.getProperty(proxy, "x")) || 0;
    const scrollIndex = -x / DRAG_PX_PER_STEP;
    placeCards(scrollIndex);
    applyHangSway(x);

    const next = wrapIndex(Math.round(scrollIndex), slides.length);
    if (next !== activeIndexRef.current) {
      activeIndexRef.current = next;
      setActiveIndex(next);
    }
  }, [placeCards, applyHangSway, slides.length]);

  const snapProxyTo = useCallback(
    (index: number, animate: boolean) => {
      const proxy = proxyRef.current;
      if (!proxy) return;

      const currentX = Number(gsap.getProperty(proxy, "x")) || 0;
      const currentRaw = -currentX / DRAG_PX_PER_STEP;
      const currentIdx = Math.round(currentRaw);
      let delta = wrapIndex(index, slides.length) - wrapIndex(currentIdx, slides.length);

      if (delta > slides.length / 2) delta -= slides.length;
      if (delta < -slides.length / 2) delta += slides.length;

      const targetX = -(currentIdx + delta) * DRAG_PX_PER_STEP;

      gsap.killTweensOf(proxy);
      if (!animate) {
        gsap.set(proxy, { x: targetX });
        syncFromProxy();
        return;
      }

      animatingRef.current = true;
      lastHangTimeRef.current = performance.now();
      gsap.to(proxy, {
        x: targetX,
        duration: 1.05,
        ease: "power2.inOut",
        onUpdate: syncFromProxy,
        onComplete: () => {
          animatingRef.current = false;
          syncFromProxy();
          settleHangPieces();
        },
      });
    },
    [slides.length, syncFromProxy, settleHangPieces]
  );

  snapProxyToRef.current = snapProxyTo;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (animatingRef.current) return;
      const next = wrapIndex(activeIndexRef.current + dir, slides.length);
      snapProxyTo(next, true);
    },
    [slides.length, snapProxyTo]
  );

  const updateRail = useCallback(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    const path = railPathRef.current;
    const svg = railSvgRef.current;
    if (!viewport || !stage || !path || !svg) return;

    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    const pad = w < 1024 ? 0.18 : EDGE_PAD;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));

    const stageTop = Number.parseFloat(stage.style.top) || h * 0.3;
    // Pipe sits through hanger hooks (card origin = hang point)
    const pipeY = stageTop + 2;
    const d = buildStraightRail(w, pipeY, pad);
    path.setAttribute("d", d);
    // Mirror highlight / shadow pipes if present
    const hi = svg.querySelector<SVGPathElement>("[data-rail-hi]");
    const lo = svg.querySelector<SVGPathElement>("[data-rail-lo]");
    if (hi) hi.setAttribute("d", buildStraightRail(w, pipeY - 1.6, pad));
    if (lo) lo.setAttribute("d", buildStraightRail(w, pipeY + 1.8, pad));
    const x1 = w * pad;
    const x2 = w * (1 - pad);
    const mounts = svg.querySelectorAll<SVGCircleElement>("[data-rail-mount]");
    // 0,2 left · 1,3 right (outer + inner cap)
    mounts.forEach((el, i) => {
      el.setAttribute("cx", String(i % 2 === 0 ? x1 : x2));
      el.setAttribute("cy", String(pipeY));
    });
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage || slides.length < 3) return;

    stepRef.current = 1;

    const measure = () => {
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      const compact = w < 1024;
      const phone = w < 768;
      setIsCompact((v) => (v === compact ? v : compact));
      setIsPhone((v) => (v === phone ? v : phone));
      // Laptop+: locked 5-slot rack. Phone/iPad: 3 hang points (L small · center large · R small)
      const slots = !compact ? VISIBLE_SLOTS : 3;
      const pad = compact ? 0.18 : EDGE_PAD;
      slotsRef.current = slots;
      const railWidth = w * (1 - pad * 2);
      const spacing = railWidth / Math.max(1, slots - 1);
      spacingRef.current = spacing;
      // Phone pad drives productY%; iPad locked mid-upper; laptop original
      const L = mobileLayoutRef.current;
      const pipeTop = !compact
        ? gsap.utils.clamp(h * 0.18, h * 0.3, h * 0.24)
        : phone
          ? gsap.utils.clamp(h * 0.02, h * 0.4, (h * L.productY) / 100)
          : gsap.utils.clamp(h * 0.06, h * 0.12, h * 0.08);
      stage.style.top = `${pipeTop}px`;
      stage.style.left = "50%";
      updateRail();
      syncFromProxy();
    };

    const proxy = document.createElement("div");
    proxyRef.current = proxy;
    gsap.set(proxy, { x: 0 });
    lastProxyXRef.current = 0;
    activeIndexRef.current = 0;
    setActiveIndex(0);

    hangRotQuickTo.current = [];
    hangXQuickTo.current = [];
    hangVelRef.current = 0;
    lastHangTimeRef.current = performance.now();
    hangRefs.current.forEach((hang, i) => {
      if (!hang) {
        hangRotQuickTo.current[i] = null;
        hangXQuickTo.current[i] = null;
        return;
      }
      gsap.set(hang, { rotation: 0, x: 0, transformOrigin: "50% 0%" });
      hangRotQuickTo.current[i] = gsap.quickTo(hang, "rotation", {
        duration: 0.22,
        ease: "power3.out",
      });
      hangXQuickTo.current[i] = gsap.quickTo(hang, "x", {
        duration: 0.28,
        ease: "power3.out",
      });
    });

    measure();
    placeCards(0);

    const [draggable] = Draggable.create(proxy, {
      trigger: viewport,
      type: "x",
      inertia: true,
      resistance: 0.42,
      throwResistance: 1400,
      maxDuration: 1.6,
      minDuration: 0.45,
      edgeResistance: 0.85,
      // Let product buttons receive real clicks; small jitter ≠ drag
      dragClickables: true,
      minimumMovement: 12,
      allowContextMenu: true,
      onPress() {
        gsap.killTweensOf(proxy);
        animatingRef.current = false;
        pressPos.current = { x: this.pointerX, y: this.pointerY };
        lastHangTimeRef.current = performance.now();
        lastProxyXRef.current = Number(gsap.getProperty(proxy, "x")) || 0;
        hangVelRef.current = 0;
        if (hangSettleTimer.current != null) {
          window.clearTimeout(hangSettleTimer.current);
          hangSettleTimer.current = null;
        }
        // Interrupt elastic settle and rebind quickTo for live sway
        hangRefs.current.forEach((hang, i) => {
          if (!hang) return;
          gsap.killTweensOf(hang);
          hangRotQuickTo.current[i] = gsap.quickTo(hang, "rotation", {
            duration: 0.22,
            ease: "power3.out",
          });
          hangXQuickTo.current[i] = gsap.quickTo(hang, "x", {
            duration: 0.28,
            ease: "power3.out",
          });
        });
      },
      onDrag: syncFromProxy,
      onThrowUpdate: syncFromProxy,
      onThrowComplete() {
        syncFromProxy();
        settleHangPieces();
      },
      snap: {
        x: (value: number) => Math.round(value / DRAG_PX_PER_STEP) * DRAG_PX_PER_STEP,
      },
      // True click (no drag) → open buy for the topmost garment under the pointer
      onClick() {
        const cx = this.pointerX ?? pressPos.current.x;
        const cy = this.pointerY ?? pressPos.current.y;
        let hit = hitTestCard(cx, cy);
        if (hit < 0) hit = activeIndexRef.current;
        openBuyAtIndex(hit, true);
      },
    });

    dragRef.current = draggable;

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;
    ro?.observe(viewport);

    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      if (hangSettleTimer.current != null) {
        window.clearTimeout(hangSettleTimer.current);
      }
      hangRefs.current.forEach((hang) => {
        if (hang) gsap.killTweensOf(hang);
      });
      hangRotQuickTo.current = [];
      hangXQuickTo.current = [];
      draggable.kill();
      dragRef.current = null;
      proxyRef.current = null;
      gsap.killTweensOf(proxy);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount when product set changes
  }, [
    slideKey,
    placeCards,
    syncFromProxy,
    settleHangPieces,
    slides.length,
    updateRail,
    hitTestCard,
    openBuyAtIndex,
  ]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Phone pad owns arrow keys while tuning
      if (window.matchMedia("(max-width: 767px)").matches) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Live-apply phone pad product Y / zoom / per-piece without remounting
  useEffect(() => {
    if (!isPhone) return;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    if (!stage || !viewport) return;
    const h = viewport.clientHeight;
    const y = gsap.utils.clamp(
      h * 0.02,
      h * 0.4,
      (h * mobileLayout.productY) / 100
    );
    stage.style.top = `${y}px`;
    updateRail();
    syncFromProxy();
  }, [isPhone, mobileLayout, pieceMap, updateRail, syncFromProxy]);

  const onCardClick = (index: number) => (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const moved =
      Math.abs(e.clientX - pressPos.current.x) > 14 ||
      Math.abs(e.clientY - pressPos.current.y) > 14;
    if (moved) return;
    // One click → buy sheet for that exact piece (snap if it wasn't crest)
    openBuyAtIndex(index, true);
  };

  if (!slides.length) {
    return (
      <section className="relative flex h-[calc(100dvh-4rem-3.25rem)] max-h-[calc(100dvh-4rem-3.25rem)] flex-col overflow-hidden px-0 pb-2 pt-0.5 sm:px-4 xl:px-6">
        <p className="mb-1 shrink-0 text-center font-display text-xl tracking-[0.22em] text-teal-deep sm:text-2xl">
          New Season Drop
        </p>
        <div className="virtual-room relative mx-auto min-h-0 w-full max-w-[1680px] flex-1 overflow-hidden sm:rounded-[28px]">
          <div className="drop-room-wall absolute inset-0" />
          <Image
            src="/rooms/drop-room-wall-wide.jpg"
            alt=""
            fill
            unoptimized
            priority
            sizes="100vw"
            className="drop-room-photo pointer-events-none absolute inset-0 z-0"
          />
          <div className="drop-room-atmosphere absolute inset-0 z-[1]" />
          <RoomFloorBag />
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative flex h-[calc(100dvh-4rem-3.25rem)] max-h-[calc(100dvh-4rem-3.25rem)] flex-col overflow-hidden",
        isCompact ? "px-0 pb-0 pt-0" : "px-0 pb-1 pt-0.5 sm:px-4 xl:px-6"
      )}
    >
      <p
        className={cn(
          "shrink-0 text-center font-display tracking-[0.22em] text-teal-deep",
          isCompact
            ? "pointer-events-none absolute left-0 right-0 top-[0.65rem] z-[30] mb-0 text-[15px]"
            : "mb-1 text-xl sm:text-2xl xl:text-[1.75rem]"
        )}
      >
        New Season Drop
      </p>

      {/* Immersive room: HQ wall photo + rack hanging inside the empty plaster */}
      <div
        className={cn(
          "virtual-room relative mx-auto flex min-h-0 w-full max-w-[1680px] flex-1 flex-col overflow-hidden",
          isCompact
            ? "rounded-none shadow-none"
            : "shadow-[0_28px_70px_rgba(30,24,18,0.28)] sm:rounded-[22px]"
        )}
      >
        <div className="drop-room-wall absolute inset-0" aria-hidden />
        <Image
          src="/rooms/drop-room-wall-wide.jpg"
          alt=""
          fill
          unoptimized
          priority
          sizes="(max-width: 1680px) 100vw, 1680px"
          className={cn(
            "drop-room-photo pointer-events-none absolute inset-0 z-0",
            isCompact && !isPhone && "object-[center_42%]"
          )}
          style={
            isPhone
              ? {
                  objectPosition: `${mobileLayout.bgPosX}% ${mobileLayout.bgPosY}%`,
                  transform: `scale(${mobileLayout.bgZoom})`,
                  transformOrigin: "center center",
                }
              : undefined
          }
        />
        <div className="drop-room-atmosphere absolute inset-0 z-[1]" aria-hidden />

        <RoomFloorBag
          mobileBag={
            isPhone
              ? {
                  bottom: mobileLayout.bagBottom,
                  width: mobileLayout.bagWidth,
                  left: mobileLayout.bagLeft,
                  right: mobileLayout.bagRight,
                }
              : null
          }
        />

        {/* Straight rack — 10% side pads; products blur/vanish past pipe ends */}
        <div
          ref={viewportRef}
          className={cn(
            "relative z-[2] min-h-0 w-full flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing",
            isCompact && "pb-[10.5rem]"
          )}
          role="region"
          aria-roledescription="carousel"
          aria-label="New Season Drop crest carousel"
        >
          {/* Soft side depth — only for product fade, not fake side walls */}
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[28] w-[10%]"
            style={{
              background:
                "linear-gradient(90deg, rgba(40,32,24,0.12) 0%, transparent 100%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-[28] w-[10%]"
            style={{
              background:
                "linear-gradient(270deg, rgba(40,32,24,0.1) 0%, transparent 100%)",
            }}
            aria-hidden
          />

          {/* Solid black hanging pipe (10% → 90%) */}
          <svg
            ref={railSvgRef}
            className="pointer-events-none absolute inset-0 z-[18]"
            aria-hidden
          >
            <defs>
              {/* Fully opaque metal — no transparent ends */}
              <linearGradient id="drop-rail-chrome" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#5a5a5a" />
                <stop offset="28%" stopColor="#2a2a2a" />
                <stop offset="55%" stopColor="#0a0a0a" />
                <stop offset="78%" stopColor="#1c1c1c" />
                <stop offset="100%" stopColor="#3a3a3a" />
              </linearGradient>
              <linearGradient id="drop-rail-hi" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
              <filter id="drop-rail-shadow" x="-4%" y="-180%" width="108%" height="460%">
                <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#000" floodOpacity="0.45" />
              </filter>
            </defs>
            {/* Soft cast under rod */}
            <path
              data-rail-lo
              fill="none"
              stroke="#000000"
              strokeOpacity="0.28"
              strokeWidth="5"
              strokeLinecap="butt"
            />
            {/* Slim solid black pipe */}
            <path
              ref={railPathRef}
              fill="none"
              stroke="#0a0a0a"
              strokeWidth="3.5"
              strokeLinecap="butt"
              filter="url(#drop-rail-shadow)"
            />
            {/* Subtle top edge — still solid black family */}
            <path
              data-rail-hi
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="1.25"
              strokeLinecap="butt"
            />
            {/* Compact solid mounts */}
            <circle data-rail-mount fill="#0a0a0a" r="4.5" />
            <circle data-rail-mount fill="#0a0a0a" r="4.5" />
            <circle data-rail-mount fill="#222222" r="1.8" />
            <circle data-rail-mount fill="#222222" r="1.8" />
          </svg>

          <div
            ref={stageRef}
            className="absolute left-1/2 z-[22] h-0 w-0"
            style={{ transform: "translate3d(0,0,0)" }}
          >
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                className="absolute left-0 top-0 origin-top will-change-transform"
                style={{
                  width: cardW,
                  height: cardH,
                  // Hang from top-center on the arc (not mid-card)
                  marginLeft: `calc(${cardW} / -2)`,
                  marginTop: "0",
                }}
              >
                <button
                  type="button"
                  onClick={onCardClick(i)}
                  data-card-inner
                  className="relative block h-full w-full select-none text-left"
                  aria-label={
                    i === activeIndex
                      ? `Buy ${slide.name}`
                      : `Focus ${slide.name}`
                  }
                  aria-current={i === activeIndex ? "true" : undefined}
                >
                  <span
                    ref={(el) => {
                      shadowRefs.current[i] = el;
                    }}
                    aria-hidden
                    className="rack-wall-shadow pointer-events-none absolute left-1/2 top-[6%] -z-10"
                  />
                  <div
                    ref={(el) => {
                      hangRefs.current[i] = el;
                    }}
                    data-hang-piece
                    className="relative h-full w-full origin-top will-change-transform"
                  >
                    {/* Left-shoulder sale badge */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute left-[6%] top-[11%] z-20 rounded-[3px] bg-coral px-1.5 py-0.5 text-[9px] font-semibold uppercase leading-none tracking-[0.08em] text-white shadow-sm sm:left-[8%] sm:top-[12%] sm:text-[10px]"
                    >
                      -{slide.discountPercent}%
                    </span>
                    <Image
                      src={slide.src}
                      alt={slide.alt}
                      fill
                      unoptimized
                      priority={i < 5}
                      sizes="(max-width: 768px) 48vw, (min-width: 1280px) 280px, 240px"
                      className="pointer-events-none object-contain object-top drop-shadow-[6px_22px_28px_rgba(30,24,18,0.38)]"
                      draggable={false}
                    />
                  </div>
                </button>
              </div>
            ))}
          </div>

          <p className="pointer-events-none absolute bottom-2 left-1/2 z-30 -translate-x-1/2 text-[9px] uppercase tracking-[0.22em] text-muted/75 max-lg:hidden sm:bottom-3 sm:text-[10px]">
            Drag · click piece for sizes and add to cart
          </p>
        </div>

        <div
          className={cn(
            "z-[3] flex flex-col items-center",
            isCompact
              ? "absolute inset-x-0 bottom-0 px-3 pb-[calc(4.6rem+env(safe-area-inset-bottom))] pt-0"
              : "relative shrink-0 px-3 pb-2 pt-2 sm:px-6 sm:pb-3"
          )}
        >
          <div
            className={cn(
              "w-full max-w-xl rounded-2xl border border-white/70 bg-[#f7f4ef]/92 shadow-[0_12px_40px_rgba(30,24,18,0.22)] backdrop-blur-md",
              isCompact ? "px-3 py-2.5" : "px-3 py-3 sm:px-5 sm:py-3.5"
            )}
          >
            <div
              className={cn(
                "grid items-center",
                isCompact
                  ? "grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] gap-2"
                  : "grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] gap-3 sm:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] sm:gap-4"
              )}
            >
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous look"
                className="inline-flex h-9 w-9 items-center justify-center justify-self-start rounded-full border border-teal-deep/20 bg-white text-teal-deep shadow-sm transition hover:border-teal-deep/40"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </button>

              <div
                className={cn(
                  "flex flex-col items-center justify-center text-center",
                  isCompact ? "min-h-0 px-0.5" : "min-h-[4.5rem] px-1"
                )}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-teal-deep/55">
                  Look {activeIndex + 1} / {slides.length}
                </p>
                <p
                  className={cn(
                    "max-w-full truncate font-display tracking-[0.08em] text-teal-deep",
                    isCompact ? "mt-0.5 text-[15px]" : "mt-1 text-base sm:text-lg"
                  )}
                >
                  {active?.name?.replace(/^UNKNOWN\s+/i, "") || "—"}
                </p>
                <p
                  className={cn(
                    "flex flex-wrap items-baseline justify-center gap-2",
                    isCompact ? "mt-0.5 text-[13px]" : "mt-1 min-h-[1.35rem] text-sm"
                  )}
                >
                  {typeof active?.price === "number" ? (
                    <>
                      <span className="font-semibold text-coral">
                        {formatPrice(
                          discountedPrice(active.price, active.discountPercent)
                        )}
                      </span>
                      <span className="text-teal-deep/45 line-through">
                        {formatPrice(active.price)}
                      </span>
                      <span className="rounded bg-coral px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                        -{active.discountPercent}%
                      </span>
                    </>
                  ) : (
                    <span className="invisible">—</span>
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next look"
                className="inline-flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-teal-deep/20 bg-white text-teal-deep shadow-sm transition hover:border-teal-deep/40"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div
              className={cn(
                "flex flex-wrap items-center justify-center gap-2",
                isCompact ? "mt-2.5" : "mt-3"
              )}
            >
              {active?.productId ? (
                <button
                  type="button"
                  onClick={() => openBuy(active)}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-teal-deep px-6 text-[11px] uppercase tracking-[0.22em] text-white shadow-sm transition hover:bg-teal"
                >
                  Buy look
                </button>
              ) : active?.href ? (
                <Link
                  href={active.href}
                  className="inline-flex h-9 items-center justify-center rounded-full bg-teal-deep px-6 text-[11px] uppercase tracking-[0.22em] text-white shadow-sm transition hover:bg-teal"
                >
                  View piece
                </Link>
              ) : null}
              {!isCompact ? (
                <Link
                  href="/shop"
                  className="inline-flex h-9 items-center justify-center rounded-full border border-teal-deep/25 bg-white px-6 text-[11px] uppercase tracking-[0.22em] text-teal-deep transition hover:border-teal-deep/45"
                >
                  Shop all
                </Link>
              ) : null}
            </div>

            <div
              className={cn(
                "flex items-center justify-center gap-2",
                isCompact ? "mt-2" : "mt-2.5"
              )}
            >
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`Go to ${s.name}`}
                  onClick={() => snapProxyTo(i, true)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === activeIndex ? 22 : 6,
                    background:
                      i === activeIndex
                        ? "var(--teal-deep)"
                        : "rgba(8, 59, 63, 0.28)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Buy sheet locked to the clicked crest slide (same image + product) */}
      {buySlide && buyProduct ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-teal-deep/35 p-3 backdrop-blur-[1px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Buy ${buySlide.name}`}
          onClick={() => setBuySlide(null)}
        >
          <div
            className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-teal-deep/10 bg-[#f7f4ef] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setBuySlide(null)}
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
                  src={buySlide.src}
                  alt={buySlide.alt}
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
                    {buySlide.name.replace(/^UNKNOWN\s+/i, "")}
                  </h3>
                  {typeof buySlide.price === "number" ? (
                    <p className="mt-1 flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="font-medium text-coral">
                        {formatPrice(
                          discountedPrice(
                            buySlide.price,
                            buySlide.discountPercent
                          )
                        )}
                      </span>
                      <span className="text-muted line-through decoration-teal-deep/40">
                        {formatPrice(buySlide.price)}
                      </span>
                      <span className="rounded bg-coral/15 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-coral">
                        -{buySlide.discountPercent}%
                      </span>
                    </p>
                  ) : null}
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
                        className={`min-w-10 rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition ${
                          buySize === entry.size
                            ? "border-teal-deep bg-teal-deep text-white"
                            : "border-teal-deep/20 bg-white text-teal-deep hover:border-teal-deep/40"
                        } disabled:cursor-not-allowed disabled:opacity-35`}
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
                  onClick={() => setBuySlide(null)}
                >
                  View full details
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
