import { LevelData } from './types';

// LEVEL 0 — "INFILTRATION". Unarmed ascent. Six-ledge serpentine (was four) — longer ledges,
// two extra horizontal gaps, two extra vertical grabs. Soldiers patrol each tier.
const COLS = 84, ROWS = 30;
// Serpentine: base(27)→A(24,left)→jump→B(24,right)→climb→C(21,right)→jump→D(21,left)
//             →climb→E(18,left)→jump→F(18,right)→climb→G(15,left)→exit

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const carve = (c0: number, c1: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const plat = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) set(c, fr, '#'); };

  carve(2, 81, 1, 26);   // open the whole interior above the base floor (row 27)

  // ledges — 3 rows apart (jump-up grab reaches exactly 3)
  plat(24, 2, 28);   // A — left;  base(27)→A(24): climb at right-edge of A (col 28)
  plat(24, 35, 81);  // B — right; A→B gap 29-34 (6-wide run-jump)
  plat(21, 47, 81);  // C — right; B(24)→C(21): climb at left-edge of C (col 47)
  plat(21, 2, 40);   // D — left;  C→D gap 41-46 (6-wide run-jump left)
  plat(18, 2, 22);   // E — left;  D(21)→E(18): climb at right-edge of E (col 22)
  plat(18, 29, 81);  // F — right; E→F gap 23-28 (6-wide run-jump)
  plat(15, 2, 29);   // G — left;  F(18)→G(15): climb at left-edge of F (col 29); exit ledge

  // border
  for (let r = 0; r < ROWS; r++) { set(0, r, '#'); set(1, r, '#'); set(COLS-2, r, '#'); set(COLS-1, r, '#'); }
  for (let c = 0; c < COLS; c++) { set(c, 0, '#'); set(c, 1, '#'); set(c, ROWS-2, '#'); set(c, ROWS-1, '#'); }

  // markers (standing cell = floorRow - 1)
  set(4,  26, 'P');                                  // spawn — UNARMED, base floor
  set(45, 26, 'g'); set(12, 26, 'h');                // base patrol + shadow pocket
  set(56, 23, 'g'); set(38, 23, 'h');                // B patrol + niche
  set(65, 20, 'g');                                  // C sentry (right wall)
  set(20, 20, 'g'); set(8,  20, 'h');                // D patrol + niche
  set(55, 17, 'g');                                  // F patrol
  set(18, 17, 'h');                                  // shadow on E
  set(20, 14, 'g');                                  // G guard before exit
  set(4,  14, 'E');                                  // EXIT — top-left ledge G (row 15)

  return g.map(r => r.join(''));
}

export const LEVEL0: LevelData = {
  id: 'level0',
  name: 'INFILTRATION',
  objective: 'UNARMED. Six ledge tiers — climb and run-jump the gaps to the top. Soldiers patrol every tier; hide in shadow (hold C) and time every move.',
  block: 32,
  next: 'level1',
  intro: 'SITE ECHO — climb in unseen. No weapons. Stay in the dark.',
  outro: 'You haul up to the shaft… now find a weapon.',
  startUnarmed: true,
  bgColor: 0x06080d,
  ambient: 0.62,
  grid: buildGrid(),
  lights: [
    { col: 10, row: 26, radius: 5, intensity: 0.8,  flicker: 0.15 },
    { col: 28, row: 24, radius: 5, intensity: 0.85 },                // base→A climb
    { col: 38, row: 23, radius: 5, intensity: 0.8,  flicker: 0.2  }, // A→B landing
    { col: 47, row: 20, radius: 5, intensity: 0.85 },                // B→C climb
    { col: 24, row: 20, radius: 5, intensity: 0.8,  flicker: 0.15 }, // D patrol light
    { col: 29, row: 17, radius: 5, intensity: 0.85 },                // E→F climb
    { col: 18, row: 17, radius: 5, intensity: 0.8,  flicker: 0.2  }, // F→G climb zone
    { col: 5,  row: 14, radius: 5, intensity: 0.9,  color: 0x9fe8ff }, // exit glow
  ],
};
