export type Realm = "junior" | "guardian";

export interface Question {
  problem: string;
  options: string[];
  answer: string;
  visuals: {
    type: "emoji" | "block";
    items1: string[];
    items2: string[];
    operator: string;
  };
}

export interface MathNode {
  id: string;
  title: string;
  mathType: "addition" | "subtraction" | "multiplication" | "division";
  questions: Question[];
  reward: number;
  unlocked: boolean;
  completed: boolean;
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
