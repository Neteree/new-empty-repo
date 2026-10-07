// Sends the site's forms. On a client's site with `mailUrl` the intake Worker
// emails them to the client through Cloudflare. Otherwise (`intakeUrl` null)
// Web3Forms emails them to the address behind `site.formKey`, with any structured
// answers attached as a ---…-JSON--- block the queue scripts can read. On the
// builder's own site (`intakeUrl` set: the Cloudflare intake Worker) the
// answers and any photos go into the request queue instead, and Web3Forms
// just emails a heads-up. Photos can only go through the intake.
import { site } from '../site.config';

export interface Submission {
  kind: 'contact' | 'onboarding' | 'request';
  subject: string;
  /** Readable answers for the email, e.g. { name, email }. */
  fields: Record<string, string>;
  /** The structured answers the queue scripts read. */
  payload: unknown;
  /** Marker for the email block, e.g. 'CLIENT' gives ---CLIENT-JSON---. Leave out for plain emails. */
  block?: string;
  logo?: File | null;
  photos?: File[];
  botcheck: boolean;
}

async function web3forms(body: Record<string, unknown>) {
  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ access_key: site.formKey, from_name: site.name, ...body }),
  });
  const result = await response.json();
  if (!result.success) throw new Error(result.message ?? 'Web3Forms refused it.');
}

/** True if the form was sent; throws if it wasn't. */
export async function send(submission: Submission): Promise<void> {
  const { kind, subject, fields, payload, block, logo, photos = [], botcheck } = submission;

  if (site.intakeUrl) {
    const form = new FormData();
    form.set('kind', kind);
    form.set('payload', JSON.stringify(payload));
    if (botcheck) form.set('botcheck', 'on');
    if (logo) form.append('logo', logo, logo.name);
    for (const photo of photos) form.append('photos', photo, photo.name);
    const response = await fetch(`${site.intakeUrl}/submit`, { method: 'POST', body: form });
    const result = await response.json().catch(() => ({ ok: false }));
    if (!result.ok) throw new Error(result.error ?? 'The intake refused it.');
    // A heads-up email; the submission is already safe in the queue, so a failure here doesn't matter.
    if (site.formKey && !botcheck) {
      const uploads = [logo && 'a logo', photos.length && `${photos.length} photo${photos.length === 1 ? '' : 's'}`].filter(Boolean);
      await web3forms({
        subject: `${subject} (in the queue)`,
        ...fields,
        note: `Saved as ${result.id}${uploads.length ? ` with ${uploads.join(' and ')}` : ''}. Run node ops/pull.js to bring it in.`,
      }).catch(() => {});
    }
    return;
  }

  if (site.mailUrl) {
    const response = await fetch(site.mailUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, fields, botcheck }),
    });
    const result = await response.json().catch(() => ({ ok: false }));
    if (!result.ok) throw new Error(result.error ?? 'The email couldn’t be sent.');
    return;
  }

  if (!site.formKey) return;
  await web3forms({
    subject,
    ...fields,
    ...(block ? { [`${block.toLowerCase()}_json`]: `---${block}-JSON--- ${JSON.stringify(payload)} ---END-${block}-JSON---` } : {}),
    botcheck,
  });
}

/** Whether the site's forms send anywhere yet (a Web3Forms key, the intake or Cloudflare email). */
export const connected = Boolean(site.formKey || site.intakeUrl || site.mailUrl);

/** Whether photos can be uploaded (only through the intake). */
export const canUpload = Boolean(site.intakeUrl);

/** A simple email form (enquiries, bookings): sends its fields as they are. True if it was sent. */
export async function sendForm(subject: string, fields: Record<string, string | boolean>): Promise<boolean> {
  const { botcheck, ...answers } = fields;
  try {
    await send({ kind: 'contact', subject, fields: answers as Record<string, string>, payload: answers, botcheck: Boolean(botcheck) });
    return true;
  } catch {
    return false;
  }
}
