import { LevelData } from './types';

// LEVEL 3 — "THE NEST". Bigger cavern: COLS 80→108, ROWS 28→36, platform spacing 3→4.
// Four tiers instead of three (an extra mid-platform D added). Wider platforms, longer traversal.
const COLS = 108, ROWS = 36;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const carve = (c0: number, c1: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const plat = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) set(c, fr, '#'); };
  const spikePit = (c0: number, c1: number, fr: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } };
  const ladder = (col: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) set(col, r, 'L'); };

  carve(2, 106, 3, 34);   // open cavern; bottom floor = row 35

  // four platforms (4-row spacing: rows 27, 22, 17, 11, 6)
  plat(27, 28, 86);   // platform A (wide ledge, lower)
  plat(22, 4,  58);   // platform B (mid-left) — NEW extra tier
  plat(17, 40, 106);  // platform C (mid-right, mirrored)
  plat(11, 4,  72);   // platform D (upper)
  plat(6,  42, 106);  // platform E — the Queen's perch

  // ladders (each spans exactly one tier gap)
  ladder(40, 27, 34);  // bottom → A
  ladder(32, 22, 26);  // A → B
  ladder(52, 17, 21);  // B → C
  ladder(50, 11, 16);  // C → D
  ladder(48, 6,  10);  // D → E

  // bottom chasm (6-wide: run-jump + grab)
  for (let c = 24; c <= 29; c++) set(c, 35, '.');
  spikePit(64, 66, 27);   // spike pit on platform A
  spikePit(24, 26, 22);   // spike pit on platform B

  // markers
  set(4,   34, 'P'); set(14, 34, 'y'); set(52, 34, 'c');       // bottom (+ SMG)
  set(44,  26, 'm'); set(70,  26, 'c'); set(60, 26, 'U');       // platform A (brute)
  set(14,  21, 'c'); set(36,  21, 'r'); set(50, 21, 'H');       // platform B (hunter) NEW
  set(56,  16, 'c'); set(80,  16, 'g'); set(96, 16, 'F');       // platform C (gundrone)
  set(20,  34, 'J');                                             // leaper on floor
  set(10,  10, 'c');                                             // guard on D
  set(56,  6,  'm'); set(76, 6, 'Q'); set(96, 6, 'E');          // platform E — THE QUEEN + portal-gate

  return g.map(r => r.join(''));
}

export const LEVEL3: LevelData = {
  id: 'level3',
  name: 'THE NEST',
  objective: 'Climb the alien cavern: chasm, acid, four laddered tiers. A swarm breach hits — kill THE QUEEN at the top.',
  block: 32,
  next: 'level4',
  intro: 'Through the portal — an alien world.',
  outro: 'You claw your way back to Earth…',
  bgColor: 0x0c0814,
  ambient: 0.74,
  alarmAtRow: 17,
  alarmMsg: '⚠ THE NEST WAKES — SWARM INCOMING',
  checkpoints: [
    { col: 32, floorRow: 27 }, { col: 4, floorRow: 22 },
    { col: 50, floorRow: 17 }, { col: 4, floorRow: 11 }, { col: 40, floorRow: 6 },
  ],
  grid: buildGrid(),
  hazards: [
    { col: 58, floorRow: 27, periodMs: 2200, onMs: 850, offset: 0   },
    { col: 36, floorRow: 22, periodMs: 2200, onMs: 850, offset: 700 },
    { col: 22, floorRow: 17, periodMs: 2200, onMs: 850, offset: 900 },
    { col: 60, floorRow: 11, periodMs: 2000, onMs: 800, offset: 400 },
  ],
  reinforcements: [
    { kind: 'crawler', col: 50,  floorRow: 35 }, { kind: 'crawler', col: 68,  floorRow: 27 },
    { kind: 'crawler', col: 20,  floorRow: 22 }, { kind: 'crawler', col: 44,  floorRow: 22 },
    { kind: 'crawler', col: 70,  floorRow: 17 }, { kind: 'crawler', col: 86,  floorRow: 11 },
    { kind: 'crawler', col: 80,  floorRow: 6  },
  ],
  lights: [
    { col: 8,  row: 33, radius: 6, intensity: 0.85, color: 0xb05aff, flicker: 0.3  },
    { col: 52, row: 25, radius: 6, intensity: 0.7,  color: 0x5affd0, flicker: 0.25 },
    { col: 24, row: 20, radius: 6, intensity: 0.7,  color: 0xb05aff },
    { col: 70, row: 15, radius: 5, intensity: 0.65, color: 0x5affd0, flicker: 0.3  },
    { col: 30, row: 9,  radius: 6, intensity: 0.7,  color: 0xb05aff, flicker: 0.2  },
    { col: 76, row: 5,  radius: 8, intensity: 0.9,  color: 0xff4ad0, flicker: 0.35 },
    { col: 96, row: 5,  radius: 6, intensity: 0.9,  color: 0xff4ad0, flicker: 0.2  },
  ],
};
