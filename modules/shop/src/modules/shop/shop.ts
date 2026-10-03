// The shop, typed. The data lives in shop.json. Each product's "Buy" button
// goes to its Stripe payment link (made in the client's own Stripe account),
// so there's no shopping cart or server to run: Stripe takes the payment and
// emails the business. Never invent products or prices.
import data from './shop.json';

export interface Product {
  id: string;
  name: string;
  description: string;
  /** In NZ dollars. */
  price: number;
  /** The product's Stripe payment link (https://buy.stripe.com/…). Blank shows "Ask us" instead of "Buy". */
  link: string;
  /** Optional photo: a file in src/assets/photos/ and its description. */
  photo?: { file: string; alt: string };
  soldOut?: boolean;
}

export const shop = data as {
  section: { note: string; title: string; intro: string; footnote: string };
  products: Product[];
};

export const money = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
