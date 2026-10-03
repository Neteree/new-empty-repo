// Scripted site changes: the free, exact path for common requests. Each change
// edits the site's data files (src/data/site.json, module data, Markdown),
// never page code. A change the scripts can't do safely comes back as
// "needs a person" with the reason, for Cameron or the agent.
//
// A change is an object with a `type`:
//   text           { current, new }                    swap wording (must match exactly once)
//   hours          { hours: [{ days, times }] }        replace the opening hours
//   form-key       { key }                             connect the enquiry form (the client's Web3Forms key)
//   theme          { theme }                           switch the look (bold, classic, calm or warm; see src/themes.ts)
//   contact        { phone?, address?, instagram?, facebook? }  public contact details ('' removes one)
//   notice         { text, until? }                    a notice across the top of every page until a date ('' text removes it)
//   sections       { order: [...] }                    the order of the home page sections (see src/lib/sections.ts)
//   photo          { slot: 'hero', file, alt }         set the hero photo from an uploaded file
//                  { slot: 'hero', gallery, alt? }     …or use a gallery photo (by file name)
//   logo           { file }                            show a logo in the header instead of the name
//   gallery-add    { photos?: [{ file, alt? }], folder? }  add photos (a folder adds every image in it)
//   gallery-describe { file, alt }                     describe a gallery photo
//   gallery-remove { file }                            take a photo out of the gallery
//   gallery-order  { files: [...] }                    put the gallery in a new order
//   news           { title, excerpt, body, date? }     add a news post (date defaults to today, NZ time)
//   menu-replace   { items: [{ name, description, price, tags?, category? }] }  the client's full real menu
//   menu-add       { name, description, price, tags?, days?, category? }
//   menu-remove    { name }
//   menu-price     { name, price }
//   menu-sold-out  { name, soldOut: true|false, days? }  days default to every menu day
//   prices-replace { items: [{ name, description?, category?, price?, from?, sizes? }], footnote? }  the client's full price list
//   price-add      { name, description?, category?, price?, from?, sizes?: [{ label, price }], photo?: { file | gallery, alt? } }
//   price-change   { name, price?, from?, sizes?, description? }  new price (one price, or sizes)
//   price-remove   { name }
//   price-available { name, available: true|false }  hide an item for now, or show it again
//   price-photo    { name, file | gallery, alt? } or { name, remove: true }
//   price-note     { footnote }                        the line under the list ('' removes it)
//   booking        { options?, times?, askAddress?, leadDays? }  the booking or quote form's choices
//   review-add     { quote, name, source?, stars? }    a real customer review, word for word
//   review-remove  { name }
//   faq-add        { question, answer }                a question and the business's own answer
//   faq-remove     { question }
//   faq-replace    { questions: [{ question, answer }] }  the full list
//   product-add    { name, description, price, link?, photo?: { file | gallery, alt? } }  a shop product
//   product-remove { name }
//   product-price  { name, price }
//   product-link   { name, link }                      its Stripe payment link ('' shows "Ask us")
//   product-sold-out { name, soldOut: true|false }
//   product-photo  { name, file | gallery, alt? } or { name, remove: true }
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const SITE_JSON = 'src/data/site.json';
const MENU_JSON = 'src/modules/food/menu.json';
const PRICES_JSON = 'src/modules/prices/prices.json';
const BOOKING_JSON = 'src/modules/booking/booking.json';
const REVIEWS_JSON = 'src/modules/reviews/reviews.json';
const FAQ_JSON = 'src/modules/faq/faq.json';
const SHOP_JSON = 'src/modules/shop/shop.json';
const isPlaceholder = (text) => String(text ?? '').startsWith('[PLACEHOLDER');

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

function theme({ theme: name }) {
  // The looks are the top-level keys of src/themes.ts.
  const looks = [...readFileSync('src/themes.ts', 'utf8').matchAll(/^  (\w+): \{/gm)].map((match) => match[1]);
  const wanted = name?.trim().toLowerCase();
  if (!looks.includes(wanted)) needsPerson(`“${name}” isn’t one of the looks (${looks.join(', ')}).`);
  const site = readJson(SITE_JSON);
  site.theme = wanted;
  writeJson(SITE_JSON, site);
  return `The site now uses the ${wanted[0].toUpperCase()}${wanted.slice(1)} look.`;
}

// Handles, bare addresses and full links all become a full https link.
export function socialUrl(value, site) {
  const text = value.trim().replace(/^@/, '');
  if (!text) return '';
  const bad = () => needsPerson(`“${value}” isn’t ${site === 'instagram' ? 'an Instagram' : 'a Facebook'} link.`);
  if (/\s/.test(text)) bad();
  // A handle (letters, numbers, dots, dashes) or an address with a page on it.
  const url = /^https?:\/\//i.test(text) ? text : text.includes('/') ? `https://${text}` : `https://www.${site}.com/${text}`;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    bad();
  }
  const host = parsed.hostname.replace(/^(www|m)\./, '');
  const known = host === `${site}.com` || (site === 'facebook' && host === 'fb.com');
  if (!known || parsed.pathname.length < 2 || /^(instagram|facebook|fb)\.com$/i.test(parsed.pathname.slice(1))) bad();
  parsed.protocol = 'https:';
  return parsed.href.replace(/\/$/, '');
}

function contact({ phone, address, instagram, facebook }) {
  const site = readJson(SITE_JSON);
  const done = [];
  if (phone !== undefined) {
    const digits = phone.replace(/\D/g, '');
    if (phone.trim() && (digits.length < 7 || digits.length > 15 || /[^\d\s()+-]/.test(phone.trim()))) needsPerson(`“${phone}” doesn’t look like a phone number.`);
    site.phone = phone.trim();
    done.push(site.phone ? `phone ${site.phone}` : 'phone removed');
  }
  if (address !== undefined) {
    site.address = address.trim();
    done.push(site.address ? `address ${site.address}` : 'address removed');
  }
  site.social = { instagram: '', facebook: '', ...site.social };
  for (const [name, value] of [['instagram', instagram], ['facebook', facebook]]) {
    if (value === undefined) continue;
    site.social[name] = socialUrl(value, name);
    done.push(site.social[name] ? `${name} ${site.social[name]}` : `${name} removed`);
  }
  if (!done.length) needsPerson('No contact details were given.');
  writeJson(SITE_JSON, site);
  return `Contact details: ${done.join('; ')}.`;
}

function notice({ text, until }) {
  const site = readJson(SITE_JSON);
  const clean = (text ?? '').trim();
  const end = (until ?? '').trim();
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) needsPerson(`“${until}” isn’t a date like 2026-12-24.`);
  site.notice = { text: clean, until: clean ? end : '' };
  writeJson(SITE_JSON, site);
  return clean ? `The notice “${clean}” shows on every page${end ? ` until ${end}` : ''}.` : 'The notice is gone.';
}

function sections({ order }) {
  const modules = existsSync('src/modules') ? readdirSync('src/modules').filter((name) => existsSync(join('src/modules', name, 'Section.astro'))) : [];
  const known = [...modules, 'gallery', 'news', 'enquire'];
  const wanted = (order ?? []).map((id) => String(id).trim().toLowerCase());
  const unknown = wanted.filter((id) => !known.includes(id));
  if (!wanted.length) needsPerson('No section order was given.');
  if (unknown.length) needsPerson(`This site has no ${unknown.join(', ')} section. It has: ${known.join(', ')}.`);
  const site = readJson(SITE_JSON);
  site.sections = [...new Set(wanted)];
  writeJson(SITE_JSON, site);
  return `The home page sections now go: ${site.sections.join(', ')} (then any others).`;
}

const IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const PLACEHOLDER_ALT = '[PLACEHOLDER: describe this photo for people who can’t see it]';
let copies = 0;

/** Copies an image into src/assets/photos/ under a new, unique name and returns that name. */
function copyImage(file, prefix, types = IMAGE_TYPES) {
  if (!file || !existsSync(file)) needsPerson(`The file ${file ?? ''} is missing.`);
  const ext = extname(file).toLowerCase();
  if (!types.includes(ext)) needsPerson(`“${basename(file)}” isn’t a supported image. Use ${types.map((t) => t.slice(1).toUpperCase()).join(', ')}.`);
  const name = `${prefix}-${Date.now()}-${++copies}${ext}`;
  copyFileSync(file, join('src/assets/photos', name));
  return name;
}

function photo({ slot, file, gallery, alt }) {
  if (slot !== 'hero') needsPerson(`The script only knows the hero photo, not “${slot}”.`);
  const site = readJson(SITE_JSON);
  if (gallery) {
    const item = (site.gallery ?? []).find((photo) => photo.file === gallery);
    if (!item) needsPerson(`There's no gallery photo called ${gallery}.`);
    alt = alt?.trim() || item.alt;
  }
  // Without a description it gets a placeholder, so the checks stop it going live undescribed.
  alt = alt?.trim() || PLACEHOLDER_ALT;
  const name = gallery ?? copyImage(file, 'hero');
  site.heroPhoto = { file: name, alt };
  writeJson(SITE_JSON, site);
  return `The main photo is now ${name}${alt === PLACEHOLDER_ALT ? ' (it still needs a description: see src/data/site.json)' : ` (“${alt}”)`}.`;
}

function logo({ file }) {
  const name = copyImage(file, 'logo', [...IMAGE_TYPES, '.svg']);
  const site = readJson(SITE_JSON);
  site.logo = { file: name };
  writeJson(SITE_JSON, site);
  return 'The logo now shows in the header.';
}

// Photos come as a list, a folder of images, or both. A photo without a
// description gets a placeholder, so the checks stop it going live undescribed.
function galleryAdd({ photos = [], folder }) {
  const list = [...photos];
  if (folder) {
    if (!existsSync(folder) || !statSync(folder).isDirectory()) needsPerson(`The folder ${folder} is missing.`);
    for (const name of readdirSync(folder).sort()) {
      if (IMAGE_TYPES.includes(extname(name).toLowerCase())) list.push({ file: join(folder, name) });
    }
  }
  if (!list.length) needsPerson('There are no photos to add.');
  for (const item of list) if (!item.file || !existsSync(item.file)) needsPerson(`The file ${item.file ?? ''} is missing.`);
  const site = readJson(SITE_JSON);
  const added = list.map((item) => ({ file: copyImage(item.file, 'gallery'), alt: item.alt?.trim() || PLACEHOLDER_ALT }));
  site.gallery = [...(site.gallery ?? []), ...added];
  writeJson(SITE_JSON, site);
  const undescribed = added.filter((item) => item.alt === PLACEHOLDER_ALT).length;
  return `Added ${added.length} photo${added.length === 1 ? '' : 's'} to the gallery${undescribed ? ` (${undescribed} still need a description: see src/data/site.json)` : ''}.`;
}

function galleryRemove({ file }) {
  const site = readJson(SITE_JSON);
  const before = site.gallery ?? [];
  site.gallery = before.filter((item) => item.file !== file);
  if (site.gallery.length === before.length) needsPerson(`There's no gallery photo called ${file}.`);
  writeJson(SITE_JSON, site);
  return `Removed ${file} from the gallery.`;
}

function galleryDescribe({ file, alt }) {
  if (!alt?.trim()) needsPerson('The description is missing.');
  const site = readJson(SITE_JSON);
  const item = (site.gallery ?? []).find((photo) => photo.file === file);
  if (!item) needsPerson(`There's no gallery photo called ${file}.`);
  item.alt = alt.trim();
  writeJson(SITE_JSON, site);
  return `Described ${file} as “${item.alt}”.`;
}

function galleryOrder({ files }) {
  const site = readJson(SITE_JSON);
  const current = site.gallery ?? [];
  const same = files?.length === current.length && current.every((item) => files.includes(item.file));
  if (!same) needsPerson('The new order must list every gallery photo exactly once.');
  site.gallery = files.map((file) => current.find((item) => item.file === file));
  writeJson(SITE_JSON, site);
  return 'The gallery is in the new order.';
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

function priceList() {
  if (!existsSync(PRICES_JSON)) needsPerson('This site has no price list.');
  return readJson(PRICES_JSON);
}

function findPriceItem(data, name) {
  const matches = data.items.filter((item) => item.name.toLowerCase() === name?.trim().toLowerCase());
  if (matches.length !== 1) needsPerson(`Couldn’t find exactly one price list item called “${name}”.`);
  return matches[0];
}

/** Sets one price, sizes, or neither ("Ask us") on an item, replacing what was there. */
function setPricing(item, { price: cost, from, sizes }) {
  delete item.price;
  delete item.from;
  delete item.sizes;
  if (sizes?.length) {
    item.sizes = sizes.map((size) => {
      if (!size.label?.trim()) needsPerson('Each size needs a name, like “Small”.');
      return { label: size.label.trim(), price: price(size.price) };
    });
  } else if (cost !== undefined && cost !== '') {
    item.price = price(cost);
    if (from) item.from = true;
  }
}

/** A photo for a price list item: a new file or one already in the gallery. */
function itemPhoto({ file, gallery, alt }, name) {
  if (gallery) {
    const match = (readJson(SITE_JSON).gallery ?? []).find((photo) => photo.file === gallery);
    if (!match) needsPerson(`There's no gallery photo called ${gallery}.`);
    return { file: gallery, alt: alt?.trim() || match.alt };
  }
  return { file: copyImage(file, 'price'), alt: alt?.trim() || PLACEHOLDER_ALT };
}

const dollars = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const describePrice = (item) =>
  item.sizes ? item.sizes.map((size) => `${size.label} ${dollars(size.price)}`).join(', ') : item.price !== undefined ? `${item.from ? 'from ' : ''}${dollars(item.price)}` : 'ask us';

const priceChanges = {
  'prices-replace'({ items, footnote }) {
    const data = priceList();
    if (!items?.length) needsPerson('The new price list has no items.');
    const before = structuredClone(data);
    data.items = [];
    writeJson(PRICES_JSON, data);
    try {
      for (const item of items) priceChanges['price-add'](item);
    } catch (error) {
      writeJson(PRICES_JSON, before);
      throw error;
    }
    const done = priceList();
    done.demoPrices = false;
    if (footnote !== undefined) done.section.footnote = footnote.trim();
    writeJson(PRICES_JSON, done);
    return `The price list now has ${items.length} item${items.length === 1 ? '' : 's'}.`;
  },
  'price-add'({ name, description, category, price: cost, from, sizes, photo }) {
    const data = priceList();
    if (!name?.trim()) needsPerson('A new price list item needs a name.');
    if (data.items.some((item) => item.name.toLowerCase() === name.trim().toLowerCase())) needsPerson(`“${name}” is already on the price list.`);
    let id = slugify(name);
    while (data.items.some((item) => item.id === id)) id += '-2';
    const item = { id, name: name.trim() };
    if (description?.trim()) item.description = description.trim();
    if (category?.trim()) item.category = category.trim();
    setPricing(item, { price: cost, from, sizes });
    if (photo && (photo.file || photo.gallery)) item.photo = itemPhoto(photo, name);
    // Adding a real item on top of the examples starts the real list.
    if (data.demoPrices) {
      data.items = [];
      data.demoPrices = false;
    }
    data.items.push(item);
    writeJson(PRICES_JSON, data);
    return `Added “${item.name}” (${describePrice(item)}).`;
  },
  'price-change'({ name, price: cost, from, sizes, description }) {
    const data = priceList();
    const item = findPriceItem(data, name);
    if (cost !== undefined || sizes !== undefined) setPricing(item, { price: cost, from, sizes });
    if (description !== undefined) {
      if (description.trim()) item.description = description.trim();
      else delete item.description;
    }
    writeJson(PRICES_JSON, data);
    return `“${item.name}” is now ${describePrice(item)}.`;
  },
  'price-remove'({ name }) {
    const data = priceList();
    const item = findPriceItem(data, name);
    data.items = data.items.filter((other) => other !== item);
    writeJson(PRICES_JSON, data);
    return `Removed “${item.name}” from the price list.`;
  },
  'price-available'({ name, available }) {
    const data = priceList();
    const item = findPriceItem(data, name);
    if (available) delete item.unavailable;
    else item.unavailable = true;
    writeJson(PRICES_JSON, data);
    return `“${item.name}” is ${available ? 'back on' : 'hidden from'} the price list.`;
  },
  'price-photo'({ name, file, gallery, alt, remove }) {
    const data = priceList();
    const item = findPriceItem(data, name);
    if (remove) delete item.photo;
    else if (file || gallery) item.photo = itemPhoto({ file, gallery, alt }, name);
    else needsPerson('Choose a photo, or say to remove it.');
    writeJson(PRICES_JSON, data);
    return remove ? `“${item.name}” has no photo now.` : `“${item.name}” now shows ${item.photo.file}.`;
  },
  'price-note'({ footnote }) {
    const data = priceList();
    data.section.footnote = (footnote ?? '').trim();
    writeJson(PRICES_JSON, data);
    return data.section.footnote ? `The note under the price list is now “${data.section.footnote}”.` : 'Removed the note under the price list.';
  },
};

function bookingSettings({ options, times, askAddress, leadDays }) {
  if (!existsSync(BOOKING_JSON)) needsPerson('This site has no booking or quote form.');
  const data = readJson(BOOKING_JSON);
  const list = (value, what) => {
    const clean = (value ?? []).map((item) => String(item).trim()).filter(Boolean);
    if (!clean.length) needsPerson(`The list of ${what} is empty.`);
    return [...new Set(clean)];
  };
  const done = [];
  if (options !== undefined) {
    data.options = list(options, data.kind === 'quote' ? 'kinds of job' : 'things to book');
    done.push(`choices: ${data.options.join(', ')}`);
  }
  if (times !== undefined) {
    data.times = list(times, 'times of day');
    done.push(`times: ${data.times.join(', ')}`);
  }
  if (askAddress !== undefined) {
    data.askAddress = Boolean(askAddress);
    done.push(data.askAddress ? 'asks for an address' : 'no address');
  }
  if (leadDays !== undefined) {
    if (!Number.isInteger(leadDays) || leadDays < 0 || leadDays > 60) needsPerson(`“${leadDays}” isn’t a number of days from 0 to 60.`);
    data.leadDays = leadDays;
    done.push(`earliest day: ${leadDays === 0 ? 'today' : `${leadDays} day${leadDays === 1 ? '' : 's'} ahead`}`);
  }
  if (!done.length) needsPerson('Nothing to change on the booking form.');
  writeJson(BOOKING_JSON, data);
  return `The ${data.kind === 'quote' ? 'quote' : 'booking'} form now has ${done.join('; ')}.`;
}

function moduleData(path, what) {
  if (!existsSync(path)) needsPerson(`This site has no ${what}.`);
  return readJson(path);
}

const contentChanges = {
  'review-add'({ quote, name, source, stars }) {
    if (!quote?.trim() || !name?.trim()) needsPerson('A review needs the customer’s words and how they’re happy to be named.');
    if (stars !== undefined && !(Number.isInteger(stars) && stars >= 1 && stars <= 5)) needsPerson(`“${stars}” isn’t 1 to 5 stars.`);
    const data = moduleData(REVIEWS_JSON, 'reviews section');
    data.items = data.items.filter((item) => !isPlaceholder(item.quote));
    data.items.push({ quote: quote.trim().replace(/^["“]|["”]$/g, ''), name: name.trim(), ...(source?.trim() ? { source: source.trim() } : {}), ...(stars ? { stars } : {}) });
    writeJson(REVIEWS_JSON, data);
    return `Added a review from ${name.trim()}.`;
  },
  'review-remove'({ name }) {
    const data = moduleData(REVIEWS_JSON, 'reviews section');
    const left = data.items.filter((item) => item.name.toLowerCase() !== name?.trim().toLowerCase());
    if (left.length === data.items.length) needsPerson(`There's no review from “${name}”.`);
    data.items = left;
    writeJson(REVIEWS_JSON, data);
    return `Removed the review from ${name.trim()}.`;
  },
  'faq-add'({ question, answer }) {
    if (!question?.trim() || !answer?.trim()) needsPerson('A question needs both the question and the answer.');
    const data = moduleData(FAQ_JSON, 'questions section');
    data.questions = data.questions.filter((item) => !isPlaceholder(item.question));
    if (data.questions.some((item) => item.question.toLowerCase() === question.trim().toLowerCase())) needsPerson(`“${question.trim()}” is already there.`);
    data.questions.push({ question: question.trim(), answer: answer.trim() });
    writeJson(FAQ_JSON, data);
    return `Added the question “${question.trim()}”.`;
  },
  'faq-remove'({ question }) {
    const data = moduleData(FAQ_JSON, 'questions section');
    const left = data.questions.filter((item) => item.question.toLowerCase() !== question?.trim().toLowerCase());
    if (left.length === data.questions.length) needsPerson(`There's no question “${question}”.`);
    data.questions = left;
    writeJson(FAQ_JSON, data);
    return `Removed the question “${question.trim()}”.`;
  },
  'faq-replace'({ questions }) {
    const data = moduleData(FAQ_JSON, 'questions section');
    const clean = (questions ?? []).map((item) => ({ question: item.question?.trim(), answer: item.answer?.trim() })).filter((item) => item.question && item.answer);
    if (!clean.length) needsPerson('The new list of questions is empty.');
    data.questions = clean;
    writeJson(FAQ_JSON, data);
    return `There are now ${clean.length} question${clean.length === 1 ? '' : 's'}.`;
  },
};

function stripeLink(link) {
  const clean = (link ?? '').trim();
  if (clean && !/^https:\/\/buy\.stripe\.com\/[\w-]+$/.test(clean)) needsPerson(`“${link}” isn’t a Stripe payment link (https://buy.stripe.com/…).`);
  return clean;
}

function findProduct(data, name) {
  const matches = data.products.filter((item) => item.name.toLowerCase() === name?.trim().toLowerCase());
  if (matches.length !== 1) needsPerson(`Couldn’t find exactly one product called “${name}”.`);
  return matches[0];
}

const shopChanges = {
  'product-add'({ name, description, price: cost, link, photo }) {
    if (!name?.trim()) needsPerson('A product needs a name.');
    const data = moduleData(SHOP_JSON, 'shop');
    data.products = data.products.filter((item) => !isPlaceholder(item.name));
    if (data.products.some((item) => item.name.toLowerCase() === name.trim().toLowerCase())) needsPerson(`“${name}” is already in the shop.`);
    let id = slugify(name);
    while (data.products.some((item) => item.id === id)) id += '-2';
    const product = { id, name: name.trim(), description: description?.trim() ?? '', price: price(cost), link: stripeLink(link) };
    if (photo && (photo.file || photo.gallery)) product.photo = itemPhoto(photo, name);
    data.products.push(product);
    writeJson(SHOP_JSON, data);
    return `Added “${product.name}” at $${product.price}${product.link ? '' : ' (no payment link yet, so it shows “Ask us”)'}.`;
  },
  'product-remove'({ name }) {
    const data = moduleData(SHOP_JSON, 'shop');
    const product = findProduct(data, name);
    data.products = data.products.filter((item) => item !== product);
    writeJson(SHOP_JSON, data);
    return `Removed “${product.name}” from the shop.`;
  },
  'product-price'({ name, price: cost }) {
    const data = moduleData(SHOP_JSON, 'shop');
    const product = findProduct(data, name);
    product.price = price(cost);
    writeJson(SHOP_JSON, data);
    return `“${product.name}” is now $${product.price}. Check its Stripe payment link charges the same.`;
  },
  'product-link'({ name, link }) {
    const data = moduleData(SHOP_JSON, 'shop');
    const product = findProduct(data, name);
    product.link = stripeLink(link);
    writeJson(SHOP_JSON, data);
    return product.link ? `“${product.name}” can be bought online.` : `“${product.name}” now shows “Ask us”.`;
  },
  'product-sold-out'({ name, soldOut }) {
    const data = moduleData(SHOP_JSON, 'shop');
    const product = findProduct(data, name);
    if (soldOut) product.soldOut = true;
    else delete product.soldOut;
    writeJson(SHOP_JSON, data);
    return `“${product.name}” is ${soldOut ? 'sold out' : 'back in stock'}.`;
  },
  'product-photo'({ name, file, gallery, alt, remove }) {
    const data = moduleData(SHOP_JSON, 'shop');
    const product = findProduct(data, name);
    if (remove) delete product.photo;
    else if (file || gallery) product.photo = itemPhoto({ file, gallery, alt }, name);
    else needsPerson('Choose a photo, or say to remove it.');
    writeJson(SHOP_JSON, data);
    return remove ? `“${product.name}” has no photo now.` : `“${product.name}” now shows ${product.photo.file}.`;
  },
};

const handlers = {
  text,
  hours,
  'form-key': formKey,
  theme,
  contact,
  notice,
  sections,
  photo,
  logo,
  'gallery-add': galleryAdd,
  'gallery-describe': galleryDescribe,
  'gallery-remove': galleryRemove,
  'gallery-order': galleryOrder,
  news,
  ...menuChanges,
  ...priceChanges,
  booking: bookingSettings,
  ...contentChanges,
  ...shopChanges,
};
export const changeTypes = Object.keys(handlers);

// Photos that site.json no longer mentions (removed from the gallery, or a
// replaced logo or hero photo) are deleted, so they aren't published.
function removeUnusedPhotos() {
  const dir = 'src/assets/photos';
  if (!existsSync(dir) || !existsSync(SITE_JSON)) return;
  // Photos can be named in site.json or in a module's data (e.g. price list items).
  const moduleData = existsSync('src/modules')
    ? readdirSync('src/modules').flatMap((name) => {
        const dir = join('src/modules', name);
        return statSync(dir).isDirectory() ? readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readFileSync(join(dir, f), 'utf8')) : [];
      })
    : [];
  const used = [readFileSync(SITE_JSON, 'utf8'), ...moduleData].join('\n');
  for (const name of readdirSync(dir)) {
    if (!name.startsWith('.') && !used.includes(`"${name}"`)) rmSync(join(dir, name));
  }
}

/**
 * Apply a list of changes in the current site folder. Each result is
 * { change, done: true, summary } or { change, done: false, reason }. A change
 * that needs a person leaves the files as they were for that change.
 */
export function applyChanges(changes) {
  const results = changes.map((change) => {
    const handler = handlers[change?.type];
    if (!handler) return { change, done: false, reason: `No script for “${change?.type}” changes yet.` };
    try {
      return { change, done: true, summary: handler(change) };
    } catch (error) {
      if (error instanceof NeedsPerson) return { change, done: false, reason: error.message };
      throw error;
    }
  });
  removeUnusedPhotos();
  return results;
}
