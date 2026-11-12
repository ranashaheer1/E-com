"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

/**
 * Shirts keeps a tall first stage, but the page scrolls so the site footer
 * still appears under the rail (no longer a footer-less immersive shell).
 */
const TALL_STAGE_PATHS = new Set(["/shirts"]);

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const tallStage = TALL_STAGE_PATHS.has(pathname);

  return (
    <>
      <main
        className={cn(
          tallStage ? "min-h-[calc(100dvh-4rem)] pb-8" : "min-h-[70vh] pb-28"
        )}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
