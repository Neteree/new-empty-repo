// The site's details, typed. The details themselves live in src/data/site.json:
// the new-client script writes it and the change scripts edit it, so pages
// never hard-code anything a client might change. Never invent details:
// leave [PLACEHOLDER: ...] and ask.
import data from './data/site.json';

export interface Site {
  name: string;
  suburb: string;
  city: string;
  /** One sentence for search results. */
  description: string;
  /** Optional few words shown after the location, e.g. 'family run since 1998'. */
  heroNote: string;
  heroTitle: string;
  heroText: string;
  /** Optional main button beside the headline, e.g. { label: 'Play now', href: 'lantern.html' }. Blank goes to the enquiry form. */
  heroLink: { label: string; href: string };
  /** Optional photo beside the headline: a file in src/assets/photos/ and its description. */
  heroPhoto: { file: string; alt: string } | null;
  /** Optional logo in the header: a file in src/assets/photos/. It replaces the name, or sits beside it with `withName`. */
  logo: { file: string; withName?: boolean } | null;
  /** Without a logo, a dot sits beside the name: two or more colours make it a gradient (e.g. from an old logo). */
  markColours?: string[];
  /** Photos for the gallery section, in order. The section only shows once there's at least one. */
  gallery: { file: string; alt: string }[];
  /** How the gallery shows: 'grid' (tiles), 'slider' (one big photo at a time), 'mosaic' (one large photo with the rest around it), 'strip' (photos drifting sideways) or 'hidden' (no gallery section: the photos stay on hand for the main photo and price list). */
  galleryLayout: 'grid' | 'slider' | 'mosaic' | 'strip' | 'hidden';
  visitText: string;
  /** Optional street address for a map link, e.g. '12 Main Road, Green Bay, Auckland'. Blank hides the link. */
  address: string;
  /** Optional public phone number shown on the site as a tap-to-call link. Blank hides it. */
  phone: string;
  /** Optional social pages, as full links. Blank ones are hidden. */
  social: { instagram: string; facebook: string };
  /** Opening hours. Empty hides them (e.g. a business people don't visit). */
  hours: { days: string; times: string }[];
  /**
   * The enquiry form. `askBusiness` adds a "Your business" field; `thanks` is shown once
   * it's sent (blank for the usual wording). With `link` set (e.g. { label: 'Get started',
   * href: 'start.html' }) the section sends people there instead of showing the form.
   */
  enquiry: { title: string; intro: string; options: string[]; askBusiness: boolean; thanks: string; link: { label: string; href: string } };
  /** Look preset from src/themes.ts: bold, classic, calm or warm. */
  theme: string;
  /** Web3Forms access key (web3forms.com), tied to the inbox it emails. While null, the form sends nothing. */
  formKey: string | null;
  /**
   * The Cloudflare intake Worker (new-empty-repo/worker), only on the builder's own site.
   * With it, forms go into the request queue and onboarding can take photo uploads. Null for clients.
   */
  intakeUrl: string | null;
  /** The live address, e.g. 'https://example.co.nz', once known. */
  url: string | null;
  /**
   * Optional notice across the top of every page, e.g. 'Closed 24 December to 5 January'.
   * It stops showing after `until` (YYYY-MM-DD, NZ time), or never if that's blank. Blank text hides it.
   */
  notice: { text: string; until: string };
  /**
   * The order of the home page sections after the hero: 'gallery', 'news', 'enquire' and any
   * module names (e.g. 'prices'). Sections left out follow in their usual order. Empty = usual order.
   */
  sections: string[];
  /** Shows the "this is a demo" footer note. False for a real client. */
  demo: boolean;
}

export const site: Site = data as Site;
