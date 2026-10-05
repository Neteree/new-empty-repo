// The menu button on phones: opens and closes the header's links, and closes
// them again after a link is picked, Escape is pressed or the page is tapped
// elsewhere. Without JavaScript the links simply show in a row.
const header = document.querySelector<HTMLElement>('.masthead');
const button = header?.querySelector<HTMLButtonElement>('.menu-button');
if (header && button) {
  header.toggleAttribute('data-menu', true);
  const set = (open: boolean) => {
    button.setAttribute('aria-expanded', String(open));
    header.toggleAttribute('data-open', open);
  };
  button.addEventListener('click', () => set(button.getAttribute('aria-expanded') !== 'true'));
  header.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => set(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.hasAttribute('data-open')) {
      set(false);
      button.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target as Node)) set(false);
  });
}
