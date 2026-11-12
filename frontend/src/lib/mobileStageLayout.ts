/** Phone-only stage placement values — tune with MobileStagePad, then lock here. */

export type MobileStageLayout = {
  /** Background image scale (1 = cover normal) */
  bgZoom: number;
  /** object-position Y % (0 top → 100 bottom) */
  bgPosY: number;
  /** object-position X % */
  bgPosX: number;
  /** Product size multiplier */
  productZoom: number;
  /** Product vertical — % of stage height from top (hang origin) */
  productY: number;
  /** Product horizontal shift — % of stage width (− left · + right) */
  productX: number;
  /** Bag distance from left edge % (use with bagBottom; set bagRight −1 to use left) */
  bagLeft: number;
  /** Bag distance from right edge % (−1 = use bagLeft) */
  bagRight: number;
  /** Bag distance from bottom % */
  bagBottom: number;
  /** Bag width in px */
  bagWidth: number;
};

export const DROP_MOBILE_LAYOUT: MobileStageLayout = {
  bgZoom: 1,
  bgPosY: 42,
  bgPosX: 50,
  productZoom: 1.12,
  productY: 23,
  productX: 0,
  bagLeft: -1,
  bagRight: 4,
  bagBottom: 28,
  bagWidth: 64,
};

export const SHIRTS_MOBILE_LAYOUT: MobileStageLayout = {
  bgZoom: 1,
  bgPosY: 45,
  bgPosX: 50,
  productZoom: 1.1,
  productY: 24,
  productX: -1,
  bagLeft: 3,
  bagRight: -1,
  bagBottom: 2,
  bagWidth: 62,
};

/**
 * iPad / iPad Pro shirts hang — locked, no pad.
 * Includes portrait ~1024×1366 (iPad Pro 12.9) which often misses max-width:1023 MQs.
 * productY is % of stage height from top (smaller = higher).
 */
export const SHIRTS_IPAD_LAYOUT = {
  productZoom: 1.22,
  /** Raised into upper stage (clears Shirts title, stays on-screen) */
  productY: 10,
  productX: 0,
  /** Stage top offset as % of viewport height */
  stageTop: 4,
} as const;

/**
 * Desktop / laptop hang framing — keeps crest shirt in the upper stage
 * even when the window is fullscreen-tall (vmin clamp, not raw arc drift).
 */
export const SHIRTS_DESKTOP_LAYOUT = {
  /** Target hang origin as % of stage height from top */
  productY: 14,
  /** Clamp band (% of stage height) */
  productYMin: 8,
  productYMax: 22,
  /** Extra upward nudge after arc (% of stage height) */
  arcLift: 18,
} as const;

/** Per-product nudge on phone — tune with MobilePiecePad */
export type PieceTweak = {
  zoom: number;
  x: number;
  y: number;
};

export const EMPTY_PIECE: PieceTweak = { zoom: 1, x: 0, y: 0 };

export function getPiece(
  map: Record<number, PieceTweak>,
  index: number
): PieceTweak {
  return map[index] ?? EMPTY_PIECE;
}

export function formatLayout(label: string, layout: MobileStageLayout) {
  return `${label}
bgZoom: ${layout.bgZoom}
bgPosX: ${layout.bgPosX}
bgPosY: ${layout.bgPosY}
productZoom: ${layout.productZoom}
productY: ${layout.productY}
productX: ${layout.productX}
bagLeft: ${layout.bagLeft}
bagRight: ${layout.bagRight}
bagBottom: ${layout.bagBottom}
bagWidth: ${layout.bagWidth}`;
}

export function formatPieces(
  label: string,
  count: number,
  map: Record<number, PieceTweak>
) {
  const lines = [`${label} PIECES`];
  for (let i = 0; i < count; i++) {
    const p = getPiece(map, i);
    lines.push(
      `[${i}] zoom: ${p.zoom}  x: ${p.x}  y: ${p.y}`
    );
  }
  return lines.join("\n");
}
