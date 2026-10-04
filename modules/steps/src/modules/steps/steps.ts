// How it works, typed: a real sequence of steps, so they're numbered. The
// data lives in steps.json.
import data from './steps.json';

export interface Step {
  title: string;
  text: string;
}

/** `nav` is the menu label; blank keeps it out of the menu. */
export const steps = data as { section: { note: string; title: string; nav: string }; steps: Step[] };
