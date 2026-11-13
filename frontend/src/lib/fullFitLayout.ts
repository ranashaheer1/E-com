/**
 * FULL FIT — locked desktop frames + responsive dummy boxes.
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
  /** Slot 0 = main (right), then trailing left */
  dummies: DummyBox[];
};

/** Only the last visible dummy is blurred — ~35% of max. */
export const LAST_SLOT_BLUR_PCT = 35;
export const SLOT_BLUR_MAX_PX = 12;

export function slotBlurPx(slot: number, totalSlots = 4) {
  if (totalSlots <= 1) return 0;
  if (slot !== totalSlots - 1) return 0;
  return (LAST_SLOT_BLUR_PCT / 100) * SLOT_BLUR_MAX_PX;
}

export type FullFitBreakpoint = "phone" | "tablet" | "desktop";

/** How many parade dummies to show per viewport */
export const FULLFIT_VISIBLE_SLOTS: Record<FullFitBreakpoint, number> = {
  phone: 2,
  tablet: 3,
  desktop: 4,
};

/** Phone — main + one trailing (short screens) */
export const FULLFIT_DUMMIES_PHONE: DummyBox[] = [
  { x: 38, y: 2, w: 56, h: 94 },
  { x: 4, y: 16, w: 42, h: 74 },
];

/** iPad — three-deep ladder */
export const FULLFIT_DUMMIES_TABLET: DummyBox[] = [
  { x: 46, y: 0, w: 48, h: 96 },
  { x: 20, y: 12, w: 34, h: 80 },
  { x: 2, y: 22, w: 26, h: 64 },
];

/** Locked desktop frames + four dummy squares (main on the right) */
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

export function dummiesForBreakpoint(bp: FullFitBreakpoint): DummyBox[] {
  if (bp === "phone") return FULLFIT_DUMMIES_PHONE;
  if (bp === "tablet") return FULLFIT_DUMMIES_TABLET;
  return FULL_FIT_SECTION_DEFAULT.dummies;
}
