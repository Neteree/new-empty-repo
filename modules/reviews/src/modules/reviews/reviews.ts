// Customer reviews, typed. The data lives in reviews.json. Only ever real
// reviews, word for word, with the customer's permission: never invent one.
import data from './reviews.json';

export interface Review {
  quote: string;
  /** How the customer is happy to be named, e.g. 'Mere, Henderson'. */
  name: string;
  /** Optional: where it was left, e.g. 'Google review'. */
  source?: string;
  /** Optional: 1 to 5 stars. */
  stars?: number;
}

export const reviews = data as { section: { note: string; title: string }; items: Review[] };
