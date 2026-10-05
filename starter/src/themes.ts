// Look presets. A client picks one (`theme` in site.config.ts) and every page
// and module uses its colours and fonts through CSS variables. Colours must
// keep enough contrast in light and dark mode: npm run check tests this.
//
// Variables: paper (background), ink and ink-soft (text), accent (buttons,
// links) with on-accent (text on it), highlight (badges, shadows) with
// on-highlight, rule (lines), error, and ticket-* for paper-slip panels.
//
// Beyond colours and fonts, a look sets the shape of the page: how the top of
// the home page is laid out (hero) and how cards, photos and buttons are
// framed (frame). Both become CSS variables or a prop, so every section and
// module follows the look without knowing which one it is.

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
  /** The top of the home page: headline beside the photo (default), photo first, headline over the photo, or headline above a wide photo. */
  hero?: HeroLayout;
  /** How cards, photos and buttons are framed (default 'bold'). */
  frame?: keyof typeof frames;
  light: Colours;
  dark: Colours;
}

export type HeroLayout = 'split' | 'flip' | 'cover' | 'stacked';

/**
 * Frame styles as CSS variables: --frame is a card's border, --lift its
 * shadow (-s small, -l large, -accent in the accent colour), --radius its
 * corners (-s on phones and form fields), --button-radius the buttons' and
 * tags', and --title-shadow the footer name's.
 */
const soft = (blur: number, y: number) => `0 ${y}px ${blur}px -${Math.round(blur * 0.6)}px rgb(0 0 0 / 0.28)`;
export const frames = {
  /** An ink outline and a solid offset shadow: hand-made and chunky. */
  bold: {
    frame: '2px solid var(--ink)', radius: '1rem', 'radius-s': '0.75rem', 'button-radius': '999px', 'title-shadow': '3px 3px 0 var(--highlight)',
    'lift-s': '4px 4px 0 var(--highlight)', lift: '6px 6px 0 var(--highlight)', 'lift-l': '8px 8px 0 var(--highlight)',
    'lift-s-accent': '3px 3px 0 var(--accent)', 'lift-accent': '6px 6px 0 var(--accent)', 'lift-l-accent': '8px 8px 0 var(--accent)',
  },
  /** A hairline and a gentle drop shadow, so photos lead. */
  soft: {
    frame: '1px solid var(--rule)', radius: '1.25rem', 'radius-s': '0.9rem', 'button-radius': '999px', 'title-shadow': 'none',
    'lift-s': 'none', lift: soft(30, 12), 'lift-l': soft(60, 24),
    'lift-s-accent': 'none', 'lift-accent': soft(30, 12), 'lift-l-accent': soft(60, 24),
  },
  /** Thin ink lines, square corners, no shadows: a printed, magazine feel. */
  line: {
    frame: '1px solid var(--ink)', radius: '0', 'radius-s': '0', 'button-radius': '0', 'title-shadow': 'none',
    'lift-s': 'none', lift: 'none', 'lift-l': 'none',
    'lift-s-accent': 'none', 'lift-accent': 'none', 'lift-l-accent': 'none',
  },
};

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
  bloom: {
    label: 'Bloom: blush and berry, a big photo with graceful serif headings',
    fonts: 'Cormorant+Garamond:wght@600;700&family=Jost:wght@400;500;600',
    display: "'Cormorant Garamond', Garamond, Georgia, serif",
    displayWeight: 600,
    body: "'Jost', 'Segoe UI', system-ui, sans-serif",
    hand: "'Cormorant Garamond', Garamond, Georgia, serif",
    grain: false,
    hero: 'cover',
    frame: 'soft',
    light: {
      paper: '#fbf7f4', ink: '#2b1d24', 'ink-soft': '#6a5560', accent: '#8c2f55', 'on-accent': '#ffffff',
      highlight: '#f3c9cf', 'on-highlight': '#2b1d24', rule: '#ead9dc', error: '#a3261e',
      ...ticket, 'ticket-accent': '#8c2f55',
    },
    dark: {
      paper: '#1c1418', ink: '#f6ecef', 'ink-soft': '#c7b1b9', accent: '#f29ab9', 'on-accent': '#1c1418',
      highlight: '#f3c9cf', 'on-highlight': '#2b1d24', rule: '#3e2c34', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#8c2f55',
    },
  },
  editorial: {
    label: 'Editorial: black and white like a magazine, a wide photo under a centred headline',
    fonts: 'Bodoni+Moda:opsz,wght@6..96,500;6..96,600&family=Inter:wght@400;500;600',
    display: "'Bodoni Moda', 'Didot', Georgia, serif",
    displayWeight: 500,
    body: "'Inter', 'Segoe UI', system-ui, sans-serif",
    hand: "'Inter', 'Segoe UI', system-ui, sans-serif",
    grain: false,
    hero: 'stacked',
    frame: 'line',
    light: {
      paper: '#ffffff', ink: '#111111', 'ink-soft': '#4d4d4d', accent: '#9e1b32', 'on-accent': '#ffffff',
      highlight: '#e9e4dc', 'on-highlight': '#111111', rule: '#d9d9d9', error: '#a3261e',
      ...ticket, 'ticket-accent': '#9e1b32',
    },
    dark: {
      paper: '#111111', ink: '#f4f4f4', 'ink-soft': '#b5b5b5', accent: '#ff8a9e', 'on-accent': '#111111',
      highlight: '#3a3631', 'on-highlight': '#f4f4f4', rule: '#333333', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#9e1b32',
    },
  },
  garden: {
    label: 'Garden: sage green and cream, photo first, soft rounded type',
    fonts: 'Lora:wght@500;600&family=Work+Sans:wght@400;500;600',
    display: "'Lora', Georgia, serif",
    displayWeight: 600,
    body: "'Work Sans', 'Segoe UI', system-ui, sans-serif",
    hand: "'Lora', Georgia, serif",
    grain: false,
    hero: 'flip',
    frame: 'soft',
    light: {
      paper: '#f3f1e8', ink: '#203126', 'ink-soft': '#526456', accent: '#3d6b4f', 'on-accent': '#ffffff',
      highlight: '#c9d8b6', 'on-highlight': '#203126', rule: '#d9dccb', error: '#a3261e',
      ...ticket, 'ticket-accent': '#3d6b4f',
    },
    dark: {
      paper: '#141c16', ink: '#edf1e8', 'ink-soft': '#aab8aa', accent: '#9cc9a6', 'on-accent': '#141c16',
      highlight: '#c9d8b6', 'on-highlight': '#203126', rule: '#2b3a2f', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#3d6b4f',
    },
  },
  boutique: {
    label: 'Boutique: deep plum and gold, dark and luxurious, thin lines',
    fonts: 'Playfair+Display:wght@500;600&family=Montserrat:wght@400;500;600',
    display: "'Playfair Display', Georgia, serif",
    displayWeight: 500,
    body: "'Montserrat', 'Segoe UI', system-ui, sans-serif",
    hand: "'Playfair Display', Georgia, serif",
    grain: false,
    alwaysDark: true,
    hero: 'cover',
    frame: 'line',
    light: {
      paper: '#1f1420', ink: '#f5ece6', 'ink-soft': '#c9b8bd', accent: '#d9b46a', 'on-accent': '#1f1420',
      highlight: '#5a3a55', 'on-highlight': '#f5ece6', rule: '#4a3348', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#7a4a2a',
    },
    dark: {
      paper: '#1f1420', ink: '#f5ece6', 'ink-soft': '#c9b8bd', accent: '#d9b46a', 'on-accent': '#1f1420',
      highlight: '#5a3a55', 'on-highlight': '#f5ece6', rule: '#4a3348', error: '#ff8a80',
      ...ticket, 'ticket-accent': '#7a4a2a',
    },
  },
  lavender: {
    label: 'Lavender: deep periwinkle night with soft wing pink, graceful serif headings, soft rounded frames, big photo',
    fonts: 'Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Manrope:wght@400;500;700',
    display: "'Cormorant Garamond', Garamond, Georgia, serif",
    displayWeight: 700,
    body: "'Manrope', 'Segoe UI', system-ui, sans-serif",
    hand: "'Cormorant Garamond', Garamond, Georgia, serif",
    grain: false,
    alwaysDark: true,
    hero: 'cover',
    frame: 'soft',
    light: {
      paper: '#1c1930', ink: '#f3f0fa', 'ink-soft': '#c4bed9', accent: '#b9b3f2', 'on-accent': '#1c1930',
      highlight: '#e9b7c8', 'on-highlight': '#26223f', rule: '#3b3558', error: '#ff8a80',
      ticket: '#f7f5fb', 'ticket-ink': '#26223f', 'ticket-soft': '#5a5574', 'ticket-rule': '#d9d4e8', 'ticket-accent': '#5650a0',
    },
    dark: {
      paper: '#1c1930', ink: '#f3f0fa', 'ink-soft': '#c4bed9', accent: '#b9b3f2', 'on-accent': '#1c1930',
      highlight: '#e9b7c8', 'on-highlight': '#26223f', rule: '#3b3558', error: '#ff8a80',
      ticket: '#f7f5fb', 'ticket-ink': '#26223f', 'ticket-soft': '#5a5574', 'ticket-rule': '#d9d4e8', 'ticket-accent': '#5650a0',
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
