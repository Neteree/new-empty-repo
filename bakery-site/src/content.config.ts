import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    excerpt: z.string(),
    art: z.enum(['loaf', 'croissant', 'bun', 'cookie', 'baguette', 'tart']),
  }),
});

export const collections = { notes };
