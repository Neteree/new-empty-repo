// Arrows and thumbnails for every carousel on the page (components/Carousel.svelte).
// Thumbnails are buttons with data-slide="<index>"; the current one gets aria-current.
const motion = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

for (const box of document.querySelectorAll<HTMLElement>('[data-carousel]')) {
  const track = box.querySelector<HTMLElement>('.track');
  if (!track) continue;
  const slides = () => [...track.children] as HTMLElement[];

  for (const button of box.querySelectorAll<HTMLButtonElement>('[data-go]')) {
    button.addEventListener('click', () => {
      const first = slides()[0];
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = first ? first.offsetWidth + gap : track.clientWidth;
      track.scrollBy({ left: step * Number(button.dataset.go), behavior: motion() });
    });
  }

  const thumbs = [...box.querySelectorAll<HTMLButtonElement>('[data-slide]')];
  for (const thumb of thumbs) {
    thumb.addEventListener('click', () => {
      const slide = slides()[Number(thumb.dataset.slide)];
      if (slide) track.scrollTo({ left: slide.offsetLeft, behavior: motion() });
    });
  }
  const mark = () => {
    const current = Math.round(track.scrollLeft / (slides()[0]?.offsetWidth || track.clientWidth));
    thumbs.forEach((thumb, i) => thumb.setAttribute('aria-current', String(i === current)));
  };

  // No arrows when every slide already fits.
  const fit = () => box.toggleAttribute('data-fits', track.scrollWidth <= track.clientWidth + 1);
  track.addEventListener('scroll', mark, { passive: true });
  new ResizeObserver(fit).observe(track);
  fit();
  mark();
}
