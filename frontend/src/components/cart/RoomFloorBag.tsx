"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ShopBagButton } from "@/components/cart/ShopBagButton";
import { cn } from "@/lib/utils";

/**
 * Anchors the kraft bag to the Drop wall photo's cover crop so left/bottom %
 * stay on the same floor spot in fullscreen and windowed layouts.
 * Matches `.drop-room-photo`: 1280×720, object-fit cover, object-position center 55%.
 *
 * On tall phone viewports the cover box is much wider than the screen — bag %
 * would land off-canvas — so we clamp into the visible room instead.
 */
const ROOM_AR = 1280 / 720;
const POS_X = 0.5;
const POS_Y = 0.55;

type CoverBox = { left: number; top: number; width: number; height: number };

export type BagOverride = {
  left?: number;
  right?: number;
  bottom: number;
  width: number;
};

function coverBox(cw: number, ch: number): CoverBox {
  let width: number;
  let height: number;
  if (cw / ch > ROOM_AR) {
    width = cw;
    height = cw / ROOM_AR;
  } else {
    height = ch;
    width = ch * ROOM_AR;
  }
  return {
    left: (cw - width) * POS_X,
    top: (ch - height) * POS_Y,
    width,
    height,
  };
}

interface RoomFloorBagProps {
  /** Phone pad override — when set on narrow, replaces default % placement */
  mobileBag?: BagOverride | null;
}

export function RoomFloorBag({ mobileBag = null }: RoomFloorBagProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<CoverBox>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const [narrow, setNarrow] = useState(false);
  const [tablet, setTablet] = useState(false);

  useLayoutEffect(() => {
    const room = layerRef.current?.closest(".virtual-room") as HTMLElement | null;
    if (!room) return;

    const update = () => {
      const cw = room.clientWidth;
      const ch = room.clientHeight;
      setBox(coverBox(cw, ch));
      const nextNarrow = cw < 1024;
      const nextTablet = cw >= 768 && cw < 1024;
      setNarrow((v) => (v === nextNarrow ? v : nextNarrow));
      setTablet((v) => (v === nextTablet ? v : nextTablet));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(room);
    return () => ro.disconnect();
  }, []);

  const bagClass = !narrow
    ? "pointer-events-auto absolute bottom-[7%] left-[6%] w-[11%] min-w-[96px] max-w-[168px]"
    : mobileBag
      ? "pointer-events-auto absolute"
      : tablet
        ? "pointer-events-auto absolute bottom-[30%] right-[5%] left-auto w-[76px]"
        : "pointer-events-auto absolute bottom-[38%] right-[4%] left-auto w-[64px]";

  const bagStyle =
    narrow && mobileBag
      ? {
          bottom: `${mobileBag.bottom}%`,
          width: mobileBag.width,
          ...(mobileBag.right != null && mobileBag.right >= 0
            ? { right: `${mobileBag.right}%`, left: "auto" as const }
            : { left: `${mobileBag.left ?? 4}%`, right: "auto" as const }),
        }
      : undefined;

  return (
    <div
      ref={layerRef}
      className="pointer-events-none absolute z-[26]"
      style={
        narrow
          ? { left: 0, top: 0, width: "100%", height: "100%" }
          : {
              left: box.left,
              top: box.top,
              width: box.width || "100%",
              height: box.height || "100%",
            }
      }
    >
      <ShopBagButton className={cn(bagClass)} style={bagStyle} />
    </div>
  );
}
