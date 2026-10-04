// Prices as people read them, the same way on every list (menu, price list,
// shop, orders, and the change scripts' messages). Whole dollars show without
// cents ("$12"); if any price in a list has cents, every price in that list
// shows them ("$12.00", "$4.50"), so a list never looks uneven.

/** One price on its own: "$12" or "$4.50". */
export function money(amount: number, cents = !Number.isInteger(amount)): string {
  return `$${cents ? amount.toFixed(2) : amount}`;
}

/** A formatter for a whole list, so its prices line up. */
export function moneyFor(amounts: number[]): (amount: number) => string {
  const cents = amounts.some((amount) => !Number.isInteger(amount));
  return (amount) => money(amount, cents);
}

/** A price as typed ("12", "$12.50", "1,200"), or null if it isn't one. */
export function parseMoney(value: unknown): number | null {
  const number = Number(String(value ?? '').replace(/[$,\s]/g, ''));
  return Number.isFinite(number) && number > 0 ? Math.round(number * 100) / 100 : null;
}

/** Whether a typed value is a price, for form checks. */
export const isPrice = (value: unknown) => parseMoney(value) !== null;
