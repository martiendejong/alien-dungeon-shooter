import { LevelData } from './types';

// LEVEL 3 — "THE NEST". Claustrophobic switchback ASCENT through tight organic tunnels carved in solid
// rock: climb the ladder shafts, jump the acid pits, weave up corridor by corridor to THE QUEEN's chamber
// at the top. Walls press in on every side except the path.
const COLS = 72, ROWS = 40;
const PUR = 0xb05aff, TEAL = 0x5affd0;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const corr = (fr: number, c0: number, c1: number) => { for (let r = fr - 3; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const room = (fr: number, c0: number, c1: number, h: number) => { for (let r = fr - h; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const shaft = (col: number, frU: number, frL: number) => { for (let r = frU; r <= frL - 1; r++) set(col, r, 'L'); };
  const pit = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } };

  // QUEEN chamber at the top (floor 5), corridors below (10,15,20,25,30), spawn corridor at the bottom (35)
  room(5, 4, 66, 4);
  corr(10, 5, 66); corr(15, 5, 66); corr(20, 5, 66); corr(25, 5, 66); corr(30, 5, 66); corr(35, 3, 66);

  // ladder shafts — alternating ends; you climb UP each one after walking the corridor end-to-end
  shaft(64, 30, 35); shaft(7, 25, 30); shaft(64, 20, 25); shaft(7, 15, 20); shaft(64, 10, 15); shaft(7, 5, 10);

  // acid pits to jump
  pit(35, 30, 32); pit(30, 40, 42); pit(25, 28, 32); pit(20, 44, 46); pit(15, 26, 28); pit(10, 40, 42);

  // markers (standing cell = floorRow - 1)
  set(4, 34, 'P'); set(16, 34, 'y'); set(44, 34, 'c'); set(56, 34, 'J');   // spawn corridor (+ SMG, leaper)
  set(50, 29, 'c'); set(28, 29, 'H'); set(12, 29, 'c');                    // C30 (+ hunter)
  set(22, 24, 'c'); set(46, 24, 'U'); set(60, 24, 'c');                    // C25 (+ brute)
  set(52, 19, 'c'); set(24, 19, 'F');                                      // C20 (+ gundrone)
  set(20, 14, 'c'); set(48, 14, 'm'); set(60, 14, 'c');                    // C15 (+ medkit)
  set(40, 9, 'c'); set(20, 9, 'H');                                        // C10 (+ hunter)
  set(10, 4, 'm'); set(40, 4, 'Q'); set(60, 4, 'E');                       // QUEEN chamber + portal-gate

  return g.map(r => r.join(''));
}

export const LEVEL3: LevelData = {
  id: 'level3',
  name: 'THE NEST',
  objective: 'Climb the hive: tight organic tunnels, acid-pit jumps, ladder shafts. A swarm breach hits — reach THE QUEEN at the top.',
  block: 32,
  next: 'level4',
  intro: 'Through the portal — an alien warren. Tight and wet and watching.',
  outro: 'You claw your way back to Earth…',
  bgColor: 0x0c0814,
  ambient: 0.75,
  alarmAtRow: 16,                 // climbing past the middle trips the swarm
  alarmMsg: '⚠ THE NEST WAKES — SWARM INCOMING',
  checkpoints: [
    { col: 62, floorRow: 30 }, { col: 9, floorRow: 25 }, { col: 62, floorRow: 20 },
    { col: 9, floorRow: 15 }, { col: 62, floorRow: 10 },
  ],
  grid: buildGrid(),
  hazards: [
    { col: 50, floorRow: 30, periodMs: 2200, onMs: 850, offset: 0    },
    { col: 22, floorRow: 25, periodMs: 2200, onMs: 850, offset: 700  },
    { col: 50, floorRow: 20, periodMs: 2000, onMs: 800, offset: 400  },
    { col: 30, floorRow: 15, periodMs: 2000, onMs: 800, offset: 1000 },
  ],
  reinforcements: [
    { kind: 'crawler', col: 20, floorRow: 30 }, { kind: 'crawler', col: 60, floorRow: 25 },
    { kind: 'crawler', col: 20, floorRow: 20 }, { kind: 'crawler', col: 60, floorRow: 15 },
    { kind: 'crawler', col: 30, floorRow: 10 }, { kind: 'crawler', col: 50, floorRow: 5 },
  ],
  lights: [
    { col: 8,  row: 33, radius: 6, intensity: 0.85, color: PUR, flicker: 0.3  },
    { col: 62, row: 28, radius: 5, intensity: 0.7,  color: TEAL, flicker: 0.25 },
    { col: 9,  row: 23, radius: 5, intensity: 0.7,  color: PUR },
    { col: 62, row: 18, radius: 5, intensity: 0.7,  color: TEAL, flicker: 0.3 },
    { col: 9,  row: 13, radius: 5, intensity: 0.7,  color: PUR },
    { col: 40, row: 3,  radius: 8, intensity: 0.9,  color: 0xff4ad0, flicker: 0.35 },
    { col: 60, row: 3,  radius: 6, intensity: 0.9,  color: 0xff4ad0, flicker: 0.2  },
  ],
};
