// Shop data kept as plain typed data so a CMS (or AI) can edit it without
// touching the page markup.

export interface Stem {
  name: string;
  latin: string;
  bunch: string;
  vaseLife: string;
  price: number;
}

export const thisWeek = {
  label: 'Week of 21 September',
  stems: [
    { name: 'Tulip', latin: 'Tulipa gesneriana', bunch: '10 stems', vaseLife: '5–7 days', price: 26 },
    { name: 'Ranunculus', latin: 'Ranunculus asiaticus', bunch: '10 stems', vaseLife: '7–10 days', price: 30 },
    { name: 'Anemone', latin: 'Anemone coronaria', bunch: '10 stems', vaseLife: '5–8 days', price: 28 },
    { name: 'Freesia', latin: 'Freesia × hybrida', bunch: '10 stems', vaseLife: '6–9 days', price: 18 },
    { name: 'Cherry blossom', latin: 'Prunus serrulata', bunch: '3 branches', vaseLife: '4–6 days', price: 24 },
  ] satisfies Stem[],
};

export const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Month numbers (1–12). Peak months are best; edge months are early or late in the season. */
export interface Season {
  name: string;
  peak: number[];
  edge: number[];
}

export const seasons: Season[] = [
  { name: 'Anemone', peak: [7, 8, 9, 10], edge: [6] },
  { name: 'Tulip', peak: [8, 9, 10], edge: [7, 11] },
  { name: 'Ranunculus', peak: [8, 9, 10, 11], edge: [7] },
  { name: 'Peony', peak: [11, 12], edge: [10] },
  { name: 'Sweet pea', peak: [10, 11, 12, 1], edge: [9] },
  { name: 'Hydrangea', peak: [12, 1, 2, 3], edge: [11, 4] },
  { name: 'Dahlia', peak: [1, 2, 3, 4], edge: [12, 5] },
  { name: 'Protea', peak: [5, 6, 7, 8], edge: [4, 9] },
];
