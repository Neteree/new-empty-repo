// The shop catalogue. On a live site this would come from Shopify or Stripe;
// keeping it as typed data means the pages don't change when it does.

export type Category = 'bunches' | 'gifts' | 'vouchers';

export interface Option {
  label: string;
  price: number;
}

export interface Product {
  slug: string;
  name: string;
  category: Category;
  blurb: string;
  description: string;
  care: string;
  options: Option[];
  bloom: { petals: number; petal: string; centre: string };
}

export const categories: { id: Category | 'all'; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'bunches', label: 'Bunches' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'vouchers', label: 'Vouchers' },
];

export const products: Product[] = [
  {
    slug: 'florists-choice',
    name: "Florist's choice",
    category: 'bunches',
    blurb: 'Whatever is best on the bench this week.',
    description:
      "Tell us nothing and trust us completely. We'll tie a loose, generous bunch from the best stems that came in from the growers this week.",
    care: 'Recut the stems and change the water every two days.',
    options: [
      { label: 'Classic', price: 55 },
      { label: 'Generous', price: 80 },
      { label: 'Abundant', price: 120 },
    ],
    bloom: { petals: 12, petal: '#e7a3b8', centre: '#f3d27a' },
  },
  {
    slug: 'tulips',
    name: 'Tulips',
    category: 'bunches',
    blurb: 'They keep growing in the vase.',
    description: 'Spring tulips from a grower in the Waikato. They lean and curve towards the light, so give them room.',
    care: 'Keep them away from fruit bowls and sunny windows.',
    options: [
      { label: 'Bunch of 10', price: 26 },
      { label: 'Bunch of 20', price: 48 },
      { label: 'Armful of 40', price: 90 },
    ],
    bloom: { petals: 6, petal: '#e06d8c', centre: '#f7d774' },
  },
  {
    slug: 'ranunculus',
    name: 'Ranunculus',
    category: 'bunches',
    blurb: 'Layer on layer of paper-thin petals.',
    description: 'Ranunculus open slowly over a week into soft, many-layered cups. One of the longest-lasting spring flowers.',
    care: 'They drink a lot. Top up the vase every day.',
    options: [
      { label: 'Bunch of 10', price: 30 },
      { label: 'Bunch of 20', price: 56 },
    ],
    bloom: { petals: 16, petal: '#f2a07b', centre: '#6f8a4f' },
  },
  {
    slug: 'anemones',
    name: 'Anemones',
    category: 'bunches',
    blurb: 'Inky centres that open wide in a warm room.',
    description: 'White anemones with dark centres. They close at night and open again in the morning.',
    care: 'Use shallow water and recut every few days.',
    options: [
      { label: 'Bunch of 10', price: 28 },
      { label: 'Bunch of 20', price: 52 },
    ],
    bloom: { petals: 7, petal: '#f6f1ec', centre: '#27242b' },
  },
  {
    slug: 'freesias',
    name: 'Freesias',
    category: 'bunches',
    blurb: 'The scented one. One bunch fills a room.',
    description: 'Yellow freesias with a sweet, peppery scent. Each stem opens its buds one after another.',
    care: 'Pinch off faded flowers so the buds above keep opening.',
    options: [
      { label: 'Bunch of 10', price: 18 },
      { label: 'Bunch of 20', price: 32 },
    ],
    bloom: { petals: 6, petal: '#f3d27a', centre: '#e5a93c' },
  },
  {
    slug: 'cherry-blossom',
    name: 'Cherry blossom',
    category: 'bunches',
    blurb: 'A few big branches, and spring comes indoors.',
    description: 'Tall flowering cherry branches. They look best alone in a heavy jug or tall vase.',
    care: 'Split the base of each branch before putting it in water.',
    options: [
      { label: 'Three branches', price: 24 },
      { label: 'Six branches', price: 44 },
    ],
    bloom: { petals: 5, petal: '#f5c9d4', centre: '#c2567a' },
  },
  {
    slug: 'posy-and-vase',
    name: 'Posy and vase',
    category: 'gifts',
    blurb: 'A spring posy in a vase they get to keep.',
    description: 'A small hand-tied posy in a stoneware bud vase made by a potter in Titirangi. The vase outlives the flowers.',
    care: 'Refill the vase with fresh water daily.',
    options: [
      { label: 'Posy and bud vase', price: 85 },
      { label: 'Large posy and jug', price: 140 },
    ],
    bloom: { petals: 14, petal: '#c95d7f', centre: '#f3d27a' },
  },
  {
    slug: 'workshop-voucher',
    name: 'Workshop voucher',
    category: 'vouchers',
    blurb: 'An evening at our bench, flowers included.',
    description:
      'Two relaxed hours learning to condition and arrange seasonal flowers. Small groups of eight, and everyone takes their arrangement home.',
    care: 'Valid for 12 months. Book a date that suits after checkout.',
    options: [
      { label: 'One place', price: 95 },
      { label: 'Two places', price: 180 },
    ],
    bloom: { petals: 8, petal: '#b9a3d9', centre: '#5b4a7a' },
  },
];

export function findProduct(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export const DELIVERY_FEE = 12;
export const FREE_DELIVERY_FROM = 120;
