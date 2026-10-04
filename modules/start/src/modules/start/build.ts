// "Build your site": one list of what a site can have (start.json), used by
// the new-website form and by the change form's "Add to your site". What a
// person picks, and anything they fill in for it, is a Build.
import lists from '../../data/lists.json';

// changeOnly: on the change form only (a new site picks its look in its own step).
export type Item = { id: string; label: string; text: string; locked?: boolean; changeOnly?: boolean; module?: string; price?: string };
type Field = { label: string; kind?: string; required?: boolean; example?: string };
export type ListDef = { key: string; type: string; noun: string; fields: Record<string, Field> };
export type Row = Record<string, string>;

export type Build = {
  chosen: Record<string, boolean>;
  open: string;
  rows: Record<string, Row[]>;
  preOrder: boolean;
  quote: boolean;
  pageText: string;
  custom: string;
};

/** Nothing is ticked until a person ticks it, except what every site has (`locked`). */
export const blankBuild = (items: Item[]): Build => ({
  chosen: Object.fromEntries(items.map((item) => [item.id, Boolean(item.locked)])),
  open: '',
  rows: {},
  preOrder: false,
  quote: false,
  pageText: '',
  custom: '',
});

/** A list section's description (reviews, questions…), or null for anything else. */
export const listDef = (item: Item) => (item.module ? ((lists as Record<string, ListDef>)[item.module] ?? null) : null);

/** The fields a person can fill in for a list section here (photos come later). */
export const textFields = (def: ListDef) => Object.entries(def.fields).filter(([, f]) => !f.kind || ['text', 'long', 'quote'].includes(f.kind));

export const blankRow = (def: ListDef): Row => Object.fromEntries(textFields(def).map(([name]) => [name, '']));

/** The rows filled in for a list section, trimmed, without any missing a required field. */
export function filledRows(build: Build, item: Item): Row[] {
  const def = listDef(item);
  if (!def) return [];
  const fields = textFields(def);
  return (build.rows[item.id] ?? [])
    .map((row) => Object.fromEntries(fields.map(([name]) => [name, (row[name] ?? '').trim()]).filter(([, v]) => v)))
    .filter((row) => fields.every(([name, f]) => !f.required || row[name]));
}
