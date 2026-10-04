// Hex board helpers for board games: cube coordinates (x + y + z = 0),
// neighbours, and positions for drawing pointy-top hexes in SVG.

export type Cube = [number, number, number];

/** The six neighbour directions. Each of 0 to 2 is a line axis; i + 3 is its opposite. */
export const DIRS: Cube[] = [[1, -1, 0], [1, 0, -1], [0, 1, -1], [-1, 1, 0], [-1, 0, 1], [0, -1, 1]];

export const add = (a: Cube, b: Cube): Cube => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const key = (c: Cube) => c.join(',');
/** Turns a position 60° around the centre. */
export const rotate = (c: Cube): Cube => [-c[2], -c[0], -c[1]];

/** Centre of a pointy-top hex of the given size (centre to corner). */
export function pixel(c: Cube, size: number): [number, number] {
  return [size * Math.sqrt(3) * (c[0] + c[2] / 2), size * 1.5 * c[2]];
}

/** SVG polygon points for a pointy-top hex. */
export function hexPoints(r: number, dx = 0, dy = 0): string {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 180) * (-90 + 60 * k);
    return `${(dx + r * Math.cos(a)).toFixed(2)},${(dy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/** A board from a list of cells: each cell's index, and its neighbours' indexes (-1 off the board) in DIRS order. */
export function neighbours(cells: Cube[]): number[][] {
  const index = new Map(cells.map((c, i) => [key(c), i]));
  return cells.map((c) => DIRS.map((d) => index.get(key(add(c, d))) ?? -1));
}

/** The 7 hexes of a "flower": a centre and its six neighbours. */
export const flower = (centre: Cube): Cube[] => [centre, ...DIRS.map((d) => add(centre, d))];
