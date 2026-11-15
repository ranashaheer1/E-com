"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatDummyLayout,
  type FullFitDummyLayout,
} from "@/lib/fullFitLayout";
import { cn } from "@/lib/utils";

/** All 4 dummies together, or only the front (main) dummy */
type Scope = "all" | "front";

interface FullFitPadProps {
  value: FullFitDummyLayout;
  onChange: (next: FullFitDummyLayout) => void;
}

/**
 * Dummy pad
 * Scope: All 4 · First only
 * ←→↑↓ move · + zoom in · − zoom out
 */
export function FullFitPad({ value, onChange }: FullFitPadProps) {
  const [open, setOpen] = useState(true);
  const [scope, setScope] = useState<Scope>("all");
  const [copied, setCopied] = useState(false);

  const patch = useCallback(
    (partial: Partial<FullFitDummyLayout>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value]
  );

  const move = useCallback(
    (dx: number, dy: number) => {
      if (scope === "all") {
        patch({
          allX: round1(clamp(value.allX + dx, -45, 45)),
          allY: round1(clamp(value.allY + dy, -45, 45)),
        });
      } else {
        patch({
          frontX: round1(clamp(value.frontX + dx, -40, 40)),
          frontY: round1(clamp(value.frontY + dy, -40, 40)),
        });
      }
    },
    [patch, scope, value]
  );

  const zoom = useCallback(
    (dir: 1 | -1) => {
      const step = 0.04 * dir;
      if (scope === "all") {
        patch({
          allScale: round2(clamp(value.allScale + step, 0.4, 1.9)),
        });
      } else {
        patch({
          frontScale: round2(clamp(value.frontScale + step, 0.5, 1.8)),
        });
      }
    },
    [patch, scope, value]
  );

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formatDummyLayout(value));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }, [value]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "1") setScope("all");
      if (e.key === "2") setScope("front");
      if (e.key === "c" || e.key === "C") void copy();
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1, 0);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1, 0);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        move(0, -1);
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        move(0, 1);
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoom(1);
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoom(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy, move, zoom]);

  return (
    <div className="fixed bottom-24 left-3 z-[80] sm:bottom-28 sm:left-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mb-2 rounded-full border border-teal-deep/25 bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-deep shadow-lg"
      >
        {open ? "Hide dummy pad" : "Dummy pad"}
      </button>

      {open ? (
        <div className="w-[240px] rounded-2xl border border-teal-deep/15 bg-[#faf6f0]/96 p-3 shadow-2xl backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-deep/55">
            Dummy pad
          </p>

          <div className="mt-2 grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setScope("all")}
              className={cn(
                "rounded-lg px-2 py-2 text-[10px] uppercase tracking-[0.1em]",
                scope === "all"
                  ? "bg-teal-deep text-white"
                  : "bg-white/80 text-teal-deep/70"
              )}
            >
              1 · All 4
            </button>
            <button
              type="button"
              onClick={() => setScope("front")}
              className={cn(
                "rounded-lg px-2 py-2 text-[10px] uppercase tracking-[0.1em]",
                scope === "front"
                  ? "bg-coral text-white"
                  : "bg-white/80 text-teal-deep/70"
              )}
            >
              2 · First only
            </button>
          </div>

          <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-teal-deep/45">
            {scope === "all"
              ? "Moving / zooming all dummies"
              : "Moving / zooming main dummy only"}
          </p>

          <div className="mt-2 grid grid-cols-3 gap-1">
            <span />
            <PadBtn onClick={() => move(0, -1)}>↑</PadBtn>
            <span />
            <PadBtn onClick={() => move(-1, 0)}>←</PadBtn>
            <PadBtn onClick={() => move(0, 1)}>↓</PadBtn>
            <PadBtn onClick={() => move(1, 0)}>→</PadBtn>
          </div>

          <div className="mt-2 flex gap-1">
            <PadBtn className="flex-1" onClick={() => zoom(1)}>
              + Zoom in
            </PadBtn>
            <PadBtn className="flex-1" onClick={() => zoom(-1)}>
              − Zoom out
            </PadBtn>
          </div>

          <button
            type="button"
            onClick={() => void copy()}
            className="mt-2 w-full rounded-lg border border-teal-deep/15 bg-white py-2 text-[10px] uppercase tracking-[0.16em] text-teal-deep"
          >
            {copied ? "Copied" : "Copy numbers (C)"}
          </button>

          <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-teal-deep/5 p-2 text-[9px] leading-relaxed text-teal-deep/80">
            {formatDummyLayout(value)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function PadBtn({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-teal-deep/15 bg-white py-2 text-[11px] text-teal-deep shadow-sm active:scale-95",
        className
      )}
    >
      {children}
    </button>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
