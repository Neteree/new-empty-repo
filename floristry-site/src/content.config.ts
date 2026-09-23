import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/journal' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    // Drives the drawn bloom on the card, so posts need no photography.
    bloom: z.object({
      petals: z.number().int().min(4).max(16),
      petal: z.string(),
      centre: z.string(),
    }),
  }),
});

export const collections = { journal };
