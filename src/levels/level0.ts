import { LevelData } from './types';

// LEVEL 0 — "INFILTRATION". A VERY BIG claustrophobic climb-in: eleven tight 3-high corridors carved
// through solid rock, joined by 1-wide ladder shafts in a tall switchback. Unarmed the whole way —
// soldiers patrol every corridor, so duck into shadow (hold C), time your move, jump the gaps, and climb
// all the way up to the exit. Soldiers only.
const COLS = 84, ROWS = 62;
const FLOORS = [56, 51, 46, 41, 36, 31, 26, 21, 16, 11, 6]; // bottom → top (spawn at the bottom)

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const corr = (fr: number, c0: number, c1: number) => { for (let r = fr - 3; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const shaft = (col: number, frU: number, frL: number) => { for (let r = frU; r <= frL - 1; r++) set(col, r, 'L'); }; // upper floor → above lower floor
  const pit = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } };

  for (let i = 0; i < FLOORS.length; i++) corr(FLOORS[i], 4, 80);
  // switchback ladder shafts: alternate right/left, climbing UP each corridor
  for (let i = 0; i < FLOORS.length - 1; i++) shaft(i % 2 === 0 ? 80 : 5, FLOORS[i + 1], FLOORS[i]);
  // a spike-pit jump in every corridor (alternating side)
  for (let i = 0; i < FLOORS.length; i++) { const c = i % 2 === 0 ? 30 : 54; pit(FLOORS[i], c, c + 2); }

  // markers (standing cell = floorRow - 1)
  set(4, FLOORS[0] - 1, 'P');                                  // spawn — UNARMED, bottom-left
  for (let i = 0; i < FLOORS.length; i++) {
    const row = FLOORS[i] - 1;
    const isLast = i === FLOORS.length - 1;
    if (i > 0) set(i % 2 === 0 ? 55 : 25, row, 'g');           // a soldier on each corridor (not the spawn one)
    set(i % 2 === 0 ? 18 : 62, row, 'h');                      // a shadow niche to hide in
    if (i === 0) set(48, row, 'g');                            // one guard on the spawn corridor (far from spawn)
    if (isLast) set(78, row, 'E');                             // EXIT at the top
  }

  return g.map(r => r.join(''));
}

export const LEVEL0: LevelData = {
  id: 'level0',
  name: 'INFILTRATION',
  objective: 'UNARMED. A long climb up tight tunnels — soldiers patrol every level. Hide in shadow (hold C), jump the spike pits, and reach the top unseen.',
  block: 32,
  next: 'level1',
  intro: 'SITE ECHO — climb in unseen. No weapons. Stay in the dark.',
  outro: 'You reach the shaft… now find a weapon.',
  startUnarmed: true,
  bgColor: 0x06080d,
  ambient: 0.64,                 // dark — you vanish in shadow anywhere a lamp isn't shining
  alarmAtRow: 14,                // nearing the top tightens the patrols
  alarmMsg: '⚠ MOVEMENT DETECTED — SWEEPING',
  checkpoints: [
    { col: 80, floorRow: 51 }, { col: 5, floorRow: 41 }, { col: 80, floorRow: 31 },
    { col: 5, floorRow: 21 }, { col: 80, floorRow: 11 },
  ],
  grid: buildGrid(),
  reinforcements: [
    { kind: 'guard', col: 40, floorRow: 26 }, { kind: 'guard', col: 40, floorRow: 16 },
    { kind: 'guard', col: 40, floorRow: 11 },
  ],
  lights: [
    { col: 78, row: 54, radius: 5, intensity: 0.8, flicker: 0.2 },
    { col: 7,  row: 49, radius: 5, intensity: 0.8 },
    { col: 78, row: 44, radius: 5, intensity: 0.8, flicker: 0.15 },
    { col: 7,  row: 39, radius: 5, intensity: 0.8 },
    { col: 78, row: 34, radius: 5, intensity: 0.8, flicker: 0.2 },
    { col: 7,  row: 29, radius: 5, intensity: 0.8 },
    { col: 78, row: 24, radius: 5, intensity: 0.8, flicker: 0.15 },
    { col: 7,  row: 19, radius: 5, intensity: 0.8 },
    { col: 78, row: 14, radius: 5, intensity: 0.8, flicker: 0.2 },
    { col: 76, row: 5,  radius: 6, intensity: 0.9, color: 0x9fe8ff }, // exit glow
  ],
};
