import { LevelData } from './types';

// LEVEL 2 — "THE HIVE". Claustrophobic switchback descent: solid rock with only tight 3-high corridors
// and 1-wide ladder shafts carved through it — walls on every side except the path. Jump the spike pits,
// beat the timed bulkhead, descend seven corridors to SUBJECT ZERO in a sealed chamber.
const COLS = 72, ROWS = 40;
const HIVE = 0x6affb0;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const corr = (fr: number, c0: number, c1: number) => { for (let r = fr - 3; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); }; // 3-high tunnel, floor fr stays solid
  const room = (fr: number, c0: number, c1: number, h: number) => { for (let r = fr - h; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const shaft = (col: number, frU: number, frL: number) => { for (let r = frU; r <= frL - 1; r++) set(col, r, 'L'); }; // 1-wide ladder shaft, upper floor → above lower floor
  const pit = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } }; // spike pit in the floor (jump it)

  // seven corridors (floors 5,10,15,20,25,30; boss chamber 35)
  corr(5, 3, 66); corr(10, 5, 66); corr(15, 5, 66); corr(20, 5, 66); corr(25, 5, 66); corr(30, 5, 66);
  room(35, 4, 66, 4);                                  // boss chamber (taller)

  // ladder shafts — alternating ends = a switchback you walk end-to-end each floor
  shaft(64, 5, 10); shaft(7, 10, 15); shaft(64, 15, 20); shaft(7, 20, 25); shaft(64, 25, 30); shaft(7, 30, 35);

  // spike-pit jumps along the path
  pit(5, 30, 32); pit(10, 40, 42); pit(15, 30, 34); pit(20, 44, 46); pit(25, 26, 28); pit(30, 40, 42);

  // PoP TIMED bulkhead in C4 (you traverse it right→left): plate at col 50 opens the gate at col 30
  for (let r = 17; r <= 19; r++) g[r][30] = '#';

  // markers (standing cell = floorRow - 1)
  set(4, 4, 'P'); set(10, 4, 'a'); set(16, 4, 'x'); set(40, 4, 'g'); set(56, 4, 'c');   // C1 (+ SHOTGUN)
  set(50, 9, 'r'); set(28, 9, 'c'); set(14, 9, 'g');                                     // C2
  set(20, 14, 'c'); set(44, 14, 'g'); set(60, 14, 'G');                                  // C3 (+ burst-trooper)
  set(54, 19, 'c'); set(24, 19, 'H');                                                    // C4 (+ hunter)
  set(20, 24, 'c'); set(50, 24, 'm'); set(60, 24, 'D');                                  // C5 (+ medkit, drone)
  set(40, 29, 'c'); set(20, 29, 'g');                                                    // C6
  set(10, 34, 'm'); set(40, 34, 'Z'); set(60, 34, 'E');                                  // boss chamber: SUBJECT ZERO + exit

  return g.map(r => r.join(''));
}

export const LEVEL2: LevelData = {
  id: 'level2',
  name: 'THE HIVE',
  objective: 'Descend the hive: tight tunnels, spike-pit jumps, ladder shafts, a timed bulkhead. Kill SUBJECT ZERO to open the gate.',
  block: 32,
  next: 'level3',
  intro: 'THE HIVE — they nested in the dungeon. Tight, dark, and crawling.',
  outro: 'A portal pulses beyond the gate…',
  bgColor: 0x0a0c08,
  ambient: 0.74,
  alarmAtRow: 15,                 // descending past the third corridor trips the breach
  alarmMsg: '⚠ HIVE BREACH — THEY POUR IN',
  checkpoints: [
    { col: 62, floorRow: 10 }, { col: 9, floorRow: 15 }, { col: 62, floorRow: 20 },
    { col: 9, floorRow: 25 }, { col: 62, floorRow: 30 },
  ],
  gates: [{ id: 1, col: 30, row0: 17, row1: 19, openMs: 6000, color: 0x4aff6a }],
  plates: [{ id: 1, col: 50, floorRow: 20, color: 0x4aff6a }],
  grid: buildGrid(),
  hazards: [
    { col: 50, floorRow: 10, periodMs: 2400, onMs: 900, offset: 0    },
    { col: 20, floorRow: 15, periodMs: 2400, onMs: 900, offset: 1100 },
    { col: 50, floorRow: 25, periodMs: 2200, onMs: 850, offset: 600  },
    { col: 30, floorRow: 30, periodMs: 2000, onMs: 800, offset: 300  },
  ],
  reinforcements: [
    { kind: 'crawler', col: 60, floorRow: 15 }, { kind: 'crawler', col: 20, floorRow: 15 },
    { kind: 'crawler', col: 60, floorRow: 20 }, { kind: 'crawler', col: 20, floorRow: 25 },
    { kind: 'crawler', col: 60, floorRow: 30 }, { kind: 'crawler', col: 40, floorRow: 35 },
  ],
  lights: [
    { col: 8,  row: 3,  radius: 6, intensity: 0.85, color: HIVE, flicker: 0.3  },
    { col: 62, row: 8,  radius: 5, intensity: 0.7,  color: HIVE, flicker: 0.25 },
    { col: 9,  row: 13, radius: 5, intensity: 0.7,  color: HIVE },
    { col: 62, row: 18, radius: 5, intensity: 0.7,  color: HIVE, flicker: 0.3  },
    { col: 9,  row: 23, radius: 5, intensity: 0.7,  color: HIVE },
    { col: 62, row: 28, radius: 5, intensity: 0.7,  color: HIVE, flicker: 0.2  },
    { col: 40, row: 32, radius: 8, intensity: 0.85, color: 0xff3a2a, flicker: 0.35 },
    { col: 60, row: 32, radius: 6, intensity: 0.9,  color: 0xff3a2a, flicker: 0.2  },
  ],
};
