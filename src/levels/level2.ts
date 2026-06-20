import { LevelData } from './types';

// LEVEL 2 — "THE HIVE". Bigger descent: COLS 130→170, ROWS 24→30, floor spacing 3→4.
// Six corridors (was five), longer corridors, wider boss arena.
const COLS = 170, ROWS = 30;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const carve = (c0: number, c1: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const spikePit = (c0: number, c1: number, fr: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } };

  // Six corridors, 4-row spacing (floors at rows 5, 9, 13, 17, 21, 25)
  carve(2,   50,  2,  4);    // corridor 1 (floor 5)
  carve(24,  74,  6,  8);    // corridor 2 (floor 9)
  carve(48,  98,  10, 12);   // corridor 3 (floor 13)
  carve(72,  120, 14, 16);   // corridor 4 (floor 17)
  carve(96,  148, 18, 20);   // corridor 5 (floor 21)
  carve(118, 166, 22, 24);   // corridor 6 (floor 25) — NEW extra floor
  // climb-down connectors (2-wide shafts)
  carve(37, 38, 5, 8);   // c1 → c2
  carve(61, 62, 9, 12);  // c2 → c3
  carve(85, 86, 13, 16); // c3 → c4
  carve(109, 110, 17, 20); // c4 → c5
  carve(133, 134, 21, 24); // c5 → c6

  spikePit(16, 18, 5);
  spikePit(46, 48, 9);
  spikePit(70, 72, 13);
  spikePit(94, 96, 17);
  spikePit(128, 130, 21);
  spikePit(148, 150, 25);   // new hazard in c6
  // 6-wide chasm before the boss ladder (grab the edge)
  for (let c = 128; c <= 133; c++) for (let r = 25; r < ROWS; r++) set(c, r, '.');

  // BOSS ARENA — sealed chamber above c6, reached by a ladder
  carve(140, 166, 18, 20);                        // arena room (floor 21 — same as c5)
  for (let r = 21; r <= 24; r++) set(148, r, 'L'); // ladder up from c6 into the arena

  // markers
  set(4,  4,  'P'); set(12, 4, 'a'); set(20, 4, 'x'); set(28, 4, 'c'); set(44, 4, 'g'); // c1 + SHOTGUN
  set(30, 8,  'm'); set(38, 8, 'r'); set(54, 8, 'g'); set(68, 8, 'c');                  // c2
  set(56, 12, 'c'); set(76, 12, 'g'); set(88, 12, 'c');                                 // c3
  set(42, 8,  'G'); set(60, 12, 'H'); set(82, 12, 'D');                                 // burst-trooper, hunter, drone
  set(88, 16, 'a'); set(102, 16, 'c'); set(116, 16, 'g');                               // c4
  set(106, 20, 'c'); set(118, 20, 'm'); set(130, 20, 'm');                              // c5
  set(122, 24, 'c'); set(136, 24, 'm'); set(144, 24, 'c');                              // c6 (new)
  set(152, 20, 'm'); set(158, 20, 'Z'); set(162, 20, 'E');                              // SUBJECT ZERO + exit in arena

  // PoP TIMED GATE in corridor 3: button at col 64 opens bulkhead at col 76
  for (let r = 10; r <= 12; r++) g[r][76] = '#';

  return g.map(r => r.join(''));
}

export const LEVEL2: LevelData = {
  id: 'level2',
  name: 'THE HIVE',
  objective: 'Descend six corridors: spike pits, flame jets, the chasm. A breach floods crawlers — kill SUBJECT ZERO to open the gate.',
  block: 32,
  next: 'level3',
  intro: 'THE HIVE — they nested in the dungeon.',
  outro: 'A portal pulses beyond the gate…',
  bgColor: 0x0a0c08,
  ambient: 0.72,
  alarmAtCol: 60,
  alarmMsg: '⚠ HIVE BREACH — THEY POUR IN',
  checkpoints: [
    { col: 38, floorRow: 9 }, { col: 62, floorRow: 13 },
    { col: 86, floorRow: 17 }, { col: 110, floorRow: 21 }, { col: 148, floorRow: 21 },
  ],
  gates: [{ id: 1, col: 76, row0: 10, row1: 12, openMs: 6000, color: 0x4aff6a }],
  plates: [{ id: 1, col: 64, floorRow: 13, color: 0x4aff6a }],
  grid: buildGrid(),
  hazards: [
    { col: 56, floorRow: 9,  periodMs: 2400, onMs: 900, offset: 0    },
    { col: 80, floorRow: 13, periodMs: 2400, onMs: 900, offset: 1100 },
    { col: 104, floorRow: 17, periodMs: 2200, onMs: 850, offset: 600 },
    { col: 124, floorRow: 21, periodMs: 2200, onMs: 850, offset: 300 }, // c5 jet
    { col: 140, floorRow: 25, periodMs: 2000, onMs: 800, offset: 800 }, // c6 jet (new)
  ],
  reinforcements: [
    { kind: 'crawler', col: 62,  floorRow: 13 }, { kind: 'crawler', col: 90,  floorRow: 13 },
    { kind: 'crawler', col: 80,  floorRow: 17 }, { kind: 'crawler', col: 112, floorRow: 17 },
    { kind: 'crawler', col: 104, floorRow: 21 }, { kind: 'crawler', col: 136, floorRow: 21 },
    { kind: 'crawler', col: 128, floorRow: 25 }, { kind: 'crawler', col: 152, floorRow: 21 },
  ],
  lights: [
    { col: 8,   row: 3,  radius: 6, intensity: 0.85, color: 0x6affb0, flicker: 0.3  },
    { col: 38,  row: 7,  radius: 5, intensity: 0.7,  color: 0x6affb0, flicker: 0.25 },
    { col: 62,  row: 11, radius: 5, intensity: 0.7,  color: 0x6affb0 },
    { col: 86,  row: 15, radius: 5, intensity: 0.7,  color: 0x6affb0, flicker: 0.3  },
    { col: 110, row: 19, radius: 5, intensity: 0.7,  color: 0x6affb0 },
    { col: 134, row: 23, radius: 5, intensity: 0.7,  color: 0x6affb0, flicker: 0.2  },
    { col: 152, row: 19, radius: 7, intensity: 0.85, color: 0xff3a2a, flicker: 0.35 },
    { col: 160, row: 19, radius: 6, intensity: 0.9,  color: 0xff3a2a, flicker: 0.2  },
  ],
};
