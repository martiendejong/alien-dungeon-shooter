import { LevelData } from './types';

// LEVEL 5 — "THE OVERMIND". A DEADLY CLIFF DESCENT into the core: a yawning open chasm with staggered
// ledges. You can't jump down — you must CLIMB DOWN at the right edges (and run-jump one void gap);
// a fall past two floors into the chasm is death. At the bottom waits THE OVERMIND.
const COLS = 80, ROWS = 34;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const carve = (c0: number, c1: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const plat = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) set(c, fr, '#'); };

  carve(3, 76, 2, 29);   // the open chasm (cliff) + the arena void; floor row 30 stays solid

  // descending ledges — each climb-down lands on the next (4 rows = a safe single floor); the open chasm
  // between/around them is a deadly drop. Edges overlap so the safe path is climb-down at the marked side.
  plat(6, 4, 28);                    // top ledge — spawn (climb down its RIGHT edge)
  plat(10, 24, 38); plat(10, 44, 52); // void GAP 39-43 — run-jump it, or fall to your death
  plat(14, 48, 72);                  // climb down its right edge
  plat(18, 52, 76);                  // climb down its LEFT edge (zig back)
  plat(22, 28, 56);                  // climb down its left edge
  plat(26, 4, 32);                   // last ledge — climb down to the arena floor (row 30)

  // markers (standing cell = floorRow - 1)
  set(4, 5, 'P');                                  // spawn — top ledge, edge of the abyss
  set(30, 9, 'c'); set(60, 13, 'D'); set(64, 17, 'c'); set(40, 21, 'c'); // enemies fighting you on the ledges
  set(10, 29, 'm'); set(30, 29, 'c'); set(48, 29, 'c');                  // arena floor
  set(60, 29, 'O'); set(72, 29, 'E');                                    // THE OVERMIND + the way home

  return g.map(r => r.join(''));
}

export const LEVEL5: LevelData = {
  id: 'level5',
  name: 'THE OVERMIND',
  objective: 'Climb down the cliff into the core — a fall is death, so descend ledge by ledge. Then kill THE OVERMIND.',
  block: 32,
  intro: 'THE OVERMIND — down the abyss. Do not fall.',
  bgColor: 0x140608,
  ambient: 0.8,
  alarmAtRow: 27,                 // dropping to the arena floor wakes it
  alarmMsg: '⚠ THE OVERMIND AWAKENS',
  checkpoints: [{ col: 50, floorRow: 14 }, { col: 30, floorRow: 22 }],
  grid: buildGrid(),
  hazards: [
    { col: 40, floorRow: 30, periodMs: 2200, onMs: 850, offset: 600 },
    { col: 66, floorRow: 30, periodMs: 2200, onMs: 850, offset: 0   },
  ],
  reinforcements: [
    { kind: 'crawler', col: 20, floorRow: 30 }, { kind: 'crawler', col: 40, floorRow: 30 },
    { kind: 'crawler', col: 56, floorRow: 30 }, { kind: 'grenadier', col: 30, floorRow: 30 },
  ],
  lights: [
    { col: 8,  row: 5,  radius: 5, intensity: 0.8,  color: 0xff5a4a, flicker: 0.3  }, // each ledge lit
    { col: 48, row: 9,  radius: 5, intensity: 0.75, color: 0xff8a4a, flicker: 0.25 },
    { col: 60, row: 13, radius: 5, intensity: 0.75, color: 0xff5a4a },
    { col: 60, row: 17, radius: 5, intensity: 0.75, color: 0xff8a4a, flicker: 0.3 },
    { col: 36, row: 21, radius: 5, intensity: 0.75, color: 0xff5a4a },
    { col: 60, row: 26, radius: 9, intensity: 0.95, color: 0xffd23a, flicker: 0.4 }, // the overmind glow
    { col: 72, row: 27, radius: 6, intensity: 0.9,  color: 0x9fe8ff },               // exit
  ],
};
