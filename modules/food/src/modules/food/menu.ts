// The menu, typed. The data itself lives in menu.json so the change scripts
// can add, remove and reprice items without touching code. The items there
// start as demo items: replace them with the client's real menu and prices,
// then set demoMenu to false. Pre-ordering is optional (preOrder.enabled);
// without it the menu is a plain list, grouped by each item's category.
import data from './menu.json';

/** A pre-order day id from preOrder.days, e.g. 'sat'. */
export type Day = string;
export type Tag = 'vegan' | 'gluten-free';
export type Art = 'loaf' | 'croissant' | 'bun' | 'cookie' | 'baguette' | 'tart';

export interface Bake {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Optional heading to group the plain menu under, e.g. 'Breakfast'. */
  category?: string;
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
  /** Ordering ahead for pickup on set days (e.g. a weekend bakery). Off for an everyday menu. */
  preOrder: { enabled: boolean; label: string; orderBy: string; days: { id: Day; label: string }[]; pickupTimes: string[] };
  maxEach: number;
  items: Bake[];
}

const menu = data as Menu;
export const { demoMenu, section, preOrder, items: bakes } = menu;
export const MAX_EACH = menu.maxEach;
