// Dates in the client's time zone (New Zealand), never UTC.

/** Today as YYYY-MM-DD in New Zealand. */
export const nzToday = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });

/** Whether a notice with this end date (YYYY-MM-DD, or '' for none) still shows today. */
export const stillShowing = (until: string, now = new Date()) => !until || until >= nzToday(now);
