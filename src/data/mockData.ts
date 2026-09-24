import { InventoryItem } from "../types";

export const initialInventory: InventoryItem[] = [
  {
    id: "quill",
    name: "Scribe's Quill",
    description: "Writes math equations in glowing sun-ink.",
    rarity: "common",
    equipped: true,
    icon: "🖋️",
  },
  {
    id: "compass",
    name: "Solar Compass",
    description: "Points toward hidden caches of Star Shards.",
    rarity: "rare",
    equipped: false,
    icon: "🧭",
  },
  {
    id: "abacus",
    name: "Golden Abacus",
    description: "Beads click with solar-powered calculation logic.",
    rarity: "rare",
    equipped: false,
    icon: "🧮",
  },
  {
    id: "shield",
    name: "Leaf Shield",
    description: "A defensive shield woven from solar oak leaves.",
    rarity: "epic",
    equipped: false,
    icon: "🛡️",
  },
  {
    id: "focus_orb",
    name: "Logic Crystal",
    description: "A pulsing crystal sphere that sharpens calculation.",
    rarity: "epic",
    equipped: false,
    icon: "🔮",
  },
  {
    id: "cape",
    name: "Numerator Cape",
    description: "Allows the wearer to float over arithmetic gaps.",
    rarity: "common",
    equipped: false,
    icon: "🧥",
  },
];
