import { LevelData } from './types';
import { buildShaft } from './tower';

// LEVEL 4 — "OCCUPIED EARTH". A tight vertical descent down a bunker shaft: short ledges zig-zagging
// down, close-quarters fights, a timed shutter, ending in THE COMMANDER's chamber + extraction.
const COLS = 28, ROWS = 56;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const led = buildShaft(g, COLS, ROWS, 5, 15);
  for (let r = 48; r <= 50; r++) for (let c = 2; c <= 25; c++) set(c, r, '.'); // COMMANDER chamber (floor 51)
  for (let r = 24; r <= 25; r++) set(14, r, '#');                              // timed shutter on ledge 7

  const L = led;
  set(4, L[0].row - 1, 'P'); set(20, L[1].row - 1, 'z');     // spawn + RIFLE
  set(8, L[2].row - 1, 'r');                                  // GRENADE THROWER early
  set(18, L[3].row - 1, 'R'); set(18, L[5].row - 1, 'D');     // burst-trooper, drone
  set(8, L[6].row - 1, 'g'); set(18, L[8].row - 1, 'B');      // bomber
  set(14, L[10].row - 1, 'N'); set(8, L[12].row - 1, 'g'); set(18, L[13].row - 1, 'c'); // sniper
  set(8, 50, 'm'); set(14, 50, 'K'); set(20, 50, 'E');       // chamber: THE COMMANDER + extraction

  return g.map(r => r.join(''));
}

export const LEVEL4: LevelData = {
  id: 'level4',
  name: 'OCCUPIED EARTH',
  objective: 'Down the occupied shaft: climb ledge to ledge, fight close, beat the timed shutter. Kill THE COMMANDER to reach extraction.',
  block: 32,
  next: 'level5',
  intro: 'OCCUPIED EARTH — they boxed it in and went underground.',
  outro: 'Down into the hive core…',
  bgColor: 0x0d1016,
  ambient: 0.6,
  alarmAtRow: 23,
  alarmMsg: '⚠ OCCUPATION ALERTED — REINFORCEMENTS IN',
  checkpoints: [{ col: 14, floorRow: 17 }, { col: 14, floorRow: 32 }, { col: 14, floorRow: 44 }],
  gates: [{ id: 1, col: 14, row0: 24, row1: 25, openMs: 6000, color: 0x4aff6a }],
  plates: [{ id: 1, col: 8, floorRow: 23, color: 0x4aff6a }],
  grid: buildGrid(),
  hazards: [
    { col: 12, floorRow: 20, periodMs: 2200, onMs: 850, offset: 0 },
    { col: 16, floorRow: 38, periodMs: 2200, onMs: 850, offset: 700 },
  ],
  reinforcements: [
    { kind: 'guard', col: 8, floorRow: 51 }, { kind: 'crawler', col: 20, floorRow: 51 },
    { kind: 'guard', col: 14, floorRow: 32 }, { kind: 'grenadier', col: 14, floorRow: 44 },
  ],
  lights: [
    { col: 8,  row: 4,  radius: 6, intensity: 0.7, color: 0xbfe0ff },
    { col: 20, row: 13, radius: 5, intensity: 0.7, color: 0xffd8a0, flicker: 0.3 },
    { col: 8,  row: 22, radius: 5, intensity: 0.7, color: 0xbfe0ff },
    { col: 20, row: 31, radius: 5, intensity: 0.7, color: 0xffd8a0, flicker: 0.25 },
    { col: 8,  row: 40, radius: 5, intensity: 0.7, color: 0xbfe0ff },
    { col: 14, row: 49, radius: 8, intensity: 0.9, color: 0xff5a3a, flicker: 0.3 },
  ],
};
