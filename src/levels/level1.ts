import { LevelData } from './types';

// LEVEL 1 — "LOCKDOWN". Bigger building: 4-row floor spacing (was 3) = more headroom per floor.
// Longer corridors. Right chamber is taller with three internal ledges instead of two.
const COLS = 52, ROWS = 36;
const Y = 0xffcf3a, GRN = 0x4aff6a;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const Hl = (r: number, c0: number, c1: number) => { for (let c = c0; c <= c1; c++) set(c, r, '#'); };
  const Vl = (c: number, r0: number, r1: number) => { for (let r = r0; r <= r1; r++) set(c, r, '#'); };
  const Lad = (c: number, upper: number, lower: number) => { for (let r = upper; r <= lower - 1; r++) set(c, r, 'L'); };

  // floors — 4 rows apart (rows 6/10/14/18/22/27/32)
  Hl(6,  3, 9);   Hl(6,  12, 29);        // top-left room, top-middle room
  Hl(10, 8,  28);                         // big middle floor
  Hl(14, 16, 35);                         // centre floor (yellow button)
  Hl(18, 3,  15); Hl(18, 20, 30);        // left floor, mid floor (elevator)
  Hl(22, 3,  44);                         // long bottom corridor
  Hl(27, 4,  8);                          // bottom-left lower
  Hl(32, 34, 49);                         // right-chamber floor
  Hl(10, 38, 49); Hl(17, 38, 49); Hl(24, 38, 49); // three ledges inside the tall right chamber
  // ceilings
  Hl(2, 3, 11); Hl(2, 14, 30); Hl(4, 33, 49);

  // walls
  Vl(3,  2, 6);  Vl(11, 2, 6);           // top-left room
  Vl(14, 2, 6);  Vl(30, 2, 14);          // top-middle room (long right wall)
  Vl(8,  6, 18);                          // long left-centre wall
  Vl(2, 18, 22); Vl(5, 22, 27);          // bottom-left room
  Vl(22, 14, 18);                         // centre→mid step
  Vl(31, 14, 18);                         // seal the elevator pocket on the right
  Vl(33, 4,  22); Vl(49, 4, 32);         // right chamber (left-upper / right wall)

  // ladders (each spans exactly one floor gap)
  Lad(18, 6, 10);   // top-middle room → big floor
  Lad(27, 6, 14);   // top-middle room → centre floor
  Lad(13, 10, 18);  // big floor → left floor (the long left ladder)
  Lad(10, 18, 22);  // left floor → bottom corridor
  Lad(25, 14, 18);  // centre floor → mid floor
  Lad(24, 18, 22);  // bottom corridor → mid floor (back to elevator)
  Lad(40, 22, 32);  // bottom corridor → right-chamber floor

  // gate cells
  Vl(8, 19, 21);    // YELLOW gate — seals the bottom-left room
  Vl(26, 15, 17);   // GREEN gate — the only way onto the elevator pocket

  // border
  for (let r = 0; r < ROWS; r++) { set(0, r, '#'); set(1, r, '#'); set(COLS-2, r, '#'); set(COLS-1, r, '#'); }
  for (let c = 0; c < COLS; c++) { set(c, 0, '#'); set(c, 1, '#'); set(c, ROWS-2, '#'); set(c, ROWS-1, '#'); }

  // markers (standing cell = floorRow - 1)
  set(4,  5,  'P');                                   // spawn — UNARMED (top-left room)
  set(7,  5,  'g'); set(20, 5, 'g');                  // top-room soldiers
  set(28, 13, 'g');                                   // mid-floor soldier (by elevator)
  set(16, 21, 'g'); set(28, 21, 'g'); set(36, 21, 'g'); // bottom-corridor soldiers (longer corridor)
  set(42, 31, 'g');                                   // right-chamber sentry
  set(28, 13, 'E');                                   // ELEVATOR = exit (behind the green gate)

  return g.map(r => r.join(''));
}

export const LEVEL1: LevelData = {
  id: 'level1',
  name: 'LOCKDOWN',
  objective: 'UNARMED. Bigger building, longer corridors. YELLOW button opens the yellow gate for good; GREEN button opens the green gate briefly — beat it to the ELEVATOR.',
  block: 32,
  next: 'level2',
  intro: 'SITE ECHO — locked down. Work the buttons, beat the gates, reach the elevator. No weapons.',
  outro: 'The elevator drops into the dark…',
  startUnarmed: true,
  bgColor: 0x07090f,
  ambient: 0.6,
  grid: buildGrid(),
  gates: [
    { id: 1, col: 8,  row0: 19, row1: 21, openMs: 0, stayOpen: true, color: Y },
    { id: 2, col: 26, row0: 15, row1: 17, openMs: 11000, color: GRN },
  ],
  plates: [
    { id: 1, col: 22, floorRow: 14, color: Y },   // YELLOW button (centre floor)
    { id: 2, col: 4,  floorRow: 22, color: GRN },  // GREEN button (bottom-left room)
  ],
  lights: [
    { col: 6,  row: 4,  radius: 5, intensity: 0.85, flicker: 0.15 },
    { col: 20, row: 4,  radius: 5, intensity: 0.8  },
    { col: 22, row: 13, radius: 5, intensity: 0.85, color: Y, flicker: 0.2 },
    { col: 28, row: 16, radius: 6, intensity: 0.9,  color: 0x9fe8ff },  // elevator glow
    { col: 24, row: 17, radius: 5, intensity: 0.8  },
    { col: 4,  row: 21, radius: 5, intensity: 0.85, color: GRN },
    { col: 22, row: 21, radius: 5, intensity: 0.75, flicker: 0.2 },
    { col: 42, row: 31, radius: 6, intensity: 0.75 },
  ],
};
