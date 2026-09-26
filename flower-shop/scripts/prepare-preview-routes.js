// The single-file preview build uses hash URLs (#/cart), and SvelteKit refuses
// to build hash-routed pages that set page options such as `prerender` or
// `entries`. This copies src/routes to src/routes-preview without those
// options, so the real routes stay untouched for the normal build.
import { cpSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const from = 'src/routes';
const to = 'src/routes-preview';

rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });

function strip(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) strip(path);
    else if (/^\+(page|layout)\.ts$/.test(name)) {
      const code = readFileSync(path, 'utf8')
        .replace(/export const prerender = [^;]+;\n?/, '')
        .replace(/export const entries[\s\S]*?\);\n/, '');
      writeFileSync(path, code);
    }
  }
}

strip(to);
