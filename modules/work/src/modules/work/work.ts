// Past work, typed: projects with a screenshot or photo each. The data lives
// in work.json and the pictures in src/assets/photos/. Only real work, with
// the owner's permission; a demo must say so (`demo: true` shows a "Demo" tag).
import data from './work.json';

export interface Project {
  title: string;
  /** What kind of job, e.g. 'Café website' or 'Bathroom renovation'. */
  kind: string;
  /** A file in src/assets/photos/ and its description. */
  photo: { file: string; alt: string };
  /** One sentence on what it shows. */
  text: string;
  /** Optional link to see it live. */
  link?: string;
  /** Shows a "Demo" tag: for example work that isn't a real client's. */
  demo?: boolean;
}

/** `frame: 'browser'` draws screenshots in a browser window; `nav` is the menu label (blank hides it). */
export const work = data as { section: { note: string; title: string; intro: string; nav: string; frame?: 'browser' | 'photo' }; items: Project[] };
