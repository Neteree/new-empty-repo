import { defineConfig } from 'astro/config';

export default defineConfig({
  // Plain .html files and inlined CSS keep the build portable: it can be
  // opened from any static host, including a sub-path preview.
  build: {
    format: 'file',
    inlineStylesheets: 'always',
  },
});
