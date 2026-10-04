// Look presets. A client picks one (`theme` in site.config.ts) and every page
// and module uses its colours and fonts through CSS variables. Colours must
// keep enough contrast in light and dark mode: npm run check tests this.
//
// Variables: paper (background), ink and ink-soft (text), accent (buttons,
// links) with on-accent (text on it), highlight (badges, shadows) with
// on-highlight, rule (lines), error, and ticket-* for paper-slip panels.

type Colours = Record<string, string>;

export interface Theme {
  label: string;
  /** Google Fonts css2 query, after "family=". */
  fonts: string;
  display: string;
  displayWeight: number;
  body: string;
  /** For small "handwritten" notes; can be the body font. */
  hand: string;
  /** A light paper texture behind the page. */
  grain: boolean;
  /** Kept for one site (e.g. the builder's own) and not offered to clients. */
  private?: boolean;
  /** A look that is dark in both modes: its `light` colours are dark too. */
  alwaysDark?: boolean;
  light: Colours;
  dark: Colours;
}

const ticket = {
  ticket: '#fffdf7',
  'ticket-ink': '#1d2433',
  'ticket-soft': '#4f5668',
  'ticket-rule': '#bfc3cf',
};

export const themes: Record<string, Theme> = {
  bold: {
    label: 'Bold: blue and sunshine yellow, chunky headings',
    fonts: 'Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Karla:wght@400;500;700&family=Caveat:wght@600',
    display: "'Bricolage Grotesque', 'Arial Black', system-ui, sans-serif",
    displayWeight: 800,
    body: "'Karla', 'Segoe UI', system-ui, sans-serif",
    hand: "'Caveat', 'Bradley Hand', cursive",
    grain: true,
    light: {
      paper: '#f7f6f2', ink: '#16213e', 'ink-soft': '#4b5470', accent: '#2350c8', 'on-accent': '#ffffff',
      highlight: '#f4c430', 'on-highlight': '#16213e', rule: '#c9cedc', error: '#b3261e',
      ...ticket, 'ticket-accent': '#2350c8',
    },
    dark: {
      paper: '#10172b', ink: '#eef1f8', 'ink-soft': '#aab2c8', accent: '#8aa6ff', 'on-accent': '#0d1430',
      highlight: '#f4c430', 'on-highlight': '#16213e', rule: '#34405e', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#2350c8',
    },
  },
  classic: {
    label: 'Classic: deep green and gold, elegant serif headings',
    fonts: 'Fraunces:opsz,wght@9..144,600&family=Source+Sans+3:wght@400;600;700',
    display: "'Fraunces', Georgia, serif",
    displayWeight: 600,
    body: "'Source Sans 3', 'Segoe UI', system-ui, sans-serif",
    hand: "'Fraunces', Georgia, serif",
    grain: false,
    light: {
      paper: '#f6f3ec', ink: '#1f2a24', 'ink-soft': '#526059', accent: '#1e5a3c', 'on-accent': '#ffffff',
      highlight: '#d9a441', 'on-highlight': '#1f2a24', rule: '#d8d3c4', error: '#a3261e',
      ...ticket, 'ticket-accent': '#1e5a3c',
    },
    dark: {
      paper: '#111a15', ink: '#eef0ea', 'ink-soft': '#aab4ac', accent: '#7cc49a', 'on-accent': '#0f1a14',
      highlight: '#e2b75a', 'on-highlight': '#1f2a24', rule: '#2a3a31', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#1e5a3c',
    },
  },
  calm: {
    label: 'Calm: soft teal and peach, clean rounded type',
    fonts: 'Outfit:wght@600;700&family=Nunito+Sans:wght@400;600;700',
    display: "'Outfit', 'Segoe UI', system-ui, sans-serif",
    displayWeight: 700,
    body: "'Nunito Sans', 'Segoe UI', system-ui, sans-serif",
    hand: "'Outfit', 'Segoe UI', system-ui, sans-serif",
    grain: false,
    light: {
      paper: '#f4f8f8', ink: '#15303a', 'ink-soft': '#4a626c', accent: '#0d737a', 'on-accent': '#ffffff',
      highlight: '#ffd2b8', 'on-highlight': '#15303a', rule: '#cfe0e2', error: '#a3261e',
      ...ticket, 'ticket-accent': '#0d737a',
    },
    dark: {
      paper: '#0e1c21', ink: '#e8f2f3', 'ink-soft': '#9fb6bc', accent: '#5fc9d1', 'on-accent': '#0e1c21',
      highlight: '#f2b99a', 'on-highlight': '#15303a', rule: '#23404a', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#0d737a',
    },
  },
  warm: {
    label: 'Warm: terracotta and cream, friendly serif headings',
    fonts: 'DM+Serif+Display&family=DM+Sans:wght@400;500;700&family=Caveat:wght@600',
    display: "'DM Serif Display', Georgia, serif",
    displayWeight: 400,
    body: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    hand: "'Caveat', 'Bradley Hand', cursive",
    grain: true,
    light: {
      paper: '#fbf5ee', ink: '#3a2218', 'ink-soft': '#6b5246', accent: '#a8422a', 'on-accent': '#ffffff',
      highlight: '#f2c14e', 'on-highlight': '#3a2218', rule: '#e6d6c6', error: '#a3261e',
      ...ticket, 'ticket-accent': '#a8422a',
    },
    dark: {
      paper: '#1d1410', ink: '#f6ebe3', 'ink-soft': '#c2aea3', accent: '#f08a67', 'on-accent': '#1d1410',
      highlight: '#f2c14e', 'on-highlight': '#3a2218', rule: '#3d2c24', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#a8422a',
    },
  },
  night: {
    label: 'Night market: lantern orange and brass on deep indigo, signboard headings',
    fonts: 'Bungee&family=Atkinson+Hyperlegible:wght@400;700&family=Fredoka:wght@500;700',
    display: "'Bungee', 'Arial Black', Impact, system-ui, sans-serif",
    displayWeight: 400,
    body: "'Atkinson Hyperlegible', 'Segoe UI', system-ui, sans-serif",
    hand: "'Fredoka', 'Arial Rounded MT Bold', system-ui, sans-serif",
    grain: false,
    alwaysDark: true,
    light: {
      paper: '#15121f', ink: '#efe8f7', 'ink-soft': '#aba1c0', accent: '#ff7a45', 'on-accent': '#1d0d05',
      highlight: '#f0b84f', 'on-highlight': '#1d0d05', rule: '#3b3456', error: '#ff8a80',
      ticket: '#f5ecd6', 'ticket-ink': '#2a2233', 'ticket-soft': '#5b4f63', 'ticket-rule': '#d8c79f', 'ticket-accent': '#8a3d12',
    },
    dark: {
      paper: '#15121f', ink: '#efe8f7', 'ink-soft': '#aba1c0', accent: '#ff7a45', 'on-accent': '#1d0d05',
      highlight: '#f0b84f', 'on-highlight': '#1d0d05', rule: '#3b3456', error: '#ff8a80',
      ticket: '#f5ecd6', 'ticket-ink': '#2a2233', 'ticket-soft': '#5b4f63', 'ticket-rule': '#d8c79f', 'ticket-accent': '#8a3d12',
    },
  },
  studio: {
    label: 'Studio: forest green and gold, slab headings',
    fonts: 'Alfa+Slab+One&family=Figtree:wght@400;500;600;700',
    display: "'Alfa Slab One', 'Rockwell', 'Roboto Slab', Georgia, serif",
    displayWeight: 400,
    body: "'Figtree', 'Segoe UI', system-ui, sans-serif",
    hand: "'Figtree', 'Segoe UI', system-ui, sans-serif",
    grain: false,
    private: true,
    light: {
      paper: '#f3f1ec', ink: '#13231b', 'ink-soft': '#56625a', accent: '#1d4a35', 'on-accent': '#f3f1ec',
      highlight: '#c9962b', 'on-highlight': '#13231b', rule: '#d6d9cf', error: '#a3261e',
      ...ticket, 'ticket-accent': '#1d4a35',
    },
    dark: {
      paper: '#0f1a14', ink: '#eef2ea', 'ink-soft': '#a7b3aa', accent: '#7fbf97', 'on-accent': '#0f1a14',
      highlight: '#e0b453', 'on-highlight': '#0f1a14', rule: '#26352c', error: '#ff8f86',
      ...ticket, 'ticket-accent': '#1d4a35',
    },
  },
};
