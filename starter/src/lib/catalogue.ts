// What the onboarding and change-request forms offer, read from the starter
// itself so nothing is kept in step by hand: the looks come from themes.ts
// and the add-on modules from src/data/modules.json, which new-client and
// update-site write from the modules folder.
import { themes } from '../themes';
import modules from '../data/modules.json';

export interface Look {
  id: string;
  name: string;
  text: string;
  /** Background, accent and highlight colours, for a small preview. */
  swatches: string[];
  /** The heading font, for the preview. */
  font: string;
}

const sentence = (text: string) => `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;

/** The looks a client can pick (a theme marked `private` is kept for its own site). */
export const looks: Look[] = Object.entries(themes)
  .filter(([, theme]) => !theme.private)
  .map(([id, theme]) => {
    const [name, text = ''] = theme.label.split(': ');
    return { id, name, text: sentence(text), swatches: [theme.light.paper, theme.light.accent, theme.light.highlight], font: theme.display };
  });

/** Add-on modules that can go in an onboarding link, e.g. ?modules=food. */
export const offeredModules: string[] = modules;
