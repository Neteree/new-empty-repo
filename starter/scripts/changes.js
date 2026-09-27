// Scripted site changes: the free, exact path for common requests. Each change
// edits the site's data files (src/data/site.json, module data, Markdown),
// never page code. A change the scripts can't do safely comes back as
// "needs a person" with the reason, for Cameron or the agent.
//
// A change is an object with a `type`:
//   text           { current, new }                    swap wording (must match exactly once)
//   hours          { hours: [{ days, times }] }        replace the opening hours
//   form-key       { key }                             connect the enquiry form (the client's Web3Forms key)
//   photo          { slot: 'hero', file, alt }         set the hero photo from an uploaded file
//   news           { title, excerpt, body, date? }     add a news post (date defaults to today, NZ time)
//   menu-replace   { items: [{ name, description, price, tags?, category? }] }  the client's full real menu
//   menu-add       { name, description, price, tags?, days?, category? }
//   menu-remove    { name }
//   menu-price     { name, price }
//   menu-sold-out  { name, soldOut: true|false, days? }  days default to every menu day
import { copyFileSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const SITE_JSON = 'src/data/site.json';
const MENU_JSON = 'src/modules/food/menu.json';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const writeJson = (path, data) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
const slugify = (text) =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

class NeedsPerson extends Error {}
const needsPerson = (reason) => {
  throw new NeedsPerson(reason);
};

// The site uses curly quotes (’) but people type straight ones ('), so try both.
const toCurly = (text) => text.replace(/'/g, '’').replace(/"(.*?)"/g, '“$1”').replace(/"/g, '”');
const toStraight = (text) => text.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const variants = (text) => [...new Set([text, toCurly(text), toStraight(text)])];
// Whole words only, so "Closed" can't match inside "Enclosed".
const wordPattern = (text) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu');

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    // Wording lives in data files (JSON) and posts (Markdown). Page code is
    // never edited by a swap, so a match can't land in code or a comment.
    return /\.(json|md)$/.test(name) ? [path] : [];
  });
}

// Every string inside a JSON value, with a way to replace it.
function jsonStrings(node, visit) {
  if (Array.isArray(node)) node.forEach((value, i) => (typeof value === 'string' ? visit(value, (v) => (node[i] = v)) : jsonStrings(value, visit)));
  else if (node && typeof node === 'object')
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (typeof value === 'string') visit(value, (v) => (node[key] = v));
      else jsonStrings(value, visit);
    }
}

function text({ current, new: replacement }) {
  current = current?.trim();
  replacement = replacement?.trim();
  if (!current || !replacement) needsPerson('The current or new wording is missing.');

  // Count matches everywhere first, so nothing changes unless there's exactly one.
  const hits = [];
  for (const file of sourceFiles('src')) {
    const raw = readFileSync(file, 'utf8');
    for (const version of variants(current)) {
      if (file.endsWith('.json')) {
        const data = JSON.parse(raw);
        jsonStrings(data, (value) => {
          const count = [...value.matchAll(wordPattern(version))].length;
          if (count) hits.push({ file, version, count });
        });
      } else {
        const count = [...raw.matchAll(wordPattern(version))].length;
        if (count) hits.push({ file, version, count });
      }
    }
  }
  const total = hits.reduce((sum, hit) => sum + hit.count, 0);
  if (total === 0) needsPerson(`Couldn’t find “${current}” on the site. It must be copied exactly.`);
  if (total > 1) needsPerson(`“${current}” appears ${total} times, so the script won’t guess which one. Use a longer piece of wording.`);

  const [{ file, version }] = hits;
  // Curly quotes match the site's style, and a straight quote can't break the code around it.
  const styled = toCurly(replacement);
  if (file.endsWith('.json')) {
    const data = readJson(file);
    jsonStrings(data, (value, set) => {
      if (wordPattern(version).test(value)) set(value.replace(wordPattern(version), () => styled));
    });
    writeJson(file, data);
  } else {
    writeFileSync(file, readFileSync(file, 'utf8').replace(wordPattern(version), () => styled));
  }
  return `Changed “${version}” to “${styled}”.`;
}

function hours({ hours: rows }) {
  const clean = (rows ?? []).map((row) => ({ days: row.days?.trim(), times: row.times?.trim() })).filter((row) => row.days && row.times);
  if (!clean.length) needsPerson('No opening hours were given.');
  const site = readJson(SITE_JSON);
  site.hours = clean;
  writeJson(SITE_JSON, site);
  return `Opening hours are now: ${clean.map((row) => `${row.days} ${row.times}`).join('; ')}.`;
}

function formKey({ key }) {
  // Web3Forms access keys look like a UUID.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key?.trim() ?? '')) needsPerson('That doesn’t look like a Web3Forms access key.');
  const site = readJson(SITE_JSON);
  site.formKey = key.trim();
  writeJson(SITE_JSON, site);
  return 'The enquiry form is connected.';
}

function photo({ slot, file, alt }) {
  if (slot !== 'hero') needsPerson(`The script only knows the hero photo, not “${slot}”.`);
  if (!file || !existsSync(file)) needsPerson('The photo file is missing.');
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) needsPerson(`“${ext}” photos aren’t supported. Use JPG, PNG or WebP.`);
  if (!alt?.trim()) needsPerson('The photo needs a short description for people who can’t see it.');
  const name = `hero-${Date.now()}${ext}`;
  copyFileSync(file, join('src/assets/photos', name));
  const site = readJson(SITE_JSON);
  site.heroPhoto = { file: name, alt: alt.trim() };
  writeJson(SITE_JSON, site);
  return `The main photo is now ${name} (“${alt.trim()}”).`;
}

function news({ title, excerpt, body, date }) {
  if (!title?.trim() || !excerpt?.trim() || !body?.trim()) needsPerson('A news post needs a title, a short summary and the text.');
  const day = date ?? new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) needsPerson(`“${day}” isn’t a date like 2026-10-01.`);
  const path = join('src/content/journal', `${day}-${slugify(title)}.md`);
  if (existsSync(path)) needsPerson(`There's already a post at ${path}.`);
  // JSON strings are valid YAML, so titles with quotes or colons stay safe.
  writeFileSync(path, `---\ntitle: ${JSON.stringify(title.trim())}\ndate: ${day}\nexcerpt: ${JSON.stringify(excerpt.trim())}\n---\n\n${body.trim()}\n`);
  return `Posted “${title.trim()}” (${day}).`;
}

function menu() {
  if (!existsSync(MENU_JSON)) needsPerson('This site has no menu.');
  return readJson(MENU_JSON);
}

function findItem(data, name) {
  const matches = data.items.filter((item) => item.name.toLowerCase() === name?.trim().toLowerCase());
  if (matches.length !== 1) needsPerson(`Couldn’t find exactly one menu item called “${name}”.`);
  return matches[0];
}

function price(value) {
  const number = Number(String(value).replace(/[$,\s]/g, ''));
  if (!Number.isFinite(number) || number <= 0) needsPerson(`“${value}” isn’t a price.`);
  return Math.round(number * 100) / 100;
}

const TAGS = ['vegan', 'gluten-free'];

const menuChanges = {
  'menu-replace'({ items }) {
    const data = menu();
    if (!items?.length) needsPerson('The new menu has no items.');
    const before = data.items;
    data.items = [];
    writeJson(MENU_JSON, data);
    try {
      for (const item of items) menuChanges['menu-add'](item);
    } catch (error) {
      data.items = before;
      writeJson(MENU_JSON, data);
      throw error;
    }
    const done = menu();
    done.demoMenu = false;
    writeJson(MENU_JSON, done);
    return `The menu now has ${items.length} item${items.length === 1 ? '' : 's'}.`;
  },
  'menu-add'({ name, description, price: cost, tags = [], days, category }) {
    const data = menu();
    if (!name?.trim() || !description?.trim()) needsPerson('A new menu item needs a name and a description.');
    if (data.items.some((item) => item.name.toLowerCase() === name.trim().toLowerCase())) needsPerson(`“${name}” is already on the menu.`);
    const allDays = data.preOrder.days.map((day) => day.id);
    const itemDays = days ?? allDays;
    if (!itemDays.length || itemDays.some((day) => !allDays.includes(day))) needsPerson(`Days must be some of: ${allDays.join(', ')}.`);
    const badTags = tags.filter((tag) => !TAGS.includes(tag));
    if (badTags.length) needsPerson(`Unknown tags: ${badTags.join(', ')}.`);
    let id = slugify(name);
    while (data.items.some((item) => item.id === id)) id += '-2';
    const item = { id, name: name.trim(), description: description.trim(), price: price(cost), tags, days: itemDays };
    if (category?.trim()) item.category = category.trim();
    data.items.push(item);
    writeJson(MENU_JSON, data);
    return `Added “${name.trim()}” at $${price(cost).toFixed(2)}.`;
  },
  'menu-remove'({ name }) {
    const data = menu();
    const item = findItem(data, name);
    data.items = data.items.filter((other) => other !== item);
    writeJson(MENU_JSON, data);
    return `Removed “${item.name}” from the menu.`;
  },
  'menu-price'({ name, price: cost }) {
    const data = menu();
    const item = findItem(data, name);
    const before = item.price;
    item.price = price(cost);
    writeJson(MENU_JSON, data);
    return `“${item.name}” is now $${item.price.toFixed(2)} (was $${before.toFixed(2)}).`;
  },
  'menu-sold-out'({ name, soldOut, days }) {
    const data = menu();
    const item = findItem(data, name);
    const target = days ?? item.days;
    if (soldOut) item.soldOut = [...new Set([...(item.soldOut ?? []), ...target])];
    else item.soldOut = (item.soldOut ?? []).filter((day) => !target.includes(day));
    if (!item.soldOut.length) delete item.soldOut;
    writeJson(MENU_JSON, data);
    const labels = target.map((day) => data.preOrder.days.find((d) => d.id === day)?.label ?? day);
    return `“${item.name}” is ${soldOut ? 'sold out' : 'back on'} for ${labels.join(', ')}.`;
  },
};

const handlers = { text, hours, 'form-key': formKey, photo, news, ...menuChanges };
export const changeTypes = Object.keys(handlers);

/**
 * Apply a list of changes in the current site folder. Each result is
 * { change, done: true, summary } or { change, done: false, reason }. A change
 * that needs a person leaves the files as they were for that change.
 */
export function applyChanges(changes) {
  return changes.map((change) => {
    const handler = handlers[change?.type];
    if (!handler) return { change, done: false, reason: `No script for “${change?.type}” changes yet.` };
    try {
      return { change, done: true, summary: handler(change) };
    } catch (error) {
      if (error instanceof NeedsPerson) return { change, done: false, reason: error.message };
      throw error;
    }
  });
}
