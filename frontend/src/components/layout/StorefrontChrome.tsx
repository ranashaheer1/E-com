"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { BottomPillNav } from "@/components/layout/BottomPillNav";

export function StorefrontChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <SiteFrame>{children}</SiteFrame>
      <BottomPillNav />
    </>
  );
}
