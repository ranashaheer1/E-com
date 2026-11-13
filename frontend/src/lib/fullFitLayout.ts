/**
 * FULL FIT — locked section frames + per-dummy boxes inside stage.
 */

export type FullFitFrame = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** One dummy box — coords % of stage (x/y/w/h) */
export type DummyBox = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type FullFitSectionLayout = {
  stage: FullFitFrame;
  shop: FullFitFrame;
  /** Slot 0 = main (right), then 1→2→3 trailing left */
  dummies: [DummyBox, DummyBox, DummyBox, DummyBox];
};

/** Only the last (4th) dummy is blurred — ~35% of max. */
export const LAST_SLOT_BLUR_PCT = 35;
export const SLOT_BLUR_MAX_PX = 12;

export function slotBlurPx(slot: number, totalSlots = 4) {
  if (slot !== totalSlots - 1) return 0;
  return (LAST_SLOT_BLUR_PCT / 100) * SLOT_BLUR_MAX_PX;
}

/** Locked frames + locked dummy squares (main on the right) */
export const FULL_FIT_SECTION_DEFAULT: FullFitSectionLayout = {
  stage: { x: 9.13, y: 32, w: 63.54, h: 775 },
  shop: { x: 75.13, y: 28, w: 22.82, h: 776 },
  dummies: [
    { x: 49.38, y: -3.74, w: 34, h: 98.58 },
    { x: 27.54, y: 12.42, w: 26, h: 75.16 },
    { x: 11.59, y: 19.94, w: 22, h: 60.13 },
    { x: 2.64, y: 28.03, w: 18, h: 43.94 },
  ],
};
