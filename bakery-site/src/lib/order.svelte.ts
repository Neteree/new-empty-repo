// The weekend pre-order, shared by every island on the page (the header badge
// and the order form import this same module instance).
import { bakes, type Day } from '../data/bakes';

const STORAGE_KEY = 'early-crust-order';

class Order {
  day = $state<Day>('sat');
  pickup = $state('7–9am');
  quantities = $state<Record<string, number>>({});

  lines = $derived(
    bakes
      .filter((bake) => (this.quantities[bake.id] ?? 0) > 0)
      .map((bake) => ({ bake, qty: this.quantities[bake.id] })),
  );
  count = $derived(this.lines.reduce((total, line) => total + line.qty, 0));
  total = $derived(this.lines.reduce((total, line) => total + line.qty * line.bake.price, 0));

  restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
      if (saved) {
        this.day = saved.day === 'sun' ? 'sun' : 'sat';
        this.pickup = typeof saved.pickup === 'string' ? saved.pickup : this.pickup;
        this.quantities = saved.quantities ?? {};
      }
    } catch {
      // No saved order, or storage is blocked. Start empty.
    }
  }

  save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ day: this.day, pickup: this.pickup, quantities: this.quantities }),
      );
    } catch {
      // The order still works for this visit without storage.
    }
  }

  setQty(id: string, qty: number) {
    this.quantities[id] = Math.max(0, qty);
    this.save();
  }

  /** Switching day drops anything not baked (or sold out) that day. */
  setDay(day: Day) {
    this.day = day;
    for (const bake of bakes) {
      if (!bake.days.includes(day) || bake.soldOut?.includes(day)) this.quantities[bake.id] = 0;
    }
    this.save();
  }

  clear() {
    this.quantities = {};
    this.save();
  }
}

export const order = new Order();

let restored = false;
/** Load the saved order once per page, whichever island hydrates first. */
export function restoreOnce() {
  if (restored) return;
  restored = true;
  order.restore();
}
