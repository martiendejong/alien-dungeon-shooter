import { LevelData } from './types';

// LEVEL 4 — "OCCUPIED EARTH". Claustrophobic bunker switchback: three tight corridors carved through
// solid, joined by 1-wide ladder shafts. Snake top→bottom and across, jump the spike pits, beat the
// timed shutter, and push to THE COMMANDER's chamber + extraction at the far end.
const COLS = 140, ROWS = 26;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const corr = (fr: number, c0: number, c1: number) => { for (let r = fr - 3; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const room = (fr: number, c0: number, c1: number, h: number) => { for (let r = fr - h; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const shaft = (col: number, frU: number, frL: number) => { for (let r = frU; r <= frL - 1; r++) set(col, r, 'L'); };
  const pit = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } };

  corr(7, 3, 134); corr(14, 6, 132); corr(21, 6, 134);  // three corridors
  room(21, 118, 134, 5);                                  // COMMANDER chamber (taller, right end of C3)
  shaft(132, 7, 14); shaft(8, 14, 21);                    // switchback shafts

  pit(7, 40, 42); pit(7, 88, 90); pit(14, 50, 52); pit(14, 100, 104); pit(21, 40, 42); pit(21, 96, 98);

  // PoP TIMED shutter in C2 (traversed right→left): plate at col 100 opens the gate at col 60
  for (let r = 11; r <= 13; r++) g[r][60] = '#';

  // markers (standing cell = floorRow - 1)
  set(4, 6, 'P'); set(14, 6, 'z'); set(30, 6, 'g'); set(50, 6, 'R'); set(70, 6, 'g'); set(96, 6, 'D'); // C1 (+ RIFLE)
  set(110, 13, 'g'); set(80, 13, 'B'); set(40, 13, 'N'); set(20, 13, 'g');                              // C2 (+ bomber, sniper)
  set(30, 20, 'g'); set(60, 20, 'r'); set(90, 20, 'c'); set(108, 20, 'm');                              // C3
  set(124, 20, 'K'); set(132, 20, 'E');                                                                  // THE COMMANDER + extraction

  return g.map(r => r.join(''));
}

export const LEVEL4: LevelData = {
  id: 'level4',
  name: 'OCCUPIED EARTH',
  objective: 'Tight occupied bunkers: switchback corridors, spike-pit jumps, a timed shutter. Kill THE COMMANDER to reach extraction.',
  block: 32,
  next: 'level5',
  intro: 'OCCUPIED EARTH — they got here first, and they boxed it in.',
  outro: 'Down into the hive core…',
  bgColor: 0x0d1016,
  ambient: 0.55,
  alarmAtRow: 14,
  alarmMsg: '⚠ OCCUPATION ALERTED — REINFORCEMENTS IN',
  checkpoints: [{ col: 130, floorRow: 14 }, { col: 9, floorRow: 21 }],
  gates: [{ id: 1, col: 60, row0: 11, row1: 13, openMs: 9000, color: 0x4aff6a }],
  plates: [{ id: 1, col: 100, floorRow: 14, color: 0x4aff6a }],
  grid: buildGrid(),
  hazards: [
    { col: 60, floorRow: 7,  periodMs: 2400, onMs: 900, offset: 0    },
    { col: 70, floorRow: 14, periodMs: 2400, onMs: 900, offset: 800  },
    { col: 70, floorRow: 21, periodMs: 2200, onMs: 850, offset: 1300 },
  ],
  reinforcements: [
    { kind: 'guard', col: 60, floorRow: 7 }, { kind: 'guard', col: 60, floorRow: 14 },
    { kind: 'grenadier', col: 40, floorRow: 21 }, { kind: 'crawler', col: 90, floorRow: 21 },
    { kind: 'guard', col: 110, floorRow: 21 },
  ],
  lights: [
    { col: 10,  row: 5,  radius: 6, intensity: 0.7, color: 0xbfe0ff },
    { col: 130, row: 5,  radius: 5, intensity: 0.7, color: 0xffd8a0, flicker: 0.3 },
    { col: 10,  row: 12, radius: 5, intensity: 0.7, color: 0xbfe0ff },
    { col: 110, row: 12, radius: 5, intensity: 0.7, color: 0xffd8a0, flicker: 0.25 },
    { col: 60,  row: 19, radius: 6, intensity: 0.7, color: 0xbfe0ff },
    { col: 124, row: 18, radius: 7, intensity: 0.9, color: 0xff5a3a, flicker: 0.3 },
    { col: 132, row: 18, radius: 6, intensity: 0.9, color: 0x9fe8ff },
  ],
};
