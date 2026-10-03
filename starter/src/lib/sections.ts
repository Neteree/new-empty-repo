// The order of the home page sections after the hero. The usual order is
// the add-on modules, then the gallery, news and the enquiry form; site.json
// "sections" can put any of them first. Anything it leaves out keeps its
// usual place after those, so a new module always shows up.
export const BASE_SECTIONS = ['gallery', 'news', 'enquire'];

export function sectionOrder(saved: string[] = [], modules: string[]): string[] {
  const usual = [...modules, ...BASE_SECTIONS];
  const chosen = saved.filter((id, i) => usual.includes(id) && saved.indexOf(id) === i);
  return [...chosen, ...usual.filter((id) => !chosen.includes(id))];
}
