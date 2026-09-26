// Everything that changes from one client to the next. The new-client script
// rewrites this file from the client's JSON; pages read from it instead of
// hard-coding. Never invent details: leave [PLACEHOLDER: ...] and ask.

export const site = {
  name: '[PLACEHOLDER: business name]',
  suburb: '[PLACEHOLDER: suburb]',
  city: 'Auckland',
  description: '[PLACEHOLDER: one sentence for search results]',
  heroNote: '[PLACEHOLDER: short line above the headline]',
  heroTitle: '[PLACEHOLDER: headline]',
  heroText: '[PLACEHOLDER: two sentences on what the business does and for whom]',
  visitText: '[PLACEHOLDER: where to find the business]',
  hours: [{ days: '[PLACEHOLDER: days]', times: '[PLACEHOLDER: times]' }],
  enquiry: {
    title: 'Get in touch',
    intro: '[PLACEHOLDER: what to send and how soon they reply]',
    options: ['[PLACEHOLDER: enquiry type]', 'Something else'],
  },
  /** Web3Forms access key (web3forms.com), tied to the inbox it emails. While null, the form sends nothing. */
  formKey: null as string | null,
  /** The live address, e.g. 'https://example.co.nz', once known. */
  url: null as string | null,
  /** Shows the "this is a demo" footer note. False for a real client. */
  demo: true,
};
