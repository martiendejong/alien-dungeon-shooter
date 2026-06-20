import { LevelData } from './types';

// LEVEL 5 — "THE OVERMIND". Claustrophobic switchback descent down tight tunnels, then it OPENS into a
// vast boss arena at the very bottom where THE OVERMIND waits — the one big room in the whole game, the
// release after the squeeze. Kill it to go home.
const COLS = 96, ROWS = 36;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const corr = (fr: number, c0: number, c1: number) => { for (let r = fr - 3; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const room = (fr: number, c0: number, c1: number, h: number) => { for (let r = fr - h; r <= fr - 1; r++) for (let c = c0; c <= c1; c++) set(c, r, '.'); };
  const shaft = (col: number, frU: number, frL: number) => { for (let r = frU; r <= frL - 1; r++) set(col, r, 'L'); };
  const pit = (fr: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) { set(c, fr, '.'); set(c, fr + 1, 'S'); } };

  corr(5, 3, 90); corr(10, 5, 90); corr(15, 5, 90); corr(20, 5, 90);   // four tight approach corridors
  room(30, 4, 92, 6);                                                   // the big OVERMIND arena at the bottom

  shaft(88, 5, 10); shaft(7, 10, 15); shaft(88, 15, 20); shaft(7, 20, 30); // switchback + long drop into the arena

  pit(5, 30, 32); pit(10, 44, 46); pit(15, 28, 32); pit(20, 46, 48);   // approach jumps
  pit(30, 36, 38); pit(30, 66, 68);                                     // arena hazards

  // markers (standing cell = floorRow - 1)
  set(4, 4, 'P'); set(10, 4, 'a'); set(44, 4, 'c');                     // c1
  set(50, 9, 'g'); set(30, 9, 'H'); set(70, 9, 'c');                    // c2 (+ hunter)
  set(22, 14, 'c'); set(50, 14, 'B'); set(72, 14, 'g');                 // c3 (+ bomber)
  set(30, 19, 'c'); set(60, 19, 'U'); set(80, 19, 'F');                 // c4 (+ brute, gundrone)
  set(12, 29, 'm'); set(30, 29, 'c'); set(50, 29, 'c');                 // arena floor
  set(70, 29, 'O'); set(88, 29, 'E');                                   // THE OVERMIND + the way home

  return g.map(r => r.join(''));
}

export const LEVEL5: LevelData = {
  id: 'level5',
  name: 'THE OVERMIND',
  objective: 'Descend the tight core, then drop into the arena. Survive the swarm and kill THE OVERMIND.',
  block: 32,
  intro: 'THE OVERMIND — end it.',
  bgColor: 0x140608,
  ambient: 0.78,
  alarmAtRow: 18,
  alarmMsg: '⚠ THE OVERMIND AWAKENS',
  checkpoints: [{ col: 88, floorRow: 10 }, { col: 9, floorRow: 15 }, { col: 88, floorRow: 20 }],
  grid: buildGrid(),
  hazards: [
    { col: 50, floorRow: 5,  periodMs: 2000, onMs: 800, offset: 0    },
    { col: 50, floorRow: 10, periodMs: 2000, onMs: 800, offset: 600  },
    { col: 50, floorRow: 15, periodMs: 2000, onMs: 800, offset: 300  },
    { col: 50, floorRow: 30, periodMs: 2200, onMs: 850, offset: 1000 },
    { col: 80, floorRow: 30, periodMs: 2200, onMs: 850, offset: 400  },
  ],
  reinforcements: [
    { kind: 'crawler', col: 20, floorRow: 30 }, { kind: 'crawler', col: 40, floorRow: 30 },
    { kind: 'crawler', col: 60, floorRow: 30 }, { kind: 'crawler', col: 84, floorRow: 30 },
    { kind: 'grenadier', col: 30, floorRow: 30 },
  ],
  lights: [
    { col: 8,  row: 3,  radius: 6, intensity: 0.8,  color: 0xff5a4a, flicker: 0.3  },
    { col: 88, row: 8,  radius: 5, intensity: 0.7,  color: 0xff8a4a, flicker: 0.25 },
    { col: 9,  row: 13, radius: 5, intensity: 0.7,  color: 0xff5a4a },
    { col: 88, row: 18, radius: 5, intensity: 0.7,  color: 0xff8a4a, flicker: 0.3 },
    { col: 30, row: 27, radius: 7, intensity: 0.7,  color: 0xff8a4a },
    { col: 70, row: 26, radius: 9, intensity: 0.95, color: 0xffd23a, flicker: 0.4 },
    { col: 88, row: 27, radius: 6, intensity: 0.9,  color: 0x9fe8ff },
  ],
};
