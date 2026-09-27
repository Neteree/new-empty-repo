// The menu and pre-order details, typed. The data itself lives in menu.json so
// the change scripts can add, remove and reprice items without touching code.
// The items there start as the Early Crust demo's: replace them with the
// client's real menu and prices, then set demoMenu to false.
import data from './menu.json';

export type Day = 'sat' | 'sun';
export type Tag = 'vegan' | 'gluten-free';
export type Art = 'loaf' | 'croissant' | 'bun' | 'cookie' | 'baguette' | 'tart';

export interface Bake {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Optional illustration. */
  art?: Art;
  tags: Tag[];
  days: Day[];
  soldOut?: Day[];
  note?: string;
}

interface Menu {
  /** True while these are still the demo items. */
  demoMenu: boolean;
  /** Wording for the menu section on the home page. */
  section: { note: string; title: string; intro: string };
  weekend: { label: string; orderBy: string; days: { id: Day; label: string }[]; pickupTimes: string[] };
  maxEach: number;
  items: Bake[];
}

const menu = data as Menu;
export const { demoMenu, section, weekend, items: bakes } = menu;
export const MAX_EACH = menu.maxEach;
