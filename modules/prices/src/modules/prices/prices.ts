// The price list, typed. The data itself lives in prices.json so the change
// scripts can add, remove and reprice items without touching code. The items
// there start as examples: replace them with the client's real prices, then
// set demoPrices to false.
import data from './prices.json';
import { moneyFor } from '../../lib/money';
import type { Layout } from './shown';

export interface Size {
  /** e.g. 'Small'. */
  label: string;
  price: number;
}

export interface PriceItem {
  id: string;
  name: string;
  description?: string;
  /** Optional heading to group items under, e.g. 'Bouquets'. */
  category?: string;
  /** One price. Leave it and `sizes` out for "Ask us". */
  price?: number;
  /** Shows the price as "From $…". */
  from?: boolean;
  /** Several sizes, each with its own price, instead of `price`. */
  sizes?: Size[];
  /** Optional photo: a file in src/assets/photos/ and its description. */
  photo?: { file: string; alt: string };
  /** Hidden from the site until switched back on. */
  unavailable?: boolean;
}

interface Prices {
  /** True while these are still the example items. */
  demoPrices: boolean;
  /** Wording for the section on the home page; `footnote` goes under the list, e.g. 'Prices include GST.' */
  /** `askText` shows for items without a price ('Ask us', 'Quoted'); `nav` is the menu label. */
  /** `layout`: 'cards' (groups of cards), 'carousel' (one row that swipes sideways), 'tabs' (a tab per group) or 'rows' (a big photo beside each group). */
  section: { note: string; title: string; intro: string; footnote: string; askText: string; layout?: Layout; nav: string };
  items: PriceItem[];
}

const prices = data as Prices;
export const { demoPrices, section } = prices;
/** Only the items on sale right now. */
export const items = prices.items.filter((item) => !item.unavailable);

// One style for the whole list (see lib/money.ts).
const money = moneyFor(items.flatMap((item) => (item.sizes?.length ? item.sizes.map((size) => size.price) : item.price !== undefined ? [item.price] : [])));

/** What items without a price say, e.g. 'Ask us' or 'Quoted'. */
export const askText = section.askText || 'Ask us';

/** The price as shown: '$65', 'From $120', 'Small $45 · Large $90', or '' when there is none (see askText). */
export function priceText(item: PriceItem): string {
  if (item.sizes?.length) return item.sizes.map((size) => `${size.label} ${money(size.price)}`).join(' · ');
  if (item.price === undefined) return '';
  return `${item.from ? 'From ' : ''}${money(item.price)}`;
}
