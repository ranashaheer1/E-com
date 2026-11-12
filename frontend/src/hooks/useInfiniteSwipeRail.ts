"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";

export interface InfiniteSwipeRailOptions {
  /** Width of one loop (one copy of items), in px */
  getLoopWidth: () => number;
  /** Disable drag (e.g. while a piece is selected) */
  enabled?: boolean;
  /** Friction for momentum (0–1, higher = stops sooner). Default 0.92 */
  friction?: number;
  /** Min velocity (px/ms) to start inertia */
  minVelocity?: number;
  /** Ignore tiny moves so clicks still work */
  clickThreshold?: number;
}

/**
 * Lag-free infinite horizontal rail: mutates transform via rAF,
 * never React state per frame. Classic duplicate-loop wrap.
 */
export function useInfiniteSwipeRail({
  getLoopWidth,
  enabled = true,
  friction = 0.925,
  minVelocity = 0.04,
  clickThreshold = 6,
}: InfiniteSwipeRailOptions) {
  const trackRef = useRef<HTMLDivElement>(null);
  const xRef = useRef(0);
  const velRef = useRef(0);
  const draggingRef = useRef(false);
  const lastXRef = useRef(0);
  const lastTRef = useRef(0);
  const startXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const movedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const applyTransform = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${xRef.current}px,0,0)`;
  }, []);

  const wrapX = useCallback(() => {
    const loop = getLoopWidth();
    if (loop <= 0) return;
    // Keep x in (-loop, 0]
    while (xRef.current <= -loop) xRef.current += loop;
    while (xRef.current > 0) xRef.current -= loop;
  }, [getLoopWidth]);

  const stopInertia = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tickInertia = useCallback(() => {
    if (draggingRef.current || !enabledRef.current) {
      rafRef.current = null;
      return;
    }
    velRef.current *= friction;
    if (Math.abs(velRef.current) < minVelocity) {
      velRef.current = 0;
      rafRef.current = null;
      return;
    }
    xRef.current += velRef.current * 16.67; // ~1 frame at 60fps units
    wrapX();
    applyTransform();
    rafRef.current = requestAnimationFrame(tickInertia);
  }, [applyTransform, friction, minVelocity, wrapX]);

  const startInertia = useCallback(() => {
    stopInertia();
    if (Math.abs(velRef.current) < minVelocity) return;
    rafRef.current = requestAnimationFrame(tickInertia);
  }, [minVelocity, stopInertia, tickInertia]);

  useEffect(() => {
    applyTransform();
    return () => stopInertia();
  }, [applyTransform, stopInertia]);

  useEffect(() => {
    if (!enabled) {
      stopInertia();
      draggingRef.current = false;
    }
  }, [enabled, stopInertia]);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (!enabledRef.current) return;
      // Only primary button / touch
      if (e.button !== 0 && e.pointerType === "mouse") return;
      stopInertia();
      draggingRef.current = true;
      movedRef.current = false;
      pointerIdRef.current = e.pointerId;
      startXRef.current = e.clientX;
      lastXRef.current = e.clientX;
      lastTRef.current = performance.now();
      velRef.current = 0;
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [stopInertia]
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!draggingRef.current || pointerIdRef.current !== e.pointerId) return;
      const now = performance.now();
      const dx = e.clientX - lastXRef.current;
      const dt = Math.max(now - lastTRef.current, 1);
      if (Math.abs(e.clientX - startXRef.current) > clickThreshold) {
        movedRef.current = true;
      }
      xRef.current += dx;
      // Velocity in px/ms * frame scale for inertia
      velRef.current = (dx / dt) * 16.67;
      lastXRef.current = e.clientX;
      lastTRef.current = now;
      wrapX();
      applyTransform();
    },
    [applyTransform, clickThreshold, wrapX]
  );

  const endDrag = useCallback(
    (e: ReactPointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      draggingRef.current = false;
      pointerIdRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {
        /* already released */
      }
      if (movedRef.current) startInertia();
    },
    [startInertia]
  );

  /** True if the last gesture was a drag (suppress click) */
  const didDrag = useCallback(() => movedRef.current, []);

  const reset = useCallback(() => {
    stopInertia();
    xRef.current = 0;
    velRef.current = 0;
    applyTransform();
  }, [applyTransform, stopInertia]);

  return {
    trackRef,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    didDrag,
    reset,
    /** Live x — for centering a selected item without React re-renders */
    setX: (x: number) => {
      stopInertia();
      xRef.current = x;
      wrapX();
      applyTransform();
    },
    getX: () => xRef.current,
  };
}
