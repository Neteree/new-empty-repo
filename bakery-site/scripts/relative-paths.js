// Astro writes asset URLs as "/assets/...", which only work at a domain's
// root. Rewrite them relative to each page so the built site works from any
// folder or preview host as well.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';

const dist = 'dist';

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith('.html')) {
      const toRoot = relative(dirname(path), dist) || '.';
      const html = readFileSync(path, 'utf8').replace(/(["'(])\/assets\//g, `$1${toRoot}/assets/`);
      writeFileSync(path, html);
    }
  }
}

walk(dist);
