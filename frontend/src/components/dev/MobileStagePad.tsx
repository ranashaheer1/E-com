"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatLayout,
  type MobileStageLayout,
} from "@/lib/mobileStageLayout";
import { cn } from "@/lib/utils";

type Target = "bg" | "product" | "bag";

interface MobileStagePadProps {
  label: string;
  value: MobileStageLayout;
  onChange: (next: MobileStageLayout) => void;
  /** Only render on phone (<768). Hidden on iPad + laptop. */
  enabled?: boolean;
}

const STEP = {
  zoom: 0.02,
  pos: 1,
  bag: 1,
} as const;

/**
 * Phone-only placement pad.
 * Keys: 1 bg · 2 product · 3 bag
 * Arrows nudge · +/− zoom · C copy numbers
 */
export function MobileStagePad({
  label,
  value,
  onChange,
  enabled = true,
}: MobileStagePadProps) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<Target>("product");
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const patch = useCallback(
    (partial: Partial<MobileStageLayout>) => {
      onChange({ ...value, ...partial });
    },
    [onChange, value]
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      if (target === "bg") {
        patch({
          bgPosX: Math.round(clamp(value.bgPosX + dx, 0, 100)),
          bgPosY: Math.round(clamp(value.bgPosY + dy, 0, 100)),
        });
      } else if (target === "product") {
        patch({
          productX: round1(clamp(value.productX + dx, -40, 40)),
          productY: round1(clamp(value.productY + dy, -5, 45)),
        });
      } else {
        // bag: arrows move on floor %
        const useRight = value.bagRight >= 0;
        if (useRight) {
          patch({
            bagRight: Math.round(clamp(value.bagRight - dx, 0, 90)),
            bagBottom: Math.round(clamp(value.bagBottom - dy, 0, 80)),
          });
        } else {
          patch({
            bagLeft: Math.round(clamp(value.bagLeft + dx, 0, 90)),
            bagBottom: Math.round(clamp(value.bagBottom - dy, 0, 80)),
          });
        }
      }
    },
    [patch, target, value]
  );

  const zoom = useCallback(
    (dir: 1 | -1) => {
      if (target === "bg") {
        patch({
          bgZoom: round2(clamp(value.bgZoom + dir * STEP.zoom, 0.7, 1.8)),
        });
      } else if (target === "product") {
        patch({
          productZoom: round2(
            clamp(value.productZoom + dir * STEP.zoom, 0.5, 1.8)
          ),
        });
      } else {
        patch({
          bagWidth: Math.round(clamp(value.bagWidth + dir * 2, 40, 120)),
        });
      }
    },
    [patch, target, value]
  );

  const copy = useCallback(async () => {
    const text = formatLayout(label, value);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }, [label, value]);

  useEffect(() => {
    if (!enabled || !phone || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") setTarget("bg");
      else if (e.key === "2") setTarget("product");
      else if (e.key === "3") setTarget("bag");
      else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudge(-STEP.pos, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nudge(STEP.pos, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        // productY up = smaller %; bgPosY up = smaller %
        nudge(0, target === "bag" ? STEP.pos : -STEP.pos);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        nudge(0, target === "bag" ? -STEP.pos : STEP.pos);
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoom(1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoom(-1);
      } else if (e.key.toLowerCase() === "c" && (e.metaKey || e.ctrlKey)) {
        // let native copy work on selection; bare C copies layout
      } else if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        void copy();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy, enabled, nudge, open, phone, target, zoom]);

  if (!enabled || !phone) return null;

  return (
    <div className="pointer-events-none fixed top-[4.5rem] left-2 right-2 z-[120] flex justify-center">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-teal-deep/20 bg-[#f7f4ef]/96 p-3 shadow-[0_12px_40px_rgba(30,24,18,0.28)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-deep">
            {label} · phone pad
          </p>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-teal-deep/20 bg-white px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-teal-deep"
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>

        {open ? (
          <>
            <div className="mt-2 flex gap-1">
              {(
                [
                  ["bg", "1 · BG"],
                  ["product", "2 · Product"],
                  ["bag", "3 · Bag"],
                ] as const
              ).map(([id, title]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTarget(id)}
                  className={cn(
                    "flex-1 rounded-full px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition",
                    target === id
                      ? "bg-teal-deep text-white"
                      : "bg-white text-teal-deep border border-teal-deep/15"
                  )}
                >
                  {title}
                </button>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <PadBtn label="←" onClick={() => nudge(-STEP.pos, 0)} />
              <PadBtn label="↑" onClick={() => nudge(0, target === "bag" ? STEP.pos : -STEP.pos)} />
              <PadBtn label="↓" onClick={() => nudge(0, target === "bag" ? -STEP.pos : STEP.pos)} />
              <PadBtn label="→" onClick={() => nudge(STEP.pos, 0)} />
              <PadBtn label="Zoom −" onClick={() => zoom(-1)} className="col-span-2" />
              <PadBtn label="Zoom +" onClick={() => zoom(1)} className="col-span-2" />
            </div>

            <pre className="mt-2 max-h-28 overflow-auto rounded-lg bg-teal-deep/[0.06] p-2 text-[10px] leading-relaxed text-teal-deep">
              {formatLayout(label, value)}
            </pre>

            <button
              type="button"
              onClick={() => void copy()}
              className="mt-2 flex h-9 w-full items-center justify-center rounded-full bg-teal-deep text-[11px] font-semibold uppercase tracking-[0.16em] text-white"
            >
              {copied ? "Copied" : "Copy numbers (C)"}
            </button>

            <p className="mt-1.5 text-center text-[9px] tracking-[0.08em] text-teal-deep/55">
              Keys: 1/2/3 · arrows · +/− · C copy · phone only
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function PadBtn({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-teal-deep/15 bg-white py-2 text-[11px] font-semibold text-teal-deep",
        className
      )}
    >
      {label}
    </button>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
