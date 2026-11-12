"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const VISIBLE = 3;
/** Wheel pixels that map to one full beat of progress */
const WHEEL_PER_BEAT = 420;

export interface InchwormRailOptions {
  /** Re-run when parade length / product ids change */
  itemCount: number;
  enabled?: boolean;
}

/**
 * MakeWayGames mwg_effect070-style inchworm:
 * exactly 3 cards visible; wheel / swipe over the rail advances
 * staggered horizontal beats. Page scroll is never hijacked —
 * wheel listeners live only on the rail root.
 */
export function useInchwormRail({ itemCount, enabled = true }: InchwormRailOptions) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const pinHeightRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragMovedRef = useRef(false);
  const animatingRef = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const progressRef = useRef(0);
  const beatsRef = useRef(1);
  const snapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || itemCount <= 0) return;

    const section = sectionRef.current;
    const pinHeight = pinHeightRef.current;
    const container = containerRef.current;
    if (!section || !pinHeight || !container) return;

    const medias = Array.from(
      container.querySelectorAll<HTMLElement>("[data-inchworm-media]")
    );
    if (medias.length < VISIBLE) return;

    const beats = Math.max(medias.length - VISIBLE, 1);
    beatsRef.current = beats;
    progressRef.current = 0;

    // Natural section height — no tall ScrollTrigger runway that traps page scroll
    pinHeight.style.height = "auto";

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      gsap.set(medias, { xPercent: 0, force3D: true });

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "none" },
      });

      // One timeline segment per beat: cards step one lane with a short stagger
      for (let i = 0; i < beats; i++) {
        tl.to(medias, {
          xPercent: -100 * (i + 1),
          stagger: { each: 0.07, from: "start" },
          ease: "power1.inOut",
          duration: 1,
        });
      }

      tlRef.current = tl;
      tl.progress(0);
    }, section);

    const clearSnapTimer = () => {
      if (snapTimerRef.current != null) {
        window.clearTimeout(snapTimerRef.current);
        snapTimerRef.current = null;
      }
    };

    const setProgress = (next: number, smooth: boolean) => {
      const tl = tlRef.current;
      if (!tl) return;
      const p = gsap.utils.clamp(0, 1, next);
      progressRef.current = p;

      gsap.killTweensOf(tl);
      if (prefersReduced || !smooth) {
        tl.progress(p);
        animatingRef.current = false;
        return;
      }

      animatingRef.current = true;
      gsap.to(tl, {
        progress: p,
        duration: 0.55,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          animatingRef.current = false;
        },
      });
    };

    const snapToNearestBeat = () => {
      const b = beatsRef.current;
      const nearest = Math.round(progressRef.current * b) / b;
      setProgress(nearest, true);
    };

    const scheduleSnap = () => {
      clearSnapTimer();
      snapTimerRef.current = window.setTimeout(() => {
        snapTimerRef.current = null;
        snapToNearestBeat();
      }, 140);
    };

    const advanceBeat = (dir: 1 | -1) => {
      if (animatingRef.current) return;
      const b = beatsRef.current;
      const current = Math.round(progressRef.current * b);
      const next = gsap.utils.clamp(0, b, current + dir);
      if (next === current) return;
      clearSnapTimer();
      setProgress(next / b, true);
    };

    // Pointer swipe → one measured beat
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    dragMovedRef.current = false;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      dragMovedRef.current = false;
      try {
        container.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        dragMovedRef.current = true;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      pointerId = null;
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
      advanceBeat(dx < 0 ? 1 : -1);
    };

    /**
     * Wheel only on the pants rail root. Outside → listener never fires →
     * document/body scroll normally. No window/document preventDefault.
     */
    const onWheel = (e: WheelEvent) => {
      const target = e.target;
      if (!(target instanceof Node) || !section.contains(target)) return;

      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      const delta = absX > absY ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 0.5) return;

      const b = beatsRef.current;
      const atStart = progressRef.current <= 0.001;
      const atEnd = progressRef.current >= 0.999;
      // At ends, allow page to keep scrolling in that direction
      if (atStart && delta < 0) return;
      if (atEnd && delta > 0) return;

      e.preventDefault();
      e.stopPropagation();

      // Kill snap tween so continuous wheel stays 1:1 with delta
      const tl = tlRef.current;
      if (tl) gsap.killTweensOf(tl);
      animatingRef.current = false;

      const next = progressRef.current + delta / (WHEEL_PER_BEAT * b);
      setProgress(next, false);
      scheduleSnap();
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerUp);
    // Non-passive wheel on the visible rail root only
    section.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      clearSnapTimer();
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
      section.removeEventListener("wheel", onWheel);
      tlRef.current = null;
      ctx.revert();
    };
  }, [enabled, itemCount]);

  const didDrag = () => dragMovedRef.current;

  return {
    sectionRef,
    pinHeightRef,
    containerRef,
    didDrag,
    visible: VISIBLE,
  };
}
