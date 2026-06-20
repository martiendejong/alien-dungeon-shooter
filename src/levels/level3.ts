import { LevelData } from './types';
import { buildShaft } from './tower';

// LEVEL 3 — "THE NEST". A tight vertical ASCENT: spawn at the bottom of a narrow chute and JUMP-CLIMB up
// the zig-zag ledges (jump-up grab, reach 3) to THE QUEEN's chamber at the very top. Short ledges, close
// fights, no long sightlines.
const COLS = 28, ROWS = 52;

function buildGrid(): string[] {
  const g: string[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('#'));
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const led = buildShaft(g, COLS, ROWS, 10, 12);            // 12 ledges, rows 10..43 (led[0]=top, led[11]=bottom)
  // QUEEN chamber at the top: floor row 7 (cols 6-25), open above; col 6 is an open edge to jump-grab up to
  for (let r = 4; r <= 6; r++) for (let c = 2; c <= 25; c++) set(c, r, '.');
  for (let c = 2; c <= 5; c++) set(c, 7, '.');              // open the left of row 7 so the chamber floor has a grabbable edge at col 6

  // markers (standing cell = ledge.row - 1)
  const B = led.length - 1;
  set(13, led[B].row - 1, 'P'); set(20, led[B].row - 1, 'y'); // spawn (bottom) + SMG
  set(8, led[B - 1].row - 1, 'r');                            // GRENADE THROWER early (near the start)
  set(16, led[B - 2].row - 1, 'c'); set(20, led[B - 3].row - 1, 'H'); // crawler, hunter
  set(10, led[B - 4].row - 1, 'c'); set(18, led[B - 5].row - 1, 'F'); // gundrone
  set(8, led[B - 6].row - 1, 'c'); set(18, led[B - 7].row - 1, 'U');  // brute
  set(14, led[B - 8].row - 1, 'c'); set(20, led[2].row - 1, 'c'); set(8, led[1].row - 1, 'H');
  set(8, 6, 'm'); set(16, 6, 'Q'); set(22, 6, 'E');          // QUEEN chamber (top) + portal-gate

  return g.map(r => r.join(''));
}

export const LEVEL3: LevelData = {
  id: 'level3',
  name: 'THE NEST',
  objective: 'Jump-climb the chute upward — ledge to ledge, fighting close. A swarm breach hits. Reach THE QUEEN at the top.',
  block: 32,
  next: 'level4',
  intro: 'Through the portal — a vertical warren. Climb.',
  outro: 'You claw your way back to Earth…',
  bgColor: 0x0c0814,
  ambient: 0.75,
  alarmAtRow: 22,
  alarmMsg: '⚠ THE NEST WAKES — SWARM INCOMING',
  checkpoints: [{ col: 14, floorRow: 37 }, { col: 14, floorRow: 25 }, { col: 14, floorRow: 13 }],
  grid: buildGrid(),
  hazards: [
    { col: 16, floorRow: 34, periodMs: 2200, onMs: 850, offset: 0, kind: 'spike' },
    { col: 12, floorRow: 19, periodMs: 2000, onMs: 800, offset: 600 },
    { col: 18, floorRow: 28, periodMs: 1900, onMs: 750, offset: 300, kind: 'spike' },
  ],
  reinforcements: [
    { kind: 'crawler', col: 14, floorRow: 37 }, { kind: 'crawler', col: 14, floorRow: 25 },
    { kind: 'crawler', col: 14, floorRow: 16 }, { kind: 'crawler', col: 16, floorRow: 10 },
  ],
  lights: [
    { col: 14, row: 42, radius: 6, intensity: 0.85, color: 0xb05aff, flicker: 0.3 },
    { col: 20, row: 30, radius: 5, intensity: 0.7,  color: 0x5affd0 },
    { col: 8,  row: 24, radius: 5, intensity: 0.7,  color: 0xb05aff, flicker: 0.25 },
    { col: 20, row: 18, radius: 5, intensity: 0.7,  color: 0x5affd0 },
    { col: 16, row: 5,  radius: 8, intensity: 0.9,  color: 0xff4ad0, flicker: 0.35 },
  ],
};
