// Turns a new client's onboarding answers into their client JSON, and
// optionally their site. No AI: it only rearranges what the client wrote.
//
//   node scripts/onboard.js <onboarding-email.txt>              write clients/<name>.json
//   node scripts/onboard.js <onboarding-email.txt> <new-folder>  …and create the site there
//
// The input is the onboarding email from Cameron's site (text or HTML), or
// just the JSON between its ---CLIENT-JSON--- markers. Anything the client
// left blank that the site needs becomes [PLACEHOLDER: ...], which the checks
// refuse to let go live.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { themes } from '../src/themes.ts';
import { socialUrl } from './changes.js';

const [input, target] = process.argv.slice(2);
if (!input) {
  console.error('Usage: node scripts/onboard.js <onboarding-email-or-json> [new-folder]');
  process.exit(1);
}

const decode = (text) =>
  text.replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const raw = decode(readFileSync(input, 'utf8'));
const marked = raw.match(/---CLIENT-JSON---\s*(\{[\s\S]*?\})\s*---END-CLIENT-JSON---/);
let answers;
try {
  answers = JSON.parse(marked ? marked[1] : raw);
} catch {
  console.error(`Couldn't find the client details in ${input}. It should contain the ---CLIENT-JSON--- block from the onboarding email.`);
  process.exit(1);
}
if (answers.onboarding !== 1) {
  console.error('These answers are from an unknown version of the onboarding form.');
  process.exit(1);
}

const missing = ['name', 'suburb', 'city', 'about', 'visit', 'theme'].filter((key) => !answers[key]);
if (!answers.hours?.length) missing.push('hours');
if (missing.length) {
  console.error(`The answers are missing: ${missing.join(', ')}`);
  process.exit(1);
}
if (!themes[answers.theme]) {
  console.error(`Unknown look "${answers.theme}". Choose one of: ${Object.keys(themes).join(', ')}.`);
  process.exit(1);
}

// A search-result description from their own words: name, place, first sentence.
const firstSentence = answers.about.match(/^.*?[.!?](\s|$)/)?.[0].trim() ?? answers.about;
let description = `${answers.name}, ${answers.suburb}, ${answers.city}. ${firstSentence}`;
if (description.length > 160) description = `${description.slice(0, 157).replace(/\s+\S*$/, '')}…`;

// Social links become full links; one that doesn't look right is left for Cameron to check.
const social = {};
for (const name of ['instagram', 'facebook']) {
  try {
    social[name] = socialUrl(answers[name] ?? '', name);
  } catch {
    social[name] = `[PLACEHOLDER: check the ${name} link; they wrote “${answers[name]}”]`;
  }
}

const client = {
  name: answers.name,
  suburb: answers.suburb,
  city: answers.city,
  description,
  heroNote: answers.standout ?? '',
  heroTitle: answers.headline || `[PLACEHOLDER: headline; ${answers.name} left it for us to suggest]`,
  heroText: answers.about,
  visitText: answers.visit,
  address: answers.address ?? '',
  // Only the number they chose to show on the site; contact.phone stays private.
  phone: answers.sitePhone ?? '',
  social,
  hours: answers.hours,
  enquiry: {
    title: 'Get in touch',
    intro: 'Send us a message and we’ll get back to you.',
    options: [...(answers.enquiryTypes ?? []), 'Something else'],
  },
  theme: answers.theme,
  modules: answers.modules ?? [],
  ...(answers.preOrder ? { menu: { preOrder: true } } : {}),
  ...(answers.quote ? { booking: { kind: 'quote' } } : {}),
  contact: answers.contact ?? {},
  demo: false,
};

const starter = resolve(import.meta.dirname, '..');
const slug = answers.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const clientPath = join(starter, 'clients', `${slug}.json`);
if (existsSync(clientPath)) {
  console.error(`${clientPath} already exists. Move it first so nothing is overwritten.`);
  process.exit(1);
}
writeFileSync(clientPath, `${JSON.stringify(client, null, 2)}\n`);
console.log(`Wrote ${clientPath}`);

const gaps = JSON.stringify(client).match(/\[PLACEHOLDER: [^\]]*\]/g) ?? [];
for (const gap of gaps) console.log(`Still needed: ${gap}`);

if (target) execFileSync('node', [join(starter, 'scripts/new-client.js'), clientPath, target], { stdio: 'inherit' });
