import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// PREVIEW=1 packs the whole shop into a single self-contained index.html with
// hash-based URLs (#/cart), for hosts that serve one page. The normal build
// prerenders every page at its real URL, which is what a client site ships.
const preview = process.env.PREVIEW === '1';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ pages: preview ? 'build-preview' : 'build' }),
    router: { type: preview ? 'hash' : 'pathname' },
    ...(preview && { files: { routes: 'src/routes-preview' } }),
    output: { bundleStrategy: preview ? 'inline' : 'split' },
  },
};
