// Contact links built from site.json: tap-to-call, a map search and social pages.
import { site } from '../site.config';

/** 'tel:' link for the phone number, with spaces and brackets taken out. */
export const phoneLink = site.phone ? `tel:${site.phone.replace(/[^\d+]/g, '')}` : '';

/** The number as shown, with non-breaking spaces so it never wraps mid-number. */
export const phoneText = site.phone.replace(/ /g, '\u00a0');

export const mapLink = site.address
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`
  : '';

const social = site.social ?? { instagram: '', facebook: '' };
export const socialLinks = [
  { label: 'Instagram', url: social.instagram },
  { label: 'Facebook', url: social.facebook },
].filter((link) => link.url);
