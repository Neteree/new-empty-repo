// Booking or quote form settings, typed. The data lives in booking.json.
import data from './booking.json';

export interface Booking {
  /** 'booking': choose a service, a day and a time. 'quote': describe a job, where and roughly when. */
  kind: 'booking' | 'quote';
  /** Wording for the section on the home page. */
  section: { note: string; title: string; intro: string };
  /** What can be booked, or the kinds of job (for quotes). */
  options: string[];
  /** Times of day to choose from (bookings only). */
  times: string[];
  /** Ask where the job or visit is. */
  askAddress: boolean;
  /** The earliest day people can choose, in days from today. */
  leadDays: number;
}

export const booking = data as Booking;

/** Today plus `days`, as YYYY-MM-DD in New Zealand time (for a date input's min). */
export function nzDate(days: number, now = new Date()): string {
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** A date like 2026-10-08 as "Thursday 8 October". */
export function longDate(value: string): string {
  return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
}
