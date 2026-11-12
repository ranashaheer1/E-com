"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Box, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useCartUI } from "@/context/CartUIContext";
import { ShopBagButton } from "@/components/cart/ShopBagButton";
import {
  getShirt3DMockupSrc,
  Shirt3DMockupModal,
} from "@/components/home/Shirt3DMockupModal";
import {
  SHIRTS_DESKTOP_LAYOUT,
  SHIRTS_IPAD_LAYOUT,
  SHIRTS_MOBILE_LAYOUT,
  getPiece,
  type MobileStageLayout,
  type PieceTweak,
} from "@/lib/mobileStageLayout";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

interface StudioRailSectionProps {
  id?: string;
  products: Product[];
  loading?: boolean;
}

/** Drop-feel step · curved round-rack (≈25% of circle visible) */
const VISIBLE_SLOTS = 5;
const DRAG_PX_PER_STEP = 200;
const SCALE_CREST = 1.02;
const SCALE_NEAR = 0.8;
const SCALE_FAR = 0.6;
const CARD_W = "clamp(118px, 11.5vw, 188px)";
const CARD_H = "clamp(168px, 30vh, 280px)";
/** Mobile: crest + right hang — enlarged main / shrunk side */
const CARD_W_MOBILE = "clamp(162px, 44vw, 220px)";
const CARD_H_MOBILE = "clamp(232px, 42vh, 310px)";

/**
 * Wall framing — same approach as ShoeShelf 3-col (width % + translate/scale).
 * Shirts stage is taller/narrower than shoes, so width must be >100% for the
 * same cover/overflow the shoes panel gets at 100% × 1.12.
 * Phone/tablet keep a separate cover zoom so locked desk defaults don't shrink the wall.
 */
const SHIRT_WALL_ZOOM_TOUCH = 1.14;
const SHIRT_WALL_BG_WIDTH_PCT = 148;

/** Locked desktop wall + slot-3 seat (from placement pad). */
const SHIRTS_DESKTOP_PAD = {
  wallZoom: 0.85,
  wallPosY: 53,
  /** Seat + pull third shirt onto the visible rail */
  slot3Y: -2.5,
  slot3X: -4,
} as const;

/** Locked from placement pad (desktop) */
const STACK = {
  offsetX: -22,
  offsetY: -3,
  size: 1.5,
  spacing: 2.05,
  s1: { dx: 2, dy: -2, size: 1.1 },
  s2: { dx: 1, dy: 0, size: 0.75 },
  /** Larger far shirt — was vanishing at arc end */
  s3: { dx: -10, dy: -13, size: 0.78 },
} as const;

/** Mobile: crest big + right neighbor smaller (laptop hierarchy) */
const STACK_MOBILE = {
  offsetX: 2,
  offsetY: 0,
  size: 1.1,
  spacing: 2.05,
  /** dy kept 0 — hanger seat uses HANG_HOOK_SEAT so both shirts sit on the pipe */
  s1: { dx: -6, dy: 0, size: 1.22 },
  s2: { dx: 4, dy: 0, size: 0.62 },
  s3: { dx: 0, dy: 0, size: 0.5 },
} as const;

/**
 * Raise phone/tablet cards so the PNG hanger hook sits on the metal pipe
 * (card top is above the drawn hook in hang ghosts). % of stage height.
 */
const HANG_HOOK_SEAT = -3.2;

function slotForPos(absPos: number): 1 | 2 | 3 {
  if (absPos < 0.55) return 1;
  if (absPos < 1.55) return 2;
  return 3;
}

function shortName(name: string) {
  return name.replace(/^UNKNOWN\s+/i, "").trim();
}

/** Air-filled ghost-mannequin hang art for the shirts rail (no 3D modal required). */
const RAIL_GHOST_BY_FRONT: Record<string, string> = {
  "/products/hanging/shirts/tee4-front.png":
    "/products/hanging/shirts/tee4-front-ghost.png",
  "/products/hanging/shirts/tee5-front.png":
    "/products/hanging/shirts/tee5-front-ghost.png",
  "/products/hanging/shirts/tee6-front.png":
    "/products/hanging/shirts/tee6-front-ghost.png",
  "/products/hanging/shirts/tee7-front.png":
    "/products/hanging/shirts/tee7-front-ghost.png",
  "/products/hanging/shirts/tee8-front.png":
    "/products/hanging/shirts/tee8-front-ghost.png",
  "/products/hanging/shirts/tee9-front.png":
    "/products/hanging/shirts/tee9-front-ghost.png",
  "/products/hanging/shirts/tee10-front.png":
    "/products/hanging/shirts/tee10-front-ghost.png",
  "/products/hanging/shirts/tee11-front.png":
    "/products/hanging/shirts/tee11-front-ghost.png",
  "/products/hanging/shirts/tee12-front.png":
    "/products/hanging/shirts/tee12-front-ghost.png",
  "/products/hanging/shirts/tee13-front.png":
    "/products/hanging/shirts/tee13-front-ghost.png",
};

function productImage(product: Product) {
  const front = product.images?.[0] || "/products/hanging/shirts/tee1-front.png";
  if (RAIL_GHOST_BY_FRONT[front]) return RAIL_GHOST_BY_FRONT[front];
  if (/coral\s*mark/i.test(product.name)) {
    return "/products/hanging/shirts/tee4-front-ghost.png";
  }
  return front;
}

function colorLabel(product: Product) {
  const hex = product.colors?.[0] || product.colorways?.[0]?.color;
  if (!hex) return "CORE";
  const h = hex.toLowerCase();
  if (h.includes("fff") || h === "#f5f5f5" || h === "#ffffff") return "IVORY";
  if (h.includes("0a0a") || h.includes("000") || h.includes("1a1a")) return "BLACK";
  if (h.includes("6b1e") || h.includes("8b000") || h.includes("4a0")) return "BURGUNDY";
  if (h.includes("556b") || h.includes("1f3d") || h.includes("olive")) return "OLIVE";
  if (h.includes("1e3a") || h.includes("6b8c") || h.includes("3b6e")) return "NAVY";
  if (h.includes("c4b5") || h.includes("d2b4")) return "SAND";
  if (h.includes("4a4a") || h.includes("3a3a") || h.includes("6b6b")) return "GREY";
  return "DROP";
}

  function taglineFor(product: Product) {
  const n = shortName(product.name).toLowerCase();
  if (n.includes("circle")) return "Mark of the season.";
  if (n.includes("orbit")) return "Mapped for midnight.";
  if (n.includes("varsity") || n.includes("07")) return "Campus energy.";
  if (n.includes("night")) return "After-hours energy.";
  if (n.includes("field") || n.includes("olive")) return "Built for the street.";
  return "Cut clean. Wear loud.";
}

function wrapIndex(i: number, n: number) {
  return ((i % n) + n) % n;
}

/**
 * Point on the visible quarter-circle hang rail.
 * Circle sits below the stage so we see the top ~25% arc (curved pipe).
 */
function arcPoint(
  t: number,
  w: number,
  h: number
): { x: number; y: number; depth: number } {
  // t = 0 left edge · 0.5 crest · 1 right edge of visible arc
  const cx = w * 0.5;
  const cy = h * 1.55; // center below viewport → only upper arc shows
  const r = Math.min(w * 0.95, h * 1.55);
  // Visible ~90° of the circle (25% of full 360°)
  const a0 = Math.PI + Math.PI * 0.28; // ~230°
  const a1 = Math.PI * 2 - Math.PI * 0.28; // ~310°
  const a = a0 + (a1 - a0) * t;
  const x = cx + r * Math.cos(a);
  const y = cy + r * Math.sin(a);
  // Depth: crest of arc (t≈0.5) is closest to camera
  const depth = 1 - Math.abs(t - 0.5) * 2; // 1 at crest → 0 at edges
  return { x, y, depth };
}

type Pt = { x: number; y: number };

/**
 * Desktop hang on the round-rack circle. Shifts the whole arc so the crest
 * lands on productY — preserves curvature (no per-point flatten).
 */
function desktopArcHang(
  t: number,
  w: number,
  h: number
): { x: number; y: number; depth: number } {
  const D = SHIRTS_DESKTOP_LAYOUT;
  const target = (h * D.productY) / 100;
  const minY = (h * D.productYMin) / 100;
  const maxY = (h * D.productYMax) / 100;
  const crest = arcPoint(0.5, w, h);
  const crestLifted = crest.y - (h * D.arcLift) / 100;
  let shift = target - crestLifted;
  const crestY = crestLifted + shift;
  if (crestY < minY) shift += minY - crestY;
  if (crestY > maxY) shift -= crestY - maxY;
  const arc = arcPoint(Math.max(0, Math.min(1, t)), w, h);
  return {
    x: arc.x,
    y: arc.y - (h * D.arcLift) / 100 + shift,
    depth: arc.depth,
  };
}

/**
 * Structural hang origin for the metal pipe at a visible slot (pos 0, 1, 2).
 * Same base placement as placeCards (stack offset), no per-slot dy so hangers sit on the rail.
 */
function hangPointForPipeSlot(
  pos: number,
  w: number,
  h: number,
  mode: "desktop" | "phone" | "tablet",
  layout: MobileStageLayout
): Pt {
  const mobile = mode !== "desktop";
  const stack = mobile ? STACK_MOBILE : STACK;
  const spread = (VISIBLE_SLOTS + 2.2) / Math.max(0.5, stack.spacing);
  const t = 0.5 + pos / spread;

  if (mobile) {
    const hangY =
      mode === "phone"
        ? (h * layout.productY) / 100
        : (h * SHIRTS_IPAD_LAYOUT.productY) / 100;
    const hangX =
      mode === "phone"
        ? (w * layout.productX) / 100
        : (w * SHIRTS_IPAD_LAYOUT.productX) / 100;
    const x = w * 0.5 + pos * (w * 0.24) + hangX;
    if (mode === "tablet") return { x, y: hangY };
    return {
      x,
      y: hangY + (h * stack.offsetY) / 100,
    };
  }

  const arc = desktopArcHang(t, w, h);
  return {
    x: arc.x + (w * stack.offsetX) / 100,
    y: arc.y + (h * stack.offsetY) / 100,
  };
}

/**
 * Left: STRIDE editorial copy.
 * Right: round-rack curved pipe (25% visible) · Drop-style L→R hang motion.
 * Front big → next smaller/behind → third smaller — seedha (no tilt).
 */
export function StudioRailSection({
  id = "shirts",
  products,
  loading,
}: StudioRailSectionProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [buySize, setBuySize] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mockupOpen, setMockupOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPhone, setIsPhone] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileLayout] = useState<MobileStageLayout>(SHIRTS_MOBILE_LAYOUT);
  const [pieceMap] = useState<Record<number, PieceTweak>>({});

  const pipeGradId = useId().replace(/:/g, "");
  const viewportRef = useRef<HTMLDivElement>(null);
  const railSvgRef = useRef<SVGSVGElement>(null);
  const railPathRef = useRef<SVGPathElement>(null);
  const isMobileRef = useRef(false);
  const isPhoneRef = useRef(false);
  const isTabletRef = useRef(false);
  const mobileLayoutRef = useRef(mobileLayout);
  const pieceMapRef = useRef(pieceMap);
  mobileLayoutRef.current = mobileLayout;
  pieceMapRef.current = pieceMap;
  const stageRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hangRefs = useRef<(HTMLDivElement | null)[]>([]);
  const dragRef = useRef<Draggable | null>(null);
  const sizeRef = useRef({ w: 800, h: 600 });
  const animatingRef = useRef(false);
  const activeIndexRef = useRef(0);
  const lastProxyXRef = useRef(0);
  const lastHangTimeRef = useRef(0);
  const hangVelRef = useRef(0);
  const hangSettleTimer = useRef<number | null>(null);
  const hangRotQuickTo = useRef<Array<ReturnType<typeof gsap.quickTo> | null>>([]);
  const hangXQuickTo = useRef<Array<ReturnType<typeof gsap.quickTo> | null>>([]);
  const snapProxyToRef = useRef<(index: number, animate: boolean) => void>(() => {});
  const flyRef = useRef<HTMLDivElement>(null);

  const { addItem } = useCart();
  const { user } = useAuth();
  const { flyToBag } = useCartUI();

  const count = products.length;
  const product = count ? products[wrapIndex(activeIndex, count)] : null;
  const productKey = products.map((p) => p._id).join("|");
  const mockupSrc = getShirt3DMockupSrc(product);

  useEffect(() => {
    setMockupOpen(false);
  }, [product?._id]);

  useEffect(() => {
    const mqPhone = window.matchMedia("(max-width: 767px)");
    // Classic tablet + iPad Pro portrait (often 1024×1366 — misses max-width:1023)
    const mqTablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px), (min-width: 1024px) and (max-width: 1366px) and (orientation: portrait)"
    );
    const sync = () => {
      const phone = mqPhone.matches;
      const tablet = mqTablet.matches;
      const mobile = phone || tablet;
      isMobileRef.current = mobile;
      isPhoneRef.current = phone;
      isTabletRef.current = tablet;
      setIsMobile(mobile);
      setIsPhone(phone);
      setIsTablet(tablet);
    };
    sync();
    mqPhone.addEventListener("change", sync);
    mqTablet.addEventListener("change", sync);
    return () => {
      mqPhone.removeEventListener("change", sync);
      mqTablet.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    if (!product) return;
    setBuySize(
      product.sizes.find((s) => s.stock > 0)?.size || product.sizes[0]?.size || ""
    );
  }, [product?._id]);

  const updateRail = useCallback(() => {
    const viewport = viewportRef.current;
    const svg = railSvgRef.current;
    const path = railPathRef.current;
    if (!viewport || !svg || !path) return;
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    if (w <= 0 || h <= 0) return;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.setAttribute("width", String(w));
    svg.setAttribute("height", String(h));

    const phone = isPhoneRef.current;
    const tablet = isTabletRef.current;
    const mode: "desktop" | "phone" | "tablet" = phone
      ? "phone"
      : tablet
        ? "tablet"
        : "desktop";
    const layout = mobileLayoutRef.current;

    // Pipe follows the same hang math as the three visible slots (0 → 1 → 2)
    const posStart = -0.22;
    const posEnd = 2.35;
    const samples = 40;
    const pipePts: Pt[] = [];
    for (let i = 0; i <= samples; i++) {
      const pos = posStart + ((posEnd - posStart) * i) / samples;
      pipePts.push(hangPointForPipeSlot(pos, w, h, mode, layout));
    }
    // Pin exact hanger slots so the rail can't drift off the three shirts
    const pinAt = (pos: number) => {
      const u = (pos - posStart) / (posEnd - posStart);
      const idx = Math.round(u * samples);
      if (idx >= 0 && idx <= samples) {
        pipePts[idx] = hangPointForPipeSlot(pos, w, h, mode, layout);
      }
    };
    pinAt(0);
    pinAt(1);
    pinAt(2);
    const d = pipePts
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
    const endL = pipePts[0];
    const endR = pipePts[pipePts.length - 1];

    path.setAttribute("d", d);
    svg.querySelectorAll<SVGPathElement>("[data-pipe-layer]").forEach((el) => {
      el.setAttribute("d", d);
    });
    const mounts = svg.querySelectorAll<SVGCircleElement>("[data-pipe-mount]");
    mounts.forEach((el, i) => {
      const pt = i % 2 === 0 ? endL : endR;
      el.setAttribute("cx", String(pt.x));
      el.setAttribute("cy", String(pt.y));
    });
  }, []);

  const placeCards = useCallback((scrollIndex: number) => {
    const cards = cardRefs.current;
    const n = cards.length;
    const { w, h } = sizeRef.current;
    if (!n || w <= 0) return;

    // Use matchMedia only — stage column width on laptop is often <1024
    const mobile = isMobileRef.current;
    const phone = isPhoneRef.current;
    const tablet = isTabletRef.current;
    const L = mobileLayoutRef.current;
    const stack = mobile ? STACK_MOBILE : STACK;

    for (let i = 0; i < n; i++) {
      const card = cards[i];
      if (!card) continue;

      let pos = i - scrollIndex;
      while (pos > n / 2) pos -= n;
      while (pos < -n / 2) pos += n;

      // Map slot offset → arc t (0..1). Crest at t=0.5
      const spread = (VISIBLE_SLOTS + 2.2) / Math.max(0.5, stack.spacing);
      const t = 0.5 + pos / spread;
      const tc = gsap.utils.clamp(0, 1, t);
      const absPos = Math.abs(pos);
      // Phone pad / iPad locked / desktop arc (clamped for tall fullscreen)
      const hangY = phone
        ? (h * L.productY) / 100
        : tablet
          ? (h * SHIRTS_IPAD_LAYOUT.productY) / 100
          : 0;
      const hangX = phone
        ? (w * L.productX) / 100
        : tablet
          ? (w * SHIRTS_IPAD_LAYOUT.productX) / 100
          : 0;
      const pt = mobile
        ? {
            x: w * 0.5 + pos * (w * 0.24) + hangX,
            y: hangY,
            depth: 1 - Math.min(1, absPos * 0.55),
          }
        : desktopArcHang(tc, w, h);
      // Size ladder: front big → next smaller → farther smaller
      let scale = SCALE_FAR;
      if (absPos < 0.35) scale = SCALE_CREST;
      else if (absPos < 1.15) {
        const u = (absPos - 0.35) / 0.8;
        scale = SCALE_CREST + (SCALE_NEAR - SCALE_CREST) * u;
      } else if (absPos < 2.1) {
        const u = (absPos - 1.15) / 0.95;
        scale = SCALE_NEAR + (SCALE_FAR - SCALE_NEAR) * u;
      }

      const slotN = slotForPos(absPos);
      const slot = slotN === 1 ? stack.s1 : slotN === 2 ? stack.s2 : stack.s3;
      scale *= stack.size * slot.size;
      const piece = getPiece(pieceMapRef.current, i);
      if (phone) {
        scale *= (L.productZoom / STACK_MOBILE.size) * piece.zoom;
      } else if (tablet) {
        scale *= SHIRTS_IPAD_LAYOUT.productZoom / STACK_MOBILE.size;
      }

      // Crest + right neighbor (left of crest hidden on mobile + desktop)
      let opacity = 1;
      let blur = 0;
      if (mobile) {
        if (pos < -0.15) {
          // hide left of crest
          opacity = 0;
          blur = 10;
        } else if (absPos > 1.35) {
          opacity = 0;
          blur = 10;
        } else if (absPos > 0.95) {
          const u = (absPos - 0.95) / 0.4;
          opacity = 1 - u;
          blur = u * 8;
        }
      } else if (pos < -0.12) {
        opacity = 0;
        blur = 10;
      } else if (absPos > 2.45) {
        // Three shirts on the rail (crest + two right). Don't use !onArc —
        // slot 3 often clamps past t=1.02 but must stay fully visible.
        opacity = 0;
        blur = 10;
      } else if (absPos > 2.15) {
        const u = (absPos - 2.15) / 0.3;
        opacity = 1 - gsap.utils.clamp(0, 1, u);
        blur = u * 8;
      }

      const deskSlotX =
        !mobile && slotN === 3 ? SHIRTS_DESKTOP_PAD.slot3X : 0;
      const localX = mobile
        ? pt.x - w / 2 + (phone ? (w * piece.x) / 100 : 0)
        : pt.x - w / 2 + (w * (stack.offsetX + deskSlotX)) / 100;
      // Phone/iPad: shared HANG_HOOK_SEAT so 1st+2nd hangers sit on the pipe.
      // Desktop: stack offset + slot-3 lift so the far shirt sits on the pipe.
      const deskSlotLift =
        !mobile && slotN === 3 ? SHIRTS_DESKTOP_PAD.slot3Y : 0;
      const localY =
        phone
          ? pt.y +
            (h * (stack.offsetY + slot.dy + piece.y + HANG_HOOK_SEAT)) / 100
          : tablet
            ? pt.y + (h * HANG_HOOK_SEAT) / 100
            : mobile
              ? pt.y + (h * (stack.offsetY + slot.dy + HANG_HOOK_SEAT)) / 100
              : pt.y + (h * (stack.offsetY + deskSlotLift)) / 100;

      gsap.set(card, {
        x: localX,
        y: localY,
        rotation: 0,
        scale,
        opacity,
        filter: blur > 0.15 ? `blur(${blur.toFixed(1)}px)` : "blur(0px)",
        zIndex: Math.round(10 + pt.depth * 90),
        transformOrigin: "50% 0%",
        force3D: true,
        pointerEvents: opacity < 0.25 ? "none" : "auto",
      });
    }
  }, []);

  const settleHangPieces = useCallback(() => {
    hangVelRef.current = 0;
    hangRefs.current.forEach((hang, i) => {
      if (!hang) return;
      gsap.to(hang, {
        rotation: 0,
        x: 0,
        duration: 0.7,
        ease: "elastic.out(1, 0.55)",
        overwrite: "auto",
        transformOrigin: "50% 0%",
        onComplete: () => {
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

  const applyHangSway = useCallback(
    (proxyX: number) => {
      const now = performance.now();
      const prevT = lastHangTimeRef.current || now;
      const dt = Math.max(8, Math.min(48, now - prevT));
      lastHangTimeRef.current = now;
      const dx = proxyX - lastProxyXRef.current;
      lastProxyXRef.current = proxyX;
      hangVelRef.current = hangVelRef.current * 0.55 + (dx / dt) * 0.45;
      const v = hangVelRef.current;
      const swayRot = gsap.utils.clamp(-14, 14, -v * 20);
      const swayX = gsap.utils.clamp(-10, 10, -v * 12);

      hangRefs.current.forEach((hang, i) => {
        if (!hang) return;
        const mass = 0.85 + (i % 4) * 0.08;
        hangRotQuickTo.current[i]?.(swayRot * mass);
        hangXQuickTo.current[i]?.(swayX * mass);
      });

      if (hangSettleTimer.current != null) window.clearTimeout(hangSettleTimer.current);
      hangSettleTimer.current = window.setTimeout(() => {
        if (Math.abs(hangVelRef.current) < 0.04) settleHangPieces();
        else {
          hangVelRef.current *= 0.35;
          hangSettleTimer.current = window.setTimeout(settleHangPieces, 160);
        }
      }, 140);
    },
    [settleHangPieces]
  );

  const syncFromProxy = useCallback(() => {
    const proxy = proxyRef.current;
    if (!proxy) return;
    const x = Number(gsap.getProperty(proxy, "x")) || 0;
    const scrollIndex = -x / DRAG_PX_PER_STEP;
    placeCards(scrollIndex);
    applyHangSway(x);
    const next = wrapIndex(Math.round(scrollIndex), count);
    if (next !== activeIndexRef.current) {
      activeIndexRef.current = next;
      setActiveIndex(next);
    }
  }, [placeCards, applyHangSway, count]);

  const snapProxyTo = useCallback(
    (index: number, animate: boolean) => {
      const proxy = proxyRef.current;
      if (!proxy || !count) return;
      const currentX = Number(gsap.getProperty(proxy, "x")) || 0;
      const currentRaw = -currentX / DRAG_PX_PER_STEP;
      const currentIdx = Math.round(currentRaw);
      let delta = wrapIndex(index, count) - wrapIndex(currentIdx, count);
      if (delta > count / 2) delta -= count;
      if (delta < -count / 2) delta += count;
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
    [count, syncFromProxy, settleHangPieces]
  );

  snapProxyToRef.current = snapProxyTo;

  const go = useCallback(
    (dir: -1 | 1) => {
      if (animatingRef.current || !count) return;
      snapProxyTo(wrapIndex(activeIndexRef.current + dir, count), true);
    },
    [count, snapProxyTo]
  );

  // Keep the metal pipe drawn even while products are loading / empty
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const paint = () => updateRail();
    paint();
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(paint)
        : null;
    ro?.observe(viewport);
    window.addEventListener("resize", paint);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", paint);
    };
  }, [updateRail, isMobile, isPhone, isTablet]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const stage = stageRef.current;
    if (!viewport || !stage || count < 2) return;

    const measure = () => {
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      sizeRef.current = { w, h };
      const phone = isPhoneRef.current;
      const tablet = isTabletRef.current;
      if (phone) {
        stage.style.top = `${Math.max(8, h * 0.04)}px`;
      } else if (tablet) {
        stage.style.top = `${Math.max(8, (h * SHIRTS_IPAD_LAYOUT.stageTop) / 100)}px`;
      } else {
        // Desktop: park stage origin so clamped hangY is relative to viewport top
        stage.style.top = "0px";
      }
      stage.style.left = "50%";
      updateRail();
      syncFromProxy();
    };

    const proxy = document.createElement("div");
    proxyRef.current = proxy;
    // Prefer cresting a shirt that has a studio 3D mockup (Coral Mark Tee)
    const mockupStart = products.findIndex((p) => !!getShirt3DMockupSrc(p));
    const startIndex = mockupStart >= 0 ? mockupStart : 0;
    gsap.set(proxy, { x: -startIndex * DRAG_PX_PER_STEP });
    lastProxyXRef.current = -startIndex * DRAG_PX_PER_STEP;
    activeIndexRef.current = startIndex;
    setActiveIndex(startIndex);

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
    placeCards(startIndex);
    requestAnimationFrame(() => {
      measure();
      placeCards(startIndex);
    });

    let draggable: Draggable | null = null;
    try {
      const [d] = Draggable.create(proxy, {
        trigger: viewport,
        type: "x",
        inertia: true,
        resistance: 0.42,
        throwResistance: 1400,
        maxDuration: 1.6,
        minDuration: 0.45,
        edgeResistance: 0.85,
        dragClickables: true,
        minimumMovement: 12,
        onPress() {
          gsap.killTweensOf(proxy);
          animatingRef.current = false;
          lastHangTimeRef.current = performance.now();
          lastProxyXRef.current = Number(gsap.getProperty(proxy, "x")) || 0;
          hangVelRef.current = 0;
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
          x: (value: number) =>
            Math.round(value / DRAG_PX_PER_STEP) * DRAG_PX_PER_STEP,
        },
      });
      draggable = d;
    } catch {
      draggable = null;
    }
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
      if (hangSettleTimer.current != null) window.clearTimeout(hangSettleTimer.current);
      hangRefs.current.forEach((hang) => hang && gsap.killTweensOf(hang));
      hangRotQuickTo.current = [];
      hangXQuickTo.current = [];
      draggable?.kill();
      dragRef.current = null;
      proxyRef.current = null;
      gsap.killTweensOf(proxy);
    };
  }, [productKey, count, isMobile, placeCards, syncFromProxy, settleHangPieces, updateRail]);

  useEffect(() => {
    if (!count) return;
    syncFromProxy();
  }, [
    isMobile,
    isPhone,
    isTablet,
    count,
    syncFromProxy,
    mobileLayout,
    pieceMap,
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

  const onAddToBag = async () => {
    if (!product || !buySize) return;
    const crest = cardRefs.current[activeIndexRef.current];
    const from =
      crest?.getBoundingClientRect() ?? flyRef.current?.getBoundingClientRect() ?? null;
    const image = productImage(product);
    if (image) flyToBag(image, from);
    if (!user) return;
    try {
      setSubmitting(true);
      await addItem(product._id, buySize, 1, product);
    } finally {
      setSubmitting(false);
    }
  };

  const indexLabel = useMemo(() => {
    if (!product) return "";
    return `SHIRT ${String(activeIndex + 1).padStart(2, "0")} — ${colorLabel(product)}`;
  }, [activeIndex, product]);

  const cardW = isMobile ? CARD_W_MOBILE : CARD_W;
  const cardH = isMobile ? CARD_H_MOBILE : CARD_H;
  const titleWord =
    shortName(product?.name || "").split(" ")[0]?.toUpperCase() || "UNKNOWN";

  const stageCards = loading ? (
    <div className="flex h-full items-center justify-center">
      <div className="h-44 w-32 skeleton rounded-md" />
    </div>
  ) : count ? (
    <div
      ref={stageRef}
      className="absolute left-1/2 z-[22] h-0 w-0"
      style={{ transform: "translate3d(0,0,0)" }}
    >
      {products.map((p, i) => (
        <div
          key={p._id}
          ref={(el) => {
            cardRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 origin-top will-change-transform"
          style={{
            width: cardW,
            height: cardH,
            marginLeft: `calc(${cardW} / -2)`,
          }}
        >
          <div
            ref={(el) => {
              hangRefs.current[i] = el;
            }}
            className="relative h-full w-full origin-top"
          >
            <div
              ref={i === activeIndex ? flyRef : undefined}
              className="relative h-full w-full"
            >
              <Image
                src={productImage(p)}
                alt={shortName(p.name)}
                fill
                unoptimized
                draggable={false}
                sizes="(max-width: 1023px) 240px, 188px"
                className="object-contain object-top drop-shadow-[8px_16px_24px_rgba(20,24,24,0.22)]"
                priority={i < 4}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  ) : null;

  const sizeEntries = product?.sizes ?? [];

  const pipeRail = (
    <svg
      ref={railSvgRef}
      className="pointer-events-none absolute inset-0 z-[18]"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${pipeGradId}-metal`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f2f3f5" />
          <stop offset="16%" stopColor="#c5c9d0" />
          <stop offset="38%" stopColor="#7a808a" />
          <stop offset="55%" stopColor="#3e444c" />
          <stop offset="72%" stopColor="#6d7380" />
          <stop offset="88%" stopColor="#b0b5bd" />
          <stop offset="100%" stopColor="#dde0e5" />
        </linearGradient>
        <linearGradient id={`${pipeGradId}-hi`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter
          id={`${pipeGradId}-shadow`}
          x="-8%"
          y="-220%"
          width="116%"
          height="540%"
        >
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="1.8"
            floodColor="#1a1c20"
            floodOpacity="0.28"
          />
        </filter>
      </defs>
      {/* Soft floor cast */}
      <path
        data-pipe-layer
        fill="none"
        stroke="#1a1c20"
        strokeOpacity="0.18"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Solid metal body */}
      <path
        ref={railPathRef}
        fill="none"
        stroke={`url(#${pipeGradId}-metal)`}
        strokeWidth="5.4"
        strokeLinecap="round"
        filter={`url(#${pipeGradId}-shadow)`}
      />
      {/* Specular ridge */}
      <path
        data-pipe-layer
        fill="none"
        stroke={`url(#${pipeGradId}-hi)`}
        strokeWidth="1.6"
        strokeLinecap="round"
        transform="translate(0 -1.35)"
      />
      {/* End caps / wall mounts */}
      <circle data-pipe-mount r="3.6" fill="#4a5058" />
      <circle data-pipe-mount r="3.6" fill="#4a5058" />
      <circle data-pipe-mount r="1.7" fill="#c8ccd3" />
      <circle data-pipe-mount r="1.7" fill="#c8ccd3" />
    </svg>
  );

  const stageWall = (
    <>
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#ebe4d8]"
        aria-hidden
      >
        <Image
          src="/rooms/beige-room-wall.jpg"
          alt=""
          width={2307}
          height={1540}
          unoptimized
          priority
          sizes="(max-width: 767px) 100vw, (max-width: 1023px) 100vw, 60vw"
          className={
            isTablet
              ? "absolute inset-0 h-full w-full max-w-none object-cover"
              : "absolute left-1/2 h-auto max-w-none"
          }
          style={
            isPhone
              ? {
                  width: `${SHIRT_WALL_BG_WIDTH_PCT}%`,
                  top: `${mobileLayout.bgPosY}%`,
                  transform: `translate(-50%, -50%) scale(${
                    mobileLayout.bgZoom * SHIRT_WALL_ZOOM_TOUCH
                  })`,
                }
              : isTablet
                ? {
                    // Full-bleed cover so bag + shirts sit on the wall photo
                    // (iPad Pro portrait was cropping short and exposing flat fill)
                    objectPosition: "center 38%",
                  }
                : {
                    width: `${SHIRT_WALL_BG_WIDTH_PCT}%`,
                    top: `${SHIRTS_DESKTOP_PAD.wallPosY}%`,
                    transform: `translate(-50%, -50%) scale(${SHIRTS_DESKTOP_PAD.wallZoom})`,
                  }
          }
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-[1] shirt-studio-atmosphere"
        aria-hidden
      />
    </>
  );

  return (
    <section
      id={id}
      className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[var(--ivory)]"
    >
      {/* ── MOBILE: visual stage → details (page title lives in CategoryStoreView) ── */}
      {isMobile ? (
        <div className="relative z-[2] flex min-h-0 w-full flex-1 flex-col">
          <div
            ref={viewportRef}
            className={cn(
              "relative min-h-0 w-full flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing",
              isTablet && "pt-2"
            )}
          >
            {stageWall}
            {pipeRail}
            {stageCards}

            <ShopBagButton
              className="absolute z-[40]"
              style={
                isPhone
                  ? {
                      bottom: `${mobileLayout.bagBottom}%`,
                      width: mobileLayout.bagWidth,
                      ...(mobileLayout.bagRight >= 0
                        ? { right: `${mobileLayout.bagRight}%`, left: "auto" }
                        : { left: `${mobileLayout.bagLeft}%`, right: "auto" }),
                    }
                  : {
                      bottom: "0.5rem",
                      left: "0.75rem",
                      width: 62,
                    }
              }
            />
          </div>

          {/* Frosted buy plate — stable chrome; only name/price swap */}
          <div className="relative z-[30] shrink-0 px-3 pb-[calc(4.25rem+env(safe-area-inset-bottom))] pt-1.5 sm:px-4">
            <div className="mx-auto w-full max-w-md rounded-[20px] border border-white/70 bg-[#f7f4ef]/95 px-2.5 py-2 shadow-[0_14px_40px_rgba(30,24,18,0.2)] backdrop-blur-md sm:px-3 sm:py-2.5">
              {product ? (
                <div>
                  <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Previous shirt"
                      onClick={() => go(-1)}
                      className="inline-flex h-9 w-9 items-center justify-center justify-self-start rounded-full border border-teal-deep/20 bg-white text-teal-deep shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <div className="min-w-0 text-center">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={product._id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.18 }}
                        >
                          <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-teal-deep/55">
                            {indexLabel}
                          </p>
                          <p className="mt-0.5 truncate font-display text-[1.25rem] leading-none tracking-[-0.02em] text-teal-deep">
                            {titleWord}
                          </p>
                          <p className="mt-1 text-[12px] font-semibold tabular-nums text-teal-deep">
                            {formatPrice(product.price)}
                            <span className="mx-1.5 font-medium text-teal-deep/45">·</span>
                            <span className="font-medium text-teal-deep/70">
                              {taglineFor(product)}
                            </span>
                          </p>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <button
                      type="button"
                      aria-label="Next shirt"
                      onClick={() => go(1)}
                      className="inline-flex h-9 w-9 items-center justify-center justify-self-end rounded-full border border-teal-deep/20 bg-white text-teal-deep shadow-sm"
                    >
                      <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5">
                    {sizeEntries.map((entry) => (
                      <button
                        key={entry.size}
                        type="button"
                        disabled={entry.stock <= 0}
                        onClick={() => setBuySize(entry.size)}
                        className={cn(
                          "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-[11px] font-semibold uppercase tracking-[0.08em] transition",
                          buySize === entry.size
                            ? "border-teal-deep bg-teal-deep text-white"
                            : "border-teal-deep/20 bg-white text-teal-deep",
                          "disabled:cursor-not-allowed disabled:opacity-30"
                        )}
                      >
                        {entry.size}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    {mockupSrc ? (
                      <button
                        type="button"
                        onClick={() => setMockupOpen(true)}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-teal-deep/25 bg-white text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-deep transition hover:border-teal-deep/50"
                      >
                        <Box className="h-3.5 w-3.5" strokeWidth={1.75} />
                        3D view
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={onAddToBag}
                      disabled={submitting || !buySize}
                      className={cn(
                        "flex h-10 items-center justify-center rounded-full bg-teal-deep text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-teal disabled:opacity-50",
                        mockupSrc ? "flex-[1.35]" : "w-full"
                      )}
                    >
                      {submitting ? "Adding…" : "Add to Bag"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="py-4 text-center text-sm text-muted">
                  {loading ? "Loading drop…" : "No shirts in this drop yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── DESKTOP: sticky details + curved metal rack stage ── */
        <div className="relative z-[2] mx-auto grid h-full min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-[minmax(260px,0.88fr)_minmax(0,1.4fr)] gap-0 lg:gap-3 lg:px-3 lg:pb-3 xl:px-4">
          <aside className="relative z-[20] flex min-h-0 flex-col justify-center overflow-y-auto px-5 pb-6 pt-1 sm:px-8 lg:sticky lg:top-0 lg:max-h-full lg:self-stretch lg:px-8 xl:px-12">
            {loading ? (
              <div className="space-y-4">
                <div className="h-3 w-40 skeleton" />
                <div className="h-14 w-64 skeleton" />
                <div className="h-4 w-48 skeleton" />
              </div>
            ) : product ? (
              <div className="max-w-md">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                  >
                    <h2 className="font-display text-[clamp(2.1rem,4.8vw,4.25rem)] leading-[0.92] tracking-[-0.02em] text-teal-deep">
                      {titleWord}
                    </h2>
                    <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-teal-deep/70">
                      {indexLabel}
                    </p>
                    <p className="mt-4 text-[1.15rem] font-semibold leading-snug text-teal-deep sm:mt-5 sm:text-[1.4rem]">
                      {taglineFor(product)}
                    </p>
                    <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-[#7a8282] sm:mt-3 sm:text-[15px]">
                      {product.description ||
                        "Premium materials with a finish that holds when the lights drop."}
                    </p>
                    <p className="mt-4 text-sm font-medium tabular-nums text-teal-deep sm:mt-5">
                      {formatPrice(product.price)}
                    </p>
                  </motion.div>
                </AnimatePresence>

                <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                  {sizeEntries.map((entry) => (
                    <button
                      key={entry.size}
                      type="button"
                      disabled={entry.stock <= 0}
                      onClick={() => setBuySize(entry.size)}
                      className={cn(
                        "flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-xs font-semibold uppercase tracking-[0.08em] transition",
                        buySize === entry.size
                          ? "border-teal-deep bg-teal-deep text-white"
                          : "border-teal-deep/20 bg-transparent text-teal-deep hover:border-teal-deep/50",
                        "disabled:cursor-not-allowed disabled:opacity-30"
                      )}
                    >
                      {entry.size}
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex w-full max-w-xs flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={onAddToBag}
                    disabled={submitting || !buySize}
                    className="flex h-12 w-full items-center justify-center rounded-md bg-teal-deep text-sm font-semibold tracking-[0.06em] text-white transition hover:bg-teal disabled:opacity-50"
                  >
                    {submitting ? "Adding…" : "Add to Bag"}
                  </button>
                  {mockupSrc ? (
                    <button
                      type="button"
                      onClick={() => setMockupOpen(true)}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-teal-deep/20 bg-white/70 text-[12px] font-semibold uppercase tracking-[0.16em] text-teal-deep transition hover:border-teal-deep/45 hover:bg-white"
                    >
                      <Box className="h-4 w-4" strokeWidth={1.75} />
                      3D view
                    </button>
                  ) : null}
                </div>
                <Link
                  href={`/product/${product._id}`}
                  className="mt-3 inline-block text-[11px] uppercase tracking-[0.2em] text-teal-deep/45 underline-offset-4 hover:text-teal-deep hover:underline"
                >
                  Full details
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted">No shirts in this drop yet.</p>
            )}
          </aside>

          <div
            ref={viewportRef}
            className="relative min-h-[46vh] cursor-grab overflow-hidden touch-none active:cursor-grabbing lg:h-full lg:min-h-0 lg:rounded-sm"
          >
            {stageWall}
            {pipeRail}
            {stageCards}
            {count > 1 || mockupSrc ? (
              <div className="absolute bottom-10 left-1/2 z-[35] flex -translate-x-1/2 items-center gap-3">
                {count > 1 ? (
                  <button
                    type="button"
                    aria-label="Previous shirt"
                    onClick={() => go(-1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-deep text-white shadow-md transition hover:bg-teal"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                ) : null}
                {mockupSrc ? (
                  <button
                    type="button"
                    aria-label="Open 3D mockup"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMockupOpen(true);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-white/70 bg-[#f7f4ef]/95 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-deep shadow-md backdrop-blur-md transition hover:bg-white"
                  >
                    <Box className="h-3.5 w-3.5" strokeWidth={1.75} />
                    3D view
                  </button>
                ) : null}
                {count > 1 ? (
                  <button
                    type="button"
                    aria-label="Next shirt"
                    onClick={() => go(1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-deep text-white shadow-md transition hover:bg-teal"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : null}
              </div>
            ) : null}
            <ShopBagButton className="absolute bottom-[3%] right-[4%] z-[40] w-[88px] sm:w-[104px] lg:w-[110px]" />
          </div>
        </div>
      )}

      {product && mockupSrc ? (
        <Shirt3DMockupModal
          open={mockupOpen}
          product={product}
          mockupSrc={mockupSrc}
          onClose={() => setMockupOpen(false)}
        />
      ) : null}
    </section>
  );
}
