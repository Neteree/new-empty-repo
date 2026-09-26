// The menu and pre-order details. Kept as typed data so a CMS or an agent can
// update the menu each week without touching components. These items are the
// Early Crust demo's: replace them with the client's real menu and prices.

export type Day = 'sat' | 'sun';
export type Tag = 'vegan' | 'gluten-free';
export type Art = 'loaf' | 'croissant' | 'bun' | 'cookie' | 'baguette' | 'tart';

export interface Bake {
  id: string;
  name: string;
  description: string;
  price: number;
  art: Art;
  tags: Tag[];
  days: Day[];
  soldOut?: Day[];
  note?: string;
}

/** Wording for the menu section on the home page. */
export const section = {
  note: 'Weekend of 26–27 September',
  title: 'This weekend’s bake',
  intro: 'Choose your day, add what you’d like, and pick it up warm. Pre-orders close Friday at 2pm.',
};

export const weekend = {
  label: 'Weekend of 26–27 September',
  orderBy: 'Friday at 2pm',
  days: [
    { id: 'sat', label: 'Saturday 26' },
    { id: 'sun', label: 'Sunday 27' },
  ] as { id: Day; label: string }[],
  pickupTimes: ['7–9am', '9–11am', '11am–1pm'],
};

export const bakes: Bake[] = [
  {
    id: 'country-sourdough',
    name: 'Country sourdough',
    description: '36-hour ferment, wholemeal and rye, dark crackly crust.',
    price: 12,
    art: 'loaf',
    tags: ['vegan'],
    days: ['sat', 'sun'],
    note: 'our bestseller',
  },
  {
    id: 'butter-croissant',
    name: 'Butter croissant',
    description: 'Laminated over three days with cultured butter.',
    price: 6,
    art: 'croissant',
    tags: [],
    days: ['sat', 'sun'],
    soldOut: ['sat'],
  },
  {
    id: 'cardamom-bun',
    name: 'Cardamom bun',
    description: 'Knotted and rolled in cardamom sugar. Sticky fingers guaranteed.',
    price: 5.5,
    art: 'bun',
    tags: [],
    days: ['sat', 'sun'],
    note: 'still warm at 7am',
  },
  {
    id: 'seeded-baguette',
    name: 'Seeded baguette',
    description: 'Sesame, sunflower and linseed, baked in small batches all morning.',
    price: 7,
    art: 'baguette',
    tags: ['vegan'],
    days: ['sat'],
  },
  {
    id: 'brown-butter-cookie',
    name: 'Brown butter cookie',
    description: 'Dark chocolate chunks and flaky salt. Chewy middle, crisp edge.',
    price: 4.5,
    art: 'cookie',
    tags: [],
    days: ['sat', 'sun'],
  },
  {
    id: 'rhubarb-tart',
    name: 'Rhubarb almond tart',
    description: 'Almond frangipane with the first spring rhubarb. Made without wheat.',
    price: 9,
    art: 'tart',
    tags: ['gluten-free'],
    days: ['sun'],
  },
];

export const MAX_EACH = 12;
