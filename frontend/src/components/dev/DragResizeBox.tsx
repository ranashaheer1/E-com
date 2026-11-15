"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { cn } from "@/lib/utils";

export type BoxGeom = {
  /** left as % of viewport width */
  x: number;
  /** top in px from section top */
  y: number;
  /** width as % of viewport */
  w: number;
  /** height in px */
  h: number;
};

type Edge = "n" | "s" | "e" | "w" | "se" | "sw" | "ne" | "nw" | "move";

interface DragResizeBoxProps {
  label: string;
  value: BoxGeom;
  onChange: (next: BoxGeom) => void;
  children: ReactNode;
  className?: string;
  /** min/max clamps */
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

/**
 * Solid-border box: drag the small handle to move anywhere;
 * drag edges/corners to resize width & height with the mouse.
 */
export function DragResizeBox({
  label,
  value,
  onChange,
  children,
  className,
  minW = 18,
  maxW = 92,
  minH = 200,
  maxH = 920,
}: DragResizeBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    edge: Edge;
    startX: number;
    startY: number;
    orig: BoxGeom;
  } | null>(null);
  const [active, setActive] = useState(false);

  const onPointerDown = (edge: Edge) => (e: ReactPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = {
      edge,
      startX: e.clientX,
      startY: e.clientY,
      orig: { ...value },
    };
    setActive(true);
  };

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      const dxPx = e.clientX - d.startX;
      const dyPx = e.clientY - d.startY;
      const vw = window.innerWidth || 1;
      const dxPct = (dxPx / vw) * 100;
      const dy = dyPx;
      const o = d.orig;
      let next: BoxGeom = { ...o };

      if (d.edge === "move") {
        next = {
          ...o,
          x: clamp(o.x + dxPct, -5, 95),
          y: clamp(o.y + dy, -80, 900),
        };
      } else {
        let { x, y, w, h } = o;
        if (d.edge.includes("e")) w = clamp(o.w + dxPct, minW, maxW);
        if (d.edge.includes("w")) {
          const nw = clamp(o.w - dxPct, minW, maxW);
          x = o.x + (o.w - nw);
          w = nw;
        }
        if (d.edge.includes("s")) h = clamp(o.h + dy, minH, maxH);
        if (d.edge.includes("n")) {
          const nh = clamp(o.h - dy, minH, maxH);
          y = o.y + (o.h - nh);
          h = nh;
        }
        next = { x, y, w, h };
      }
      onChange(next);
    },
    [maxH, maxW, minH, minW, onChange]
  );

  const endDrag = useCallback(() => {
    drag.current = null;
    setActive(false);
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [endDrag, onPointerMove]);

  const edge = (edge: Edge, cls: string) => (
    <div
      role="presentation"
      onPointerDown={onPointerDown(edge)}
      className={cn(
        "absolute z-30 touch-none",
        active ? "bg-coral/25" : "bg-transparent hover:bg-coral/20",
        cls
      )}
    />
  );

  return (
    <div
      ref={boxRef}
      className={cn(
        "absolute z-20 box-border overflow-visible",
        active && "z-40",
        className
      )}
      style={{
        left: `${value.x}vw`,
        top: value.y,
        width: `${value.w}vw`,
        height: value.h,
      }}
    >
      {/* Solid outline so the box is obvious */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-sm border-[2.5px]",
          active ? "border-coral" : "border-teal-deep"
        )}
        aria-hidden
      />

      {/* Content */}
      <div className="relative h-full w-full overflow-hidden rounded-sm">
        {children}
      </div>

      {/* Move handle — small box */}
      <button
        type="button"
        aria-label={`Move ${label}`}
        onPointerDown={onPointerDown("move")}
        className="absolute -left-1 -top-1 z-40 flex h-7 w-7 cursor-grab touch-none items-center justify-center rounded-sm border-2 border-teal-deep bg-white text-[9px] font-bold uppercase tracking-wider text-teal-deep shadow-md active:cursor-grabbing active:bg-coral active:text-white active:border-coral"
        title="Drag to move"
      >
        ✥
      </button>

      {/* Edge hit areas */}
      {edge("n", "inset-x-3 -top-1 h-3 cursor-ns-resize")}
      {edge("s", "inset-x-3 -bottom-1 h-3 cursor-ns-resize")}
      {edge("e", "inset-y-3 -right-1 w-3 cursor-ew-resize")}
      {edge("w", "inset-y-3 -left-1 w-3 cursor-ew-resize")}
      {edge("se", "-bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize")}
      {edge("sw", "-bottom-1.5 -left-1.5 h-4 w-4 cursor-nesw-resize")}
      {edge("ne", "-top-1.5 -right-1.5 h-4 w-4 cursor-nesw-resize")}
      {edge("nw", "-top-1.5 -left-1.5 h-4 w-4 cursor-nwse-resize")}

      {/* Size readout */}
      <div className="pointer-events-none absolute -bottom-6 left-0 rounded bg-teal-deep/90 px-1.5 py-0.5 text-[9px] tabular-nums text-white">
        {label} · {Math.round(value.w)}vw × {Math.round(value.h)}px · (
        {Math.round(value.x)},{Math.round(value.y)})
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
