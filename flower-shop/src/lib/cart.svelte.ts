import { findProduct } from './products';

export interface CartLine {
  slug: string;
  option: string;
  unitPrice: number;
  qty: number;
  message: string;
}

const STORAGE_KEY = 'stem-and-loam-cart';

const lineKey = (line: Pick<CartLine, 'slug' | 'option' | 'message'>) =>
  `${line.slug}|${line.option}|${line.message}`;

class Cart {
  lines = $state<CartLine[]>([]);
  count = $derived(this.lines.reduce((total, line) => total + line.qty, 0));
  subtotal = $derived(this.lines.reduce((total, line) => total + line.qty * line.unitPrice, 0));

  /** Load a saved cart. Storage can be missing or blocked, so fall back to empty. */
  restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as CartLine[];
      this.lines = saved.filter((line) => findProduct(line.slug) && line.qty > 0);
    } catch {
      this.lines = [];
    }
  }

  add(line: CartLine) {
    const existing = this.lines.find((l) => lineKey(l) === lineKey(line));
    if (existing) existing.qty += line.qty;
    else this.lines.push(line);
    this.save();
  }

  setQty(key: string, qty: number) {
    const line = this.lines.find((l) => lineKey(l) === key);
    if (!line) return;
    if (qty < 1) this.remove(key);
    else {
      line.qty = Math.min(qty, 20);
      this.save();
    }
  }

  remove(key: string) {
    this.lines = this.lines.filter((l) => lineKey(l) !== key);
    this.save();
  }

  clear() {
    this.lines = [];
    this.save();
  }

  keyOf = lineKey;

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines));
    } catch {
      // The cart still works for this visit without storage.
    }
  }
}

export const cart = new Cart();
