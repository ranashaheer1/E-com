"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  PATH_TO_CATEGORY,
  pathForCategory,
  type NavCategory,
} from "@/lib/nav";

export type { NavCategory };

interface CategoryNavContextValue {
  activeCategory: NavCategory;
  openCategory: (category: NavCategory) => void;
}

const CategoryNavContext = createContext<CategoryNavContextValue | undefined>(
  undefined
);

export function CategoryNavProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const activeCategory: NavCategory = useMemo(() => {
    return PATH_TO_CATEGORY[pathname] || "all";
  }, [pathname]);

  const openCategory = useCallback(
    (category: NavCategory) => {
      const url = pathForCategory(category);
      if (pathname === url) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      router.push(url);
    },
    [pathname, router]
  );

  const value = useMemo(
    () => ({ activeCategory, openCategory }),
    [activeCategory, openCategory]
  );

  return (
    <CategoryNavContext.Provider value={value}>{children}</CategoryNavContext.Provider>
  );
}

export function useCategoryNav() {
  const ctx = useContext(CategoryNavContext);
  if (!ctx) throw new Error("useCategoryNav must be used within CategoryNavProvider");
  return ctx;
}
