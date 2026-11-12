"use client";

import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_PIECE,
  formatPieces,
  getPiece,
  type PieceTweak,
} from "@/lib/mobileStageLayout";
import { cn } from "@/lib/utils";

interface MobilePiecePadProps {
  label: string;
  count: number;
  /** Currently focused carousel index — pad can follow or pick freely */
  activeIndex?: number;
  value: Record<number, PieceTweak>;
  onChange: (next: Record<number, PieceTweak>) => void;
  enabled?: boolean;
}

const STEP = { zoom: 0.02, pos: 1 } as const;

/**
 * Phone-only: tune ONE product at a time — size + location.
 * Keys: [ ] prev/next piece · arrows move · +/− zoom · C copy
 */
export function MobilePiecePad({
  label,
  count,
  activeIndex = 0,
  value,
  onChange,
  enabled = true,
}: MobilePiecePadProps) {
  const [open, setOpen] = useState(true);
  const [follow, setFollow] = useState(true);
  const [index, setIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (follow && count > 0) {
      setIndex(((activeIndex % count) + count) % count);
    }
  }, [activeIndex, count, follow]);

  const piece = getPiece(value, index);

  const setPiece = useCallback(
    (partial: Partial<PieceTweak>) => {
      const cur = getPiece(value, index);
      onChange({
        ...value,
        [index]: {
          zoom: partial.zoom ?? cur.zoom,
          x: partial.x ?? cur.x,
          y: partial.y ?? cur.y,
        },
      });
    },
    [index, onChange, value]
  );

  const nudge = useCallback(
    (dx: number, dy: number) => {
      setPiece({
        x: round1(clamp(piece.x + dx, -50, 50)),
        y: round1(clamp(piece.y + dy, -40, 40)),
      });
    },
    [piece.x, piece.y, setPiece]
  );

  const zoom = useCallback(
    (dir: 1 | -1) => {
      setPiece({
        zoom: round2(clamp(piece.zoom + dir * STEP.zoom, 0.4, 2.2)),
      });
    },
    [piece.zoom, setPiece]
  );

  const stepIndex = useCallback(
    (dir: -1 | 1) => {
      if (count < 1) return;
      setFollow(false);
      setIndex((i) => (i + dir + count) % count);
    },
    [count]
  );

  const copy = useCallback(async () => {
    const text = formatPieces(label, count, value);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }, [count, label, value]);

  const resetPiece = useCallback(() => {
    const next = { ...value };
    delete next[index];
    onChange(next);
  }, [index, onChange, value]);

  useEffect(() => {
    if (!enabled || !phone || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "[") {
        e.preventDefault();
        stepIndex(-1);
      } else if (e.key === "]") {
        e.preventDefault();
        stepIndex(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        nudge(-STEP.pos, 0);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nudge(STEP.pos, 0);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        nudge(0, -STEP.pos);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        nudge(0, STEP.pos);
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoom(1);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoom(-1);
      } else if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        void copy();
      } else if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        resetPiece();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [copy, enabled, nudge, open, phone, resetPiece, stepIndex, zoom]);

  if (!enabled || !phone || count < 1) return null;

  return (
    <div className="pointer-events-none fixed bottom-[5.75rem] left-2 right-2 z-[121] flex justify-center">
      <div className="pointer-events-auto w-full max-w-sm rounded-2xl border border-teal-deep/20 bg-[#f7f4ef]/96 p-3 shadow-[0_12px_40px_rgba(30,24,18,0.28)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-deep">
            {label} · piece pad
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
            <div className="mt-2 flex items-center gap-1.5">
              <PadBtn label="[ prev" onClick={() => stepIndex(-1)} />
              <div className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-lg border border-teal-deep/15 bg-white px-2 py-1.5">
                <p className="text-[9px] uppercase tracking-[0.16em] text-teal-deep/55">
                  Product
                </p>
                <p className="font-display text-base text-teal-deep">
                  {index + 1} / {count}
                </p>
              </div>
              <PadBtn label="next ]" onClick={() => stepIndex(1)} />
            </div>

            <button
              type="button"
              onClick={() => setFollow((v) => !v)}
              className={cn(
                "mt-1.5 w-full rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
                follow
                  ? "bg-teal-deep text-white"
                  : "border border-teal-deep/20 bg-white text-teal-deep"
              )}
            >
              {follow ? "Following carousel" : "Unlocked · pick with [ ]"}
            </button>

            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <PadBtn label="←" onClick={() => nudge(-STEP.pos, 0)} />
              <PadBtn label="↑" onClick={() => nudge(0, -STEP.pos)} />
              <PadBtn label="↓" onClick={() => nudge(0, STEP.pos)} />
              <PadBtn label="→" onClick={() => nudge(STEP.pos, 0)} />
              <PadBtn label="Size −" onClick={() => zoom(-1)} className="col-span-2" />
              <PadBtn label="Size +" onClick={() => zoom(1)} className="col-span-2" />
            </div>

            <pre className="mt-2 max-h-32 overflow-auto rounded-lg bg-teal-deep/[0.06] p-2 text-[10px] leading-relaxed text-teal-deep">
              {`SELECTED [${index}]
zoom: ${piece.zoom}
x: ${piece.x}
y: ${piece.y}

${formatPieces(label, count, value)}`}
            </pre>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={resetPiece}
                className="flex h-9 items-center justify-center rounded-full border border-teal-deep/20 bg-white text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-deep"
              >
                Reset (R)
              </button>
              <button
                type="button"
                onClick={() => void copy()}
                className="flex h-9 items-center justify-center rounded-full bg-teal-deep text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
              >
                {copied ? "Copied" : "Copy (C)"}
              </button>
            </div>

            <p className="mt-1.5 text-center text-[9px] tracking-[0.08em] text-teal-deep/55">
              [ ] piece · arrows move · +/− size · C copy · phone only
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

export type { PieceTweak };
export { EMPTY_PIECE };
