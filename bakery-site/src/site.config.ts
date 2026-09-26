// Everything that changes from one client to the next. The new-client script
// rewrites this file; pages and layouts read from it instead of hard-coding.

export const site = {
  name: 'Early Crust',
  suburb: 'Mt Eden',
  city: 'Auckland',
  description: 'A small sourdough bakery in Mt Eden, Auckland. Pre-order for weekend pickup.',
  heroNote: 'ovens on at 4am',
  heroText:
    'A small sourdough bakery that bakes in small batches every weekend. Pre-order online and we’ll have it waiting, still warm, with your name on the bag.',
  visitText: 'We’re on a quiet corner in Mt Eden, Auckland. Walk-ins welcome while it lasts.',
  hours: [
    { days: 'Saturday', times: '7am – sold out' },
    { days: 'Sunday', times: '7am – sold out' },
    { days: 'Monday to Friday', times: 'Closed, we’re mixing dough' },
  ],
  /** Shows the "this is a demo" footer note. Set to false for a real client. */
  demo: true,
};
