/**
 * Winter FULL FIT recipes — match live catalog by product name (case-insensitive).
 * Jacket looks always include a tee (nested under outer via side-panel scroll).
 * Hoodie looks: hoodie + pants/trousers + shoes (no tee required).
 * Same shoes / bottoms can appear in multiple looks — reuse is fine.
 */

export type LookSlotKind = "outer" | "tee" | "pants" | "shoes";

export type WinterLookRecipe = {
  id: string;
  label: string;
  /** Short line under LOOK N */
  vibe: string;
  /** Jacket | hoodie — drives tee nesting in the shop rail */
  outerKind: "jacket" | "hoodie";
  /** Name substrings matched against Product.name */
  match: {
    outer: string;
    tee?: string;
    pants: string;
    shoes: string;
  };
};

export const WINTER_LOOKS: WinterLookRecipe[] = [
  /* —— pants —— */
  {
    id: "look-01",
    label: "LOOK 01",
    vibe: "Night puffer stack",
    outerKind: "jacket",
    match: {
      outer: "Black Puffer",
      tee: "Coral Mark",
      pants: "Black Baggy",
      shoes: "Chicago High",
    },
  },
  {
    id: "look-02",
    label: "LOOK 02",
    vibe: "Varsity clean",
    outerKind: "jacket",
    match: {
      outer: "Night Varsity",
      tee: "Block Mark",
      pants: "Indigo Straight",
      shoes: "Force White",
    },
  },
  {
    id: "look-03",
    label: "LOOK 03",
    vibe: "Leather goldline",
    outerKind: "jacket",
    match: {
      outer: "Goldline Leather",
      tee: "Orbit Tee",
      pants: "Heather Slim",
      shoes: "Samba Classic",
    },
  },
  {
    id: "look-04",
    label: "LOOK 04",
    vibe: "Field olive set",
    outerKind: "jacket",
    match: {
      outer: "Olive Field",
      tee: "Olive 07",
      pants: "Olive Carpenter",
      shoes: "Olive Cage",
    },
  },
  {
    id: "look-05",
    label: "LOOK 05",
    vibe: "Indigo trucker",
    outerKind: "jacket",
    match: {
      outer: "Indigo Trucker",
      tee: "Eighty-Eight",
      pants: "Acid Baggy",
      shoes: "Teal Low",
    },
  },
  {
    id: "look-06",
    label: "LOOK 06",
    vibe: "Cream coach layer",
    outerKind: "jacket",
    match: {
      outer: "Cream Coach",
      tee: "Peak Line",
      pants: "Cocoa Work",
      shoes: "Bounce Run",
    },
  },
  {
    id: "look-07",
    label: "LOOK 07",
    vibe: "Pink R fleece",
    outerKind: "hoodie",
    match: {
      outer: "Pink R Hoodie",
      pants: "Black Baggy",
      shoes: "Bred Toe",
    },
  },
  {
    id: "look-08",
    label: "LOOK 08",
    vibe: "Unexplored maroon",
    outerKind: "hoodie",
    match: {
      outer: "Unexplored Hoodie",
      pants: "Cocoa Work",
      shoes: "Royal High",
    },
  },
  {
    id: "look-09",
    label: "LOOK 09",
    vibe: "Sail sky fleece",
    outerKind: "hoodie",
    match: {
      outer: "Sail Hoodie",
      pants: "Acid Baggy",
      shoes: "Teal Low",
    },
  },
  {
    id: "look-10",
    label: "LOOK 10",
    vibe: "Furioso cream",
    outerKind: "hoodie",
    match: {
      outer: "Furioso Hoodie",
      pants: "Heather Slim",
      shoes: "Force White",
    },
  },

  /* —— trousers (shoes freely reused) —— */
  {
    id: "look-11",
    label: "LOOK 11",
    vibe: "Coach + cream linen",
    outerKind: "jacket",
    match: {
      outer: "Cream Coach",
      tee: "Soft Rib",
      pants: "Cream Linen",
      shoes: "Force White",
    },
  },
  {
    id: "look-12",
    label: "LOOK 12",
    vibe: "Leather + charcoal pleat",
    outerKind: "jacket",
    match: {
      outer: "Goldline Leather",
      tee: "Core Tee",
      pants: "Charcoal Pleat",
      shoes: "Samba Classic",
    },
  },
  {
    id: "look-13",
    label: "LOOK 13",
    vibe: "Varsity + navy tailor",
    outerKind: "jacket",
    match: {
      outer: "Night Varsity",
      tee: "Strike Tee",
      pants: "Navy Tailor",
      shoes: "Chicago High",
    },
  },
  {
    id: "look-14",
    label: "LOOK 14",
    vibe: "Olive field + khaki chino",
    outerKind: "jacket",
    match: {
      outer: "Olive Field",
      tee: "Olive 07",
      pants: "Khaki Chino",
      shoes: "Olive Cage",
    },
  },
  {
    id: "look-15",
    label: "LOOK 15",
    vibe: "Puffer + black wide draw",
    outerKind: "jacket",
    match: {
      outer: "Black Puffer",
      tee: "Coral Mark",
      pants: "Black Wide Draw",
      shoes: "Bred Toe",
    },
  },
  {
    id: "look-16",
    label: "LOOK 16",
    vibe: "Trucker + espresso wide",
    outerKind: "jacket",
    match: {
      outer: "Indigo Trucker",
      tee: "Eighty-Eight",
      pants: "Espresso Wide",
      shoes: "Bounce Run",
    },
  },
  {
    id: "look-17",
    label: "LOOK 17",
    vibe: "Sail + cream linen",
    outerKind: "hoodie",
    match: {
      outer: "Sail Hoodie",
      pants: "Cream Linen",
      shoes: "Samba Classic",
    },
  },
  {
    id: "look-18",
    label: "LOOK 18",
    vibe: "Furioso + charcoal pleat",
    outerKind: "hoodie",
    match: {
      outer: "Furioso Hoodie",
      pants: "Charcoal Pleat",
      shoes: "Force White",
    },
  },
  {
    id: "look-19",
    label: "LOOK 19",
    vibe: "Pink R + khaki chino",
    outerKind: "hoodie",
    match: {
      outer: "Pink R Hoodie",
      pants: "Khaki Chino",
      shoes: "Teal Low",
    },
  },
  {
    id: "look-20",
    label: "LOOK 20",
    vibe: "Unexplored + navy tailor",
    outerKind: "hoodie",
    match: {
      outer: "Unexplored Hoodie",
      pants: "Navy Tailor",
      shoes: "Royal High",
    },
  },
];

export function findByNameHint<T extends { name: string }>(
  products: T[],
  hint: string | undefined
): T | undefined {
  if (!hint) return undefined;
  const q = hint.toLowerCase();
  return products.find((p) => p.name.toLowerCase().includes(q));
}
