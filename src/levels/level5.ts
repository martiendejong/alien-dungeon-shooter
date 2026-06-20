import { LevelData } from './types';

// LEVEL 5 — "THE OVERMIND". Bigger descent + larger arena: COLS 120→155, ROWS 22→28.
// Three approach corridors (was two). Taller arena (5 rows, was 4). Wider boss room.
const COLS = 155, ROWS = 28;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const carve = (c0: number, c1: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const spikePit = (c0: number, c1: number, fr: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } };

  carve(2,  54,  2,  4);    // c1 (floor 5)
  carve(30, 88,  6,  10);   // c2 (floor 11)
  carve(60, 116, 12, 16);   // c3 (floor 17) — NEW extra corridor
  carve(80, 151, 18, 23);   // ARENA (floor 24, 5 high)
  // climb-down connectors
  carve(42, 43, 5,  10);    // c1 → c2
  carve(72, 73, 11, 16);    // c2 → c3
  carve(94, 95, 17, 23);    // c3 → arena

  spikePit(18, 20, 5);
  spikePit(56, 58, 11);
  spikePit(82, 84, 17);     // c3 hazard
  spikePit(100, 102, 24);   // arena hazard (left)
  spikePit(130, 132, 24);   // arena hazard (right)

  set(4,  4,  'P'); set(12, 4, 'a'); set(34, 4, 'c');                  // c1
  set(48, 10, 'g'); set(66, 10, 'c'); set(54, 10, 'H');                 // c2 + hunter
  set(70, 16, 'c'); set(92, 16, 'g'); set(80, 16, 'B');                 // c3 + bomber
  set(86, 23, 'm'); set(104, 23, 'c'); set(118, 23, 'm');               // arena floor
  set(94,  23, 'U'); set(110, 23, 'F');                                  // brute + gundrone
  set(136, 23, 'O'); set(148, 23, 'E');                                  // THE OVERMIND + the way home

  return g.map(r => r.join(''));
}

export const LEVEL5: LevelData = {
  id: 'level5',
  name: 'THE OVERMIND',
  objective: 'The hive core. Three approach corridors, then a wide arena. Survive — kill THE OVERMIND.',
  block: 32,
  intro: 'THE OVERMIND — end it.',
  bgColor: 0x140608,
  ambient: 0.78,
  alarmAtCol: 54,
  alarmMsg: '⚠ THE OVERMIND AWAKENS',
  checkpoints: [
    { col: 43, floorRow: 11 }, { col: 73, floorRow: 17 }, { col: 95, floorRow: 24 },
  ],
  grid: buildGrid(),
  hazards: [
    { col: 44,  floorRow: 5,  periodMs: 2000, onMs: 800, offset: 0    },
    { col: 68,  floorRow: 11, periodMs: 2000, onMs: 800, offset: 600  },
    { col: 88,  floorRow: 17, periodMs: 2000, onMs: 800, offset: 300  },
    { col: 106, floorRow: 24, periodMs: 2200, onMs: 850, offset: 1000 },
    { col: 124, floorRow: 24, periodMs: 2200, onMs: 850, offset: 400  },
  ],
  reinforcements: [
    { kind: 'crawler',   col: 86,  floorRow: 24 }, { kind: 'crawler', col: 100, floorRow: 24 },
    { kind: 'crawler',   col: 116, floorRow: 24 }, { kind: 'crawler', col: 140, floorRow: 24 },
    { kind: 'grenadier', col: 82,  floorRow: 24 },
  ],
  lights: [
    { col: 8,   row: 3,  radius: 6, intensity: 0.8,  color: 0xff5a4a, flicker: 0.3  },
    { col: 48,  row: 9,  radius: 5, intensity: 0.7,  color: 0xff8a4a, flicker: 0.25 },
    { col: 76,  row: 15, radius: 5, intensity: 0.7,  color: 0xff5a4a },
    { col: 90,  row: 22, radius: 6, intensity: 0.7,  color: 0xff8a4a, flicker: 0.3  },
    { col: 118, row: 22, radius: 6, intensity: 0.7,  color: 0xff5a4a },
    { col: 136, row: 21, radius: 9, intensity: 0.95, color: 0xffd23a, flicker: 0.4  },
    { col: 148, row: 22, radius: 6, intensity: 0.9,  color: 0x9fe8ff },
  ],
};
