export type NavCategory =
  | "all"
  | "shirts"
  | "pants"
  | "hoodies"
  | "shoes"
  | "jackets";

export type SectionDef = {
  id: string;
  navId: NavCategory | "trousers" | "t-shirts";
  title: string;
  subtitle: string;
  categoryKey: string;
  columns?: 3 | 4;
  swipeable?: boolean;
  limit?: number;
};

export const HANGING_SECTIONS: SectionDef[] = [
  {
    id: "shirts",
    navId: "shirts",
    title: "SHIRTS",
    subtitle: "Studio curved rail — swipe through the drop, pick a size, add to bag.",
    categoryKey: "shirts",
    columns: 3,
    limit: 10,
  },
  {
    id: "pants",
    navId: "pants",
    title: "PANTS",
    subtitle: "3 denim pieces on the rail — hover to fade into the back view.",
    categoryKey: "pants",
    columns: 3,
    limit: 6,
  },
  {
    id: "trousers",
    navId: "trousers",
    title: "TROUSERS",
    subtitle: "3 wide-leg pieces on the rail — hover to fade into the back view.",
    categoryKey: "trousers",
    columns: 3,
    limit: 3,
  },
  {
    id: "hoodies",
    navId: "hoodies",
    title: "HOODIES",
    subtitle: "Fleece on the rail — click to focus, front/back, then buy.",
    categoryKey: "hoodies",
    columns: 3,
    limit: 6,
  },
  {
    id: "jackets",
    navId: "jackets",
    title: "JACKETS",
    subtitle: "On the rail with hangers — hover for front and back.",
    categoryKey: "jackets",
    columns: 3,
    limit: 6,
  },
];

export const CATEGORY_PATH: Record<Exclude<NavCategory, "all">, string> = {
  shirts: "/shirts",
  pants: "/pants",
  hoodies: "/hoodies",
  shoes: "/shoes",
  jackets: "/jackets",
};

export const PATH_TO_CATEGORY: Record<string, NavCategory> = {
  "/": "all",
  "/shirts": "shirts",
  "/pants": "pants",
  "/hoodies": "hoodies",
  "/shoes": "shoes",
  "/jackets": "jackets",
};

export function sectionsForCategory(category: NavCategory): SectionDef[] {
  if (category === "all") return HANGING_SECTIONS;
  if (category === "shoes") return [];
  return HANGING_SECTIONS.filter((s) => s.navId === category);
}

export function categoryPageTitle(category: NavCategory) {
  if (category === "all") return "STORE";
  return category.replace("-", " ").toUpperCase();
}

export function pathForCategory(category: NavCategory) {
  if (category === "all") return "/";
  return CATEGORY_PATH[category];
}
