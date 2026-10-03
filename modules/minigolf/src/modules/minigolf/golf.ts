// Mini golf, as plain functions on plain data: the course, the ball and the
// physics (rolling, bouncing off walls and bumpers, dropping into the cup).
// No drawing here; Course.svelte draws it in 3D and Golf.svelte shows the
// score as page elements.
import data from './minigolf.json';

type Point = [number, number];
export interface Hole {
  name: string;
  par: number;
  start: Point;
  cup: Point;
  /** The outside edge of the green, as corners in order (it's closed). */
  edge: Point[];
  /** Rectangular walls on the green: [x, z, width, depth]. */
  blocks: [number, number, number, number][];
  /** Round bumpers: [x, z, radius]. */
  bumpers: [number, number, number][];
}
export interface MiniGolf {
  section: { note: string; title: string; intro: string };
  game: { title: string; intro: string };
  holes: Hole[];
}
export const minigolf = data as MiniGolf;

export interface Ball {
  x: number;
  z: number;
  vx: number;
  vz: number;
  sunk: boolean;
}

export const BALL = 0.09;
export const CUP = 0.14;
export const MAX_SPEED = 7.5;
const WALL_BOUNCE = 0.75;
const BUMPER_BOUNCE = 1.05;
const ROLL_DRAG = 0.5;
const STOP = 0.06;

type Segment = [Point, Point];

/** Every wall on a hole as straight segments: the edge, then each block's four sides. */
export function walls(hole: Hole): Segment[] {
  const list: Segment[] = hole.edge.map((p, i) => [p, hole.edge[(i + 1) % hole.edge.length]]);
  for (const [x, z, w, d] of hole.blocks) {
    const c: Point[] = [[x, z], [x + w, z], [x + w, z + d], [x, z + d]];
    c.forEach((p, i) => list.push([p, c[(i + 1) % 4]]));
  }
  return list;
}

export const newBall = (hole: Hole): Ball => ({ x: hole.start[0], z: hole.start[1], vx: 0, vz: 0, sunk: false });
export const moving = (ball: Ball) => Math.hypot(ball.vx, ball.vz) > 0;

/** Hit the ball: `angle` in radians (0 = straight up the course), `power` from 0 to 1. */
export function putt(ball: Ball, angle: number, power: number) {
  const speed = Math.max(0.05, Math.min(1, power)) * MAX_SPEED;
  ball.vx = Math.sin(angle) * speed;
  ball.vz = -Math.cos(angle) * speed;
}

/** Moves the ball on by `dt` seconds (in small steps, so it can't pass through a wall). */
export function step(ball: Ball, hole: Hole, segments: Segment[], dt: number) {
  if (ball.sunk || !moving(ball)) return;
  const steps = Math.ceil(dt / 0.004);
  const h = dt / steps;
  for (let s = 0; s < steps; s++) {
    ball.x += ball.vx * h;
    ball.z += ball.vz * h;
    for (const [a, b] of segments) bounceOffSegment(ball, a, b);
    for (const [x, z, r] of hole.bumpers) bounceOffCircle(ball, x, z, r);
    const speed = Math.hypot(ball.vx, ball.vz);
    // The cup: slow enough and close enough, it drops in; too fast, it rolls over.
    if (Math.hypot(ball.x - hole.cup[0], ball.z - hole.cup[1]) < CUP && speed < 2.4) {
      Object.assign(ball, { x: hole.cup[0], z: hole.cup[1], vx: 0, vz: 0, sunk: true });
      return;
    }
    const slower = Math.max(0, speed - (ROLL_DRAG * speed + 0.3) * h);
    if (slower < STOP) {
      ball.vx = 0;
      ball.vz = 0;
      return;
    }
    ball.vx *= slower / speed;
    ball.vz *= slower / speed;
  }
}

function bounce(ball: Ball, nx: number, nz: number, depth: number, restitution: number) {
  ball.x += nx * depth;
  ball.z += nz * depth;
  const into = ball.vx * nx + ball.vz * nz;
  if (into < 0) {
    ball.vx -= (1 + restitution) * into * nx;
    ball.vz -= (1 + restitution) * into * nz;
  }
}

function bounceOffSegment(ball: Ball, [ax, az]: Point, [bx, bz]: Point) {
  const dx = bx - ax;
  const dz = bz - az;
  const t = Math.max(0, Math.min(1, ((ball.x - ax) * dx + (ball.z - az) * dz) / (dx * dx + dz * dz)));
  const px = ax + dx * t;
  const pz = az + dz * t;
  const distance = Math.hypot(ball.x - px, ball.z - pz);
  if (distance >= BALL || distance === 0) return;
  bounce(ball, (ball.x - px) / distance, (ball.z - pz) / distance, BALL - distance, WALL_BOUNCE);
}

function bounceOffCircle(ball: Ball, x: number, z: number, r: number) {
  const distance = Math.hypot(ball.x - x, ball.z - z);
  if (distance >= r + BALL || distance === 0) return;
  bounce(ball, (ball.x - x) / distance, (ball.z - z) / distance, r + BALL - distance, BUMPER_BOUNCE);
}

/** The box around a hole, for fitting the camera. */
export function bounds(hole: Hole) {
  const xs = hole.edge.map((p) => p[0]);
  const zs = hole.edge.map((p) => p[1]);
  const [minX, maxX, minZ, maxZ] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2, width: maxX - minX, depth: maxZ - minZ };
}

/** "+1", "−2" or "E" (even) for a score against par. */
export function toPar(strokes: number, par: number) {
  const d = strokes - par;
  return d === 0 ? 'E' : d > 0 ? `+${d}` : `−${-d}`;
}
