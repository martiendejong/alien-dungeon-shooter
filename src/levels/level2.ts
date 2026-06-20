import { LevelData } from './types';
import { buildShaft } from './tower';

// LEVEL 2 — "THE HIVE". A tight VERTICAL climb-shaft, not a long corridor: short ledges zig-zagging down
// a narrow chute. You descend by climbing DOWN ledge to ledge (and the odd jump), fighting enemies at
// close range with no long sightlines. SUBJECT ZERO waits in the chamber at the bottom.
const COLS = 28, ROWS = 56;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const led = buildShaft(g, COLS, ROWS, 5, 15);             // 15 ledges, rows 5..47
  // boss chamber at the bottom
  for (let r = 48; r <= 50; r++) for (let c = 2; c <= 25; c++) set(c, r, '.'); // floor 51

  // a timed bulkhead on ledge 7: plate on ledge 6 opens it — climb down and beat it to the next drop
  for (let r = 24; r <= 25; r++) set(14, r, '#');
  // LOOSE TILES — stand too long and they crumble, dropping you to the ledge below (col 14 = ledge overlap)
  set(14, led[5].row, 'T'); set(14, led[8].row, 'T'); set(14, led[11].row, 'T');

  // markers (standing cell = ledge.row - 1)
  set(4, led[0].row - 1, 'P');                              // spawn (top)
  set(20, led[1].row - 1, 'x');                             // SHOTGUN
  set(8, led[2].row - 1, 'r'); set(12, led[4].row - 1, 'r'); // GRENADE THROWERS — early
  set(16, led[3].row - 1, 'c'); set(20, led[5].row - 1, 'g');
  set(18, led[8].row - 1, 'c'); set(18, led[10].row - 1, 'G'); // burst-trooper
  set(14, led[12].row - 1, 'H'); set(18, led[13].row - 1, 'D'); set(8, led[14].row - 1, 'c'); // hunter, drone
  set(8, 50, 'm'); set(14, 50, 'Z'); set(20, 50, 'E');      // chamber: SUBJECT ZERO + exit

  return g.map(r => r.join(''));
}

export const LEVEL2: LevelData = {
  id: 'level2',
  name: 'THE HIVE',
  objective: 'Down the chute: climb ledge to ledge, fight close, beat the timed bulkhead. Kill SUBJECT ZERO at the bottom.',
  block: 32,
  next: 'level3',
  intro: 'THE HIVE — a vertical wound in the rock. Down you go.',
  outro: 'A portal pulses beyond the gate…',
  bgColor: 0x0a0c08,
  ambient: 0.74,
  alarmAtRow: 23,
  alarmMsg: '⚠ HIVE BREACH — THEY POUR IN',
  checkpoints: [{ col: 14, floorRow: 17 }, { col: 14, floorRow: 32 }, { col: 14, floorRow: 44 }],
  gates: [{ id: 1, col: 14, row0: 24, row1: 25, openMs: 6000, color: 0x4aff6a }],
  plates: [{ id: 1, col: 8, floorRow: 23, color: 0x4aff6a }],
  grid: buildGrid(),
  hazards: [
    { col: 12, floorRow: 20, periodMs: 2200, onMs: 850, offset: 0, kind: 'spike' },
    { col: 16, floorRow: 35, periodMs: 2200, onMs: 850, offset: 700 },
    { col: 10, floorRow: 44, periodMs: 1800, onMs: 700, offset: 300, kind: 'spike' },
  ],
  reinforcements: [
    { kind: 'crawler', col: 8, floorRow: 51 }, { kind: 'crawler', col: 20, floorRow: 51 },
    { kind: 'crawler', col: 14, floorRow: 32 }, { kind: 'crawler', col: 14, floorRow: 44 },
  ],
  lights: [
    { col: 8,  row: 4,  radius: 6, intensity: 0.85, color: 0x6affb0, flicker: 0.3 },
    { col: 20, row: 13, radius: 5, intensity: 0.7,  color: 0x6affb0 },
    { col: 8,  row: 22, radius: 5, intensity: 0.7,  color: 0x6affb0, flicker: 0.25 },
    { col: 20, row: 31, radius: 5, intensity: 0.7,  color: 0x6affb0 },
    { col: 8,  row: 40, radius: 5, intensity: 0.7,  color: 0x6affb0, flicker: 0.3 },
    { col: 14, row: 49, radius: 8, intensity: 0.85, color: 0xff3a2a, flicker: 0.35 },
  ],
};
