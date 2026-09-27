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
  /** Optional photo beside the headline: a file in src/assets/photos/ and its description. */
  heroPhoto: { file: string; alt: string } | null;
  /** Optional logo shown in the header instead of the name: a file in src/assets/photos/. */
  logo: { file: string } | null;
  /** Photos for the gallery section, in order. The section only shows once there's at least one. */
  gallery: { file: string; alt: string }[];
  visitText: string;
  hours: { days: string; times: string }[];
  enquiry: { title: string; intro: string; options: string[] };
  /** Look preset from src/themes.ts: bold, classic, calm or warm. */
  theme: string;
  /** Web3Forms access key (web3forms.com), tied to the inbox it emails. While null, the form sends nothing. */
  formKey: string | null;
  /** The live address, e.g. 'https://example.co.nz', once known. */
  url: string | null;
  /** Shows the "this is a demo" footer note. False for a real client. */
  demo: boolean;
}

export const site: Site = data;
