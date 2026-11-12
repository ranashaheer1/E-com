"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Box, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export type Hang3DTurntable = {
  front: string;
  left: string;
  right: string;
};

type YawKey = "left" | "front" | "right";

const YAW_ORDER: YawKey[] = ["left", "front", "right"];
const YAW_INDEX: Record<YawKey, number> = { left: 0, front: 1, right: 2 };

function shortName(name: string) {
  return name.replace(/^UNKNOWN\s+/i, "").trim();
}

/** Pants that ship a real -side.png hang frame */
const PANTS_WITH_SIDE = new Set([
  "/products/hanging/pants/pant1-front.png",
  "/products/hanging/pants/pant2-front.png",
  "/products/hanging/pants/pant3-front.png",
]);

function sideCandidate(front: string) {
  return front.replace(/-front(\.[a-z0-9]+)$/i, "-side$1");
}

/** Pants / trousers turntable from hang assets (front · side · back). */
export function getPants3DTurntable(
  product: Product | null | undefined
): Hang3DTurntable | null {
  if (!product) return null;
  if (product.category !== "pants" && product.category !== "trousers") {
    return null;
  }
  const front = product.images?.[0];
  if (!front) return null;
  const back = product.images?.[1] || front;
  const left = PANTS_WITH_SIDE.has(front) ? sideCandidate(front) : front;
  return { front, left, right: back };
}

export function getPants3DMockupSrc(product: Product | null | undefined) {
  return getPants3DTurntable(product)?.front ?? null;
}

interface Hang3DMockupModalProps {
  open: boolean;
  product: Product;
  onClose: () => void;
}

export function Hang3DMockupModal({
  open,
  product,
  onClose,
}: Hang3DMockupModalProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startYaw: number;
    pointerId: number | null;
    moved: boolean;
  }>({ active: false, startX: 0, startYaw: 1, pointerId: null, moved: false });

  const turntable = useMemo(() => {
    const fromProduct = getPants3DTurntable(product);
    const front = product.images?.[0] || "";
    const back = product.images?.[1] || front;
    return fromProduct ?? { front, left: front, right: back };
  }, [product]);

  const [yawIndex, setYawIndex] = useState(1);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const rafRef = useRef<number | null>(null);
  const targetTiltRef = useRef({ x: 0, y: 0 });

  const yawKey = YAW_ORDER[yawIndex] ?? "front";
  const activeSrc = turntable[yawKey];

  const applyTilt = useCallback((clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = ((clientY - r.top) / r.height) * 2 - 1;
    targetTiltRef.current = {
      x: Math.max(-1, Math.min(1, ny)) * -4,
      y: Math.max(-1, Math.min(1, nx)) * 6,
    };
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setTilt({ ...targetTiltRef.current });
      });
    }
  }, []);

  const resetTilt = useCallback(() => {
    targetTiltRef.current = { x: 0, y: 0 };
    setTilt({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (!open) return;
    setYawIndex(YAW_INDEX.front);
    resetTilt();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setYawIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight")
        setYawIndex((i) => Math.min(YAW_ORDER.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [open, onClose, resetTilt]);

  useEffect(() => {
    if (!open) return;
    YAW_ORDER.forEach((k) => {
      const img = new window.Image();
      img.src = turntable[k];
    });
  }, [open, turntable]);

  const onPointerDown = (e: ReactPointerEvent) => {
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startYaw: yawIndex,
      pointerId: e.pointerId,
      moved: false,
    };
    setDragging(true);
    stageRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    applyTilt(e.clientX, e.clientY);
    const d = dragRef.current;
    if (!d.active) return;
    const el = stageRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width || 1;
    const deltaPx = e.clientX - d.startX;
    if (Math.abs(deltaPx) > 6) d.moved = true;
    const delta = deltaPx / w;
    const next = Math.round(d.startYaw - delta * 2.6);
    setYawIndex(Math.max(0, Math.min(YAW_ORDER.length - 1, next)));
  };

  const endDrag = (e: ReactPointerEvent) => {
    if (dragRef.current.pointerId != null) {
      try {
        stageRef.current?.releasePointerCapture?.(dragRef.current.pointerId);
      } catch {
        // ignore
      }
    }
    dragRef.current.active = false;
    dragRef.current.pointerId = null;
    setDragging(false);
    if (e.type === "pointerleave") resetTilt();
  };

  const yawLabel =
    yawKey === "left" ? "Side" : yawKey === "right" ? "Back" : "Front";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end justify-center p-3 sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`3D view — ${shortName(product.name)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          onClick={onClose}
        >
          <div
            className="absolute inset-0 bg-[#083b3f]/45 backdrop-blur-[3px]"
            aria-hidden
          />
          <motion.div
            className="relative z-[1] flex max-h-[min(92dvh,920px)] w-full max-w-[520px] flex-col overflow-hidden rounded-[28px] border border-white/50 bg-[#f7f4ef] shadow-[0_28px_80px_rgba(8,59,63,0.35)] sm:max-w-[640px]"
            initial={{ opacity: 0, y: 28, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-5 sm:px-7 sm:pt-6">
              <div>
                <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-teal-deep/55">
                  <Box className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Studio 3D
                </p>
                <h2 className="mt-1.5 font-display text-[1.65rem] leading-none tracking-[-0.02em] text-teal-deep sm:text-[2rem]">
                  {shortName(product.name)}
                </h2>
                <p className="mt-2 text-[13px] text-[#7a8282]">
                  Hang turntable · drag to spin · {yawLabel}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close 3D view"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-teal-deep/15 bg-white text-teal-deep shadow-sm transition hover:border-teal-deep/35"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>

            <div
              ref={stageRef}
              className="relative mx-3 flex min-h-0 flex-1 touch-none select-none items-stretch justify-center overflow-hidden rounded-[22px] bg-[#ebe4d8] sm:mx-5"
              style={{
                cursor: dragging ? "grabbing" : "grab",
                perspective: "1400px",
                minHeight: "min(58dvh, 560px)",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onPointerLeave={endDrag}
            >
              <motion.div
                className="relative z-[1] h-full w-full"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${
                    dragging ? 1.01 : 1
                  })`,
                  transition: dragging
                    ? "transform 40ms linear"
                    : "transform 160ms ease-out",
                }}
              >
                <div className="relative h-full w-full min-h-[min(58dvh,560px)]">
                  <AnimatePresence mode="sync" initial={false}>
                    <motion.div
                      key={activeSrc}
                      className="absolute inset-0"
                      initial={{ opacity: 0.25 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Image
                        src={activeSrc}
                        alt={`${shortName(product.name)} — ${yawLabel}`}
                        fill
                        unoptimized
                        priority
                        sizes="(max-width: 640px) 94vw, 640px"
                        className="mix-blend-mode-darken object-contain object-top p-4 sm:p-6"
                        draggable={false}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>

              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-24 bg-gradient-to-t from-[#2a2218]/20 to-transparent"
                aria-hidden
              />

              <div
                className="pointer-events-none absolute bottom-3 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#083b3f]/40 px-2.5 py-1.5 backdrop-blur-sm"
                aria-hidden
              >
                {YAW_ORDER.map((k, i) => (
                  <span
                    key={k}
                    className="h-1.5 rounded-full transition-all duration-200"
                    style={{
                      width: i === yawIndex ? 18 : 6,
                      background:
                        i === yawIndex
                          ? "rgba(255,252,246,0.95)"
                          : "rgba(255,252,246,0.4)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-7 sm:pb-6">
              <p className="text-sm font-semibold tabular-nums text-teal-deep">
                {formatPrice(product.price)}
                <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.18em] text-teal-deep/45">
                  {product.category}
                </span>
              </p>
              <p className="hidden text-[11px] uppercase tracking-[0.2em] text-teal-deep/40 sm:block">
                Drag · ← → · Esc
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
