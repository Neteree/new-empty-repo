// The price list as it's shown: items in their groups, in the order the
// groups first appear. Used by every layout in PriceList.svelte.
import type { Picture } from '../../lib/images';

export interface ShownItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  /** The price as shown, e.g. 'From $120', or '' for none (see priceText in prices.ts). */
  price: string;
  image: Picture | null;
  /** Its Stripe payment link, for a "Buy" button, or '' for none. */
  link: string;
}

export interface Group {
  category: string;
  list: ShownItem[];
  /** Any item in it has a price. */
  priced: boolean;
  /** Any item in it has a photo. */
  cards: boolean;
  /** Just names: no prices, photos or descriptions (occasions, services). */
  tags: boolean;
  /** The first photo in the group, for layouts that show one per group. */
  photo: Picture | null;
}

export function groupItems(items: ShownItem[]): Group[] {
  const map = new Map<string, ShownItem[]>();
  for (const item of items) map.set(item.category ?? '', [...(map.get(item.category ?? '') ?? []), item]);
  return [...map].map(([category, list]) => ({
    category,
    list,
    priced: list.some((item) => item.price),
    cards: list.some((item) => item.image),
    tags: !list.some((item) => item.price || item.image || item.description),
    photo: list.find((item) => item.image)?.image ?? null,
  }));
}

export type Layout = 'cards' | 'carousel' | 'tabs' | 'rows';
