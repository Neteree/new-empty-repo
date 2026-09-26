// Shop data kept as plain typed data so a CMS (or AI) can edit it without
// touching the page markup.
import type { BloomStyle } from '../lib/bloom';

export interface Stem {
  name: string;
  latin: string;
  note: string;
  bunch: string;
  price: number;
  bloom: BloomStyle;
}

export const thisWeek = {
  label: 'Week of 21 September',
  intro: 'Spring has properly arrived at the growers. These are the stems we brought back this week.',
  stems: [
    {
      name: 'Tulips',
      latin: 'Tulipa',
      note: 'Keep growing in the vase, so give them room to lean.',
      bunch: 'a bunch of ten',
      price: 26,
      bloom: { petals: 6, petal: '#e06d8c', centre: '#f7d774' },
    },
    {
      name: 'Ranunculus',
      latin: 'Ranunculus asiaticus',
      note: 'Layer on layer of paper-thin petals. Lasts up to ten days.',
      bunch: 'a bunch of ten',
      price: 30,
      bloom: { petals: 16, petal: '#f2a07b', centre: '#6f8a4f' },
    },
    {
      name: 'Anemones',
      latin: 'Anemone coronaria',
      note: 'Inky centres that open wide in a warm room.',
      bunch: 'a bunch of ten',
      price: 28,
      bloom: { petals: 7, petal: '#f6f1ec', centre: '#27242b' },
    },
    {
      name: 'Freesias',
      latin: 'Freesia',
      note: 'The scented one. One bunch fills a room.',
      bunch: 'a bunch of ten',
      price: 18,
      bloom: { petals: 6, petal: '#f3d27a', centre: '#e5a93c' },
    },
    {
      name: 'Cherry blossom',
      latin: 'Prunus serrulata',
      note: 'A few big branches, and spring comes indoors.',
      bunch: 'for three branches',
      price: 24,
      bloom: { petals: 5, petal: '#f5c9d4', centre: '#c2567a' },
    },
  ] satisfies Stem[],
};

export interface Season {
  name: string;
  months: string;
  flowers: { name: string; colour: string }[];
}

/** Typical Auckland timing. The current season is marked on the page. */
export const seasons: Season[] = [
  {
    name: 'Spring',
    months: 'September to November',
    flowers: [
      { name: 'Tulips', colour: '#e06d8c' },
      { name: 'Ranunculus', colour: '#f2a07b' },
      { name: 'Anemones', colour: '#6b5e7a' },
      { name: 'Blossom', colour: '#f5c9d4' },
      { name: 'Peonies', colour: '#e7a3b8' },
    ],
  },
  {
    name: 'Summer',
    months: 'December to February',
    flowers: [
      { name: 'Sweet peas', colour: '#b9a3d9' },
      { name: 'Hydrangeas', colour: '#8fa7d6' },
      { name: 'Dahlias', colour: '#d9784f' },
      { name: 'Cosmos', colour: '#c95d7f' },
    ],
  },
  {
    name: 'Autumn',
    months: 'March to May',
    flowers: [
      { name: 'Dahlias', colour: '#d9784f' },
      { name: 'Chrysanthemums', colour: '#e3b04b' },
      { name: 'Autumn hydrangeas', colour: '#8a6f8f' },
    ],
  },
  {
    name: 'Winter',
    months: 'June to August',
    flowers: [
      { name: 'Proteas', colour: '#d58ea0' },
      { name: 'Hellebores', colour: '#9c8aa6' },
      { name: 'Early anemones', colour: '#6b5e7a' },
    ],
  },
];

export const currentSeason = 'Spring';
