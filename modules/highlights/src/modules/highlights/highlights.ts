// Highlights, typed: a few short reasons to choose the business, as cards.
// The data lives in highlights.json. Never invent claims: they're the business's own.
import data from './highlights.json';

export interface Highlight {
  title: string;
  text: string;
}

/** A blank title keeps the heading for screen readers only ("Why choose us"). */
export const highlights = data as { section: { note: string; title: string }; items: Highlight[] };
