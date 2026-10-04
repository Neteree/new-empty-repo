// List sections (reviews, questions, highlights, steps, past work…): one set
// of rules for all of them. Each module describes its list once, in its
// module.json "list"; catalogue.js gathers those into src/data/lists.json.
// From that description come the change scripts (add, remove, replace), the
// request form's fields and the queue's wording, so a new list section needs
// no code of its own.
//
// A description: { module, data, type, key, id, noun, by?, plural, add, remove,
//   find? (the remove field's label), hint?, unique?, ordered?, fields: { name: { label, kind?, required?, example? } } }
// Field kinds: text (default), long (a paragraph), quote (a review, word for
// word), stars (1 to 5), link (https:// only), photo ({ file | gallery, alt? }).
import { readFileSync } from 'node:fs';

/** The list descriptions, from src/data/lists.json (written by catalogue.js). */
export function loadLists() {
  return JSON.parse(readFileSync(new URL('../src/data/lists.json', import.meta.url), 'utf8'));
}

const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
const lowerFirst = (text) => text.charAt(0).toLowerCase() + text.slice(1);
/** 'the question “Do you deliver?”', or with `by`: 'the review from “Mere”'. */
const named = (def, id) => `the ${def.noun}${def.by ? ` ${def.by}` : ''} “${String(id ?? '').trim()}”`;
const count = (def, n) => `${n} ${n === 1 ? def.noun : def.plural}`;

/** Checks and tidies one item from a change; `photo` turns a { file | gallery } into a stored photo. */
export function cleanItem(def, input, { needsPerson, photo }) {
  const item = {};
  const missing = [];
  for (const [name, field] of Object.entries(def.fields)) {
    let value = input[name];
    if (field.kind === 'photo') {
      if (value?.file || value?.gallery) item[name] = photo(value);
      else if (field.required) missing.push(field.label);
      continue;
    }
    if (field.kind === 'stars') {
      if (value === undefined || value === null || value === '') continue;
      if (!(Number.isInteger(value) && value >= 1 && value <= 5)) needsPerson(`“${value}” isn’t 1 to 5 stars.`);
      item[name] = value;
      continue;
    }
    value = String(value ?? '').trim();
    if (field.kind === 'quote') value = value.replace(/^["“]|["”]$/g, '');
    if (!value) {
      if (field.required) missing.push(field.label);
      continue;
    }
    if (field.kind === 'link' && !/^https:\/\//.test(value)) needsPerson(`“${value}” isn’t a full https:// link.`);
    item[name] = value;
  }
  if (missing.length) needsPerson(`A ${def.noun} needs: ${missing.map(lowerFirst).join('; ')}.`);
  return item;
}

/**
 * Change handlers for every list: <type>-add { …fields, position? },
 * <type>-remove { <id field> } and <type>-replace { <key>: [...] }.
 * `io` gives the site's file and photo helpers from changes.js.
 */
export function listHandlers(defs, io) {
  const { read, write, needsPerson, isPlaceholder } = io;
  const handlers = {};
  for (const def of Object.values(defs)) {
    const path = `src/modules/${def.module}/${def.data}`;
    const open = () => read(path, `${def.plural} section`);
    const idOf = (item) => item[def.id];

    handlers[`${def.type}-add`] = (change) => {
      const item = cleanItem(def, change, io);
      const data = open();
      // The module's example items make way for the first real one.
      data[def.key] = data[def.key].filter((existing) => !isPlaceholder(idOf(existing)));
      if (def.unique !== false && data[def.key].some((existing) => same(idOf(existing), idOf(item)))) needsPerson(`“${idOf(item)}” is already there.`);
      const position = Number(change.position);
      const at = def.ordered && Number.isInteger(position) && position >= 1 ? Math.min(position - 1, data[def.key].length) : data[def.key].length;
      data[def.key].splice(at, 0, item);
      write(path, data);
      return `Added ${named(def, idOf(item))}${def.ordered ? ` as number ${at + 1}` : ''}.`;
    };

    handlers[`${def.type}-remove`] = (change) => {
      const id = change[def.id];
      const data = open();
      const left = data[def.key].filter((existing) => !same(idOf(existing), id));
      if (!String(id ?? '').trim() || left.length === data[def.key].length) needsPerson(`There's no ${named(def, id).slice(4)}.`);
      data[def.key] = left;
      write(path, data);
      return `Removed ${named(def, id)}.`;
    };

    handlers[`${def.type}-replace`] = (change) => {
      const items = (change[def.key] ?? []).map((input) => cleanItem(def, input, io));
      if (!items.length) needsPerson(`The new list of ${def.plural} is empty.`);
      const data = open();
      data[def.key] = items;
      write(path, data);
      return `Replaced the ${def.plural} with ${count(def, items.length)}.`;
    };
  }
  return handlers;
}

/** A list change in plain English for the queue, or null if it isn't one. */
export function describeListChange(defs, change) {
  for (const def of Object.values(defs)) {
    const id = change[def.id];
    if (change.type === `${def.type}-add`) return `Add ${named(def, id)}${change.position ? ` as number ${change.position}` : ''}${def.fields.photo && !change.photo ? ' (photo to come by email)' : ''}`;
    if (change.type === `${def.type}-remove`) return `Remove ${named(def, id)}`;
    if (change.type === `${def.type}-replace`) return `Replace the ${def.plural} with ${count(def, change[def.key]?.length ?? 0)}`;
  }
  return null;
}
