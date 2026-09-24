import { MathNode, InventoryItem } from "../types";

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

// The Guardian realm's old division questions, kept until division is rebuilt
// the way addition, subtraction and multiplication were. (Its old
// multiplication questions, which drew 3 × 4 as 3 gears next to 4 gears, are
// gone — Windmill Peaks replaces them.)
export const initialGuardianNodes: MathNode[] = [
  {
    id: "g2",
    title: "Crystal Cavern",
    mathType: "division",
    questions: [
      {
        problem: "15 ÷ 3",
        options: ["3", "4", "5", "6"],
        answer: "5",
        visuals: {
          type: "block",
          items1: ["💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎"],
          items2: ["🛒", "🛒", "🛒"],
          operator: "÷",
        },
      },
      {
        problem: "12 ÷ 4",
        options: ["2", "3", "4", "5"],
        answer: "3",
        visuals: {
          type: "block",
          items1: ["💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎", "💎"],
          items2: ["🛒", "🛒", "🛒", "🛒"],
          operator: "÷",
        },
      },
    ],
    reward: 30,
    unlocked: true,
    completed: false,
    x: 30,
    y: 62,
  },
  {
    id: "g4",
    title: "Sun-Shard Spire",
    mathType: "division",
    questions: [
      {
        problem: "24 ÷ 4",
        options: ["4", "5", "6", "8"],
        answer: "6",
        visuals: {
          type: "block",
          items1: ["🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟"],
          items2: ["🏺", "🏺", "🏺", "🏺"],
          operator: "÷",
        },
      },
      {
        problem: "20 ÷ 5",
        options: ["3", "4", "5", "6"],
        answer: "4",
        visuals: {
          type: "block",
          items1: ["🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟", "🌟"],
          items2: ["🏺", "🏺", "🏺", "🏺", "🏺"],
          operator: "÷",
        },
      },
    ],
    reward: 50,
    unlocked: false,
    completed: false,
    x: 70,
    y: 32,
  },
];
