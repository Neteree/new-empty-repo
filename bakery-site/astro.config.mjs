import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  integrations: [svelte()],
  build: {
    format: 'file',
    // Some hosts reserve names starting with "_", so avoid the default "_astro".
    assets: 'assets',
    inlineStylesheets: 'always',
  },
});
