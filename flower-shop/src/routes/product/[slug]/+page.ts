import { error } from '@sveltejs/kit';
import { findProduct, products } from '$lib/products';
import type { EntryGenerator, PageLoad } from './$types';

export const entries: EntryGenerator = () => products.map((product) => ({ slug: product.slug }));

export const load: PageLoad = ({ params }) => {
  const product = findProduct(params.slug);
  if (!product) error(404, 'We couldn’t find that flower.');
  return { product };
};
