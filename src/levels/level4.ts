import { LevelData } from './types';

// LEVEL 4 — "OCCUPIED EARTH". Longer street: COLS 160→210, ROWS 18→24. Extra headroom on both
// the street and the rooftop (4-row spacing). Five gaps instead of four. Taller bottom lane.
const COLS = 210, ROWS = 24;
const FR = 17;  // street floor row (was 13, now 17 — taller building)
const BR = 22;  // bottom-lane floor row (was 17, now 22)

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const carve = (c0: number, c1: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const gap = (c0: number, c1: number) => carve(c0, c1, FR, BR - 1);
  const spikePit = (c0: number, c1: number) => { for (let c = c0; c <= c1; c++) { set(c, FR, '.'); set(c, FR + 1, 'S'); } };

  carve(2, 206, FR - 4, FR - 1);  // street headroom (rows 13-16, 4 rows)
  carve(2, 206, FR + 1, BR - 1);  // bottom lane (rows 18-21)
  gap(32, 36); gap(64, 68); gap(100, 104); gap(136, 140); gap(168, 172); // five gaps (was four)
  spikePit(52, 54); spikePit(118, 120); spikePit(152, 154);              // three spike fields (was two)
  // PoP TIMED GATE: shutter at col 112 seals the street; plate at col 50
  for (let r = FR - 4; r <= FR - 1; r++) set(112, r, '#');

  // BOSS ARENA — wider rooftop, reached by ladder from street end
  carve(174, 206, 8, 12);                          // rooftop (floor 13, 5 rows tall)
  for (let r = 13; r <= 16; r++) set(182, r, 'L'); // ladder up from street

  set(4,  16, 'P'); set(14, 16, 'z'); set(24, 16, 'g'); set(46, 16, 'r'); set(60, 16, 'g'); // approach
  set(80, 16, 'g'); set(110, 16, 'r'); set(128, 16, 'g'); set(158, 16, 'c');               // mid + alien
  set(42, 16, 'R'); set(76, 16, 'D'); set(92, 16, 'B'); set(122, 16, 'N');                 // burst-trooper, drone, bomber, sniper
  set(165, 16, 'g'); set(174, 16, 'r');                                                     // final street push
  set(186, 12, 'm'); set(192, 12, 'K'); set(200, 12, 'E');                                 // medkit + THE COMMANDER + extraction

  return g.map(r => r.join(''));
}

export const LEVEL4: LevelData = {
  id: 'level4',
  name: 'OCCUPIED EARTH',
  objective: 'Longer streets, five gaps, three spike fields. Run-jump the occupation, kill THE COMMANDER to reach extraction.',
  block: 32,
  next: 'level5',
  intro: 'OCCUPIED EARTH — they got here first.',
  outro: 'Down into the hive core…',
  bgColor: 0x0d1016,
  ambient: 0.5,
  alarmAtCol: 88,
  alarmMsg: '⚠ OCCUPATION ALERTED — REINFORCEMENTS IN',
  searchlights: [{ x0: 20 * 32, x1: 160 * 32, y: 13 * 32, speed: 110 }],
  checkpoints: [
    { col: 42,  floorRow: FR }, { col: 105, floorRow: FR },
    { col: 145, floorRow: FR }, { col: 170, floorRow: FR }, { col: 182, floorRow: 13 },
  ],
  gates: [{ id: 1, col: 112, row0: FR - 4, row1: FR - 1, openMs: 12000 }],
  plates: [{ id: 1, col: 76, floorRow: FR }],
  grid: buildGrid(),
  hazards: [
    { col: 42,  floorRow: FR, periodMs: 2400, onMs: 900, offset: 0    },
    { col: 80,  floorRow: FR, periodMs: 2400, onMs: 900, offset: 800  },
    { col: 116, floorRow: FR, periodMs: 2200, onMs: 850, offset: 1300 },
    { col: 148, floorRow: FR, periodMs: 2200, onMs: 850, offset: 500  },
  ],
  reinforcements: [
    { kind: 'guard',     col: 96,  floorRow: FR }, { kind: 'guard',     col: 130, floorRow: FR },
    { kind: 'grenadier', col: 156, floorRow: FR }, { kind: 'crawler',   col: 74,  floorRow: FR },
    { kind: 'guard',     col: 164, floorRow: FR },
  ],
  lights: [
    { col: 10,  row: 15, radius: 6, intensity: 0.7,  color: 0xbfe0ff },
    { col: 50,  row: 15, radius: 6, intensity: 0.7,  color: 0xffd8a0, flicker: 0.3  },
    { col: 96,  row: 15, radius: 6, intensity: 0.7,  color: 0xbfe0ff },
    { col: 136, row: 15, radius: 6, intensity: 0.7,  color: 0xffd8a0, flicker: 0.25 },
    { col: 172, row: 15, radius: 6, intensity: 0.7,  color: 0xbfe0ff },
    { col: 192, row: 11, radius: 7, intensity: 0.9,  color: 0xff5a3a, flicker: 0.3  },
    { col: 200, row: 11, radius: 6, intensity: 0.9,  color: 0x9fe8ff },
  ],
};
