// Tabs for every [data-tabs] box: its [role=tablist] buttons show one
// [role=tabpanel] at a time. Without JavaScript the tab bar stays hidden and
// every panel shows, each under its own heading.
for (const box of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
  const bar = box.querySelector<HTMLElement>('[role=tablist]');
  const tabs = [...box.querySelectorAll<HTMLButtonElement>('[role=tab]')];
  const panels = [...box.querySelectorAll<HTMLElement>('[role=tabpanel]')];
  if (!bar || !tabs.length) continue;
  const show = (index: number) => {
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => (panel.hidden = i !== index));
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i));
    tab.addEventListener('keydown', (event) => {
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      const next = (i + step + tabs.length) % tabs.length;
      show(next);
      tabs[next].focus();
    });
  });
  bar.hidden = false;
  box.toggleAttribute('data-tabs-ready', true);
  show(0);
}
