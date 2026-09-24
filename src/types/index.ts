export type Realm = "junior" | "guardian";

export interface MathNode {
  id: string;
  title: string;
  mathType: "addition" | "subtraction" | "multiplication" | "division";
  unlocked: boolean;
  completed: boolean;
  caption: string; // shown under the title on the map, e.g. "Share fairly"
  lockedCaption?: string; // shown instead while locked, e.g. "After Pebble Meadows"
  x: number; // percentage from left
  y: number; // percentage from top
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic";
  equipped: boolean;
  icon: string;
}
