// Sends a form through Web3Forms, which emails it to the address behind
// `site.formKey`. Every form on the site uses this.
import { site } from '../site.config';

/** True if it was sent. Only call when `site.formKey` is set. */
export async function sendForm(subject: string, fields: Record<string, string | boolean>): Promise<boolean> {
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: site.formKey, subject, from_name: site.name, ...fields }),
    });
    return (await response.json()).success === true;
  } catch {
    return false;
  }
}
