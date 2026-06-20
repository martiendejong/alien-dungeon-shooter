import { LEVEL0 } from './src/levels/level0';
import { LEVEL1 } from './src/levels/level1';
import { LEVEL2 } from './src/levels/level2';
import { LEVEL3 } from './src/levels/level3';
import { LEVEL4 } from './src/levels/level4';
import { LEVEL5 } from './src/levels/level5';
import type { LevelData } from './src/levels/types';

function check(L: LevelData) {
  const rows = L.grid;
  const ROWS = rows.length, COLS = rows.reduce((m, r) => Math.max(m, r.length), 0);
  const at = (c: number, r: number) => (r < 0 || r >= ROWS || c < 0 || c >= (rows[r]?.length ?? 0)) ? '.' : rows[r][c];
  const gateOpen = new Set<string>();
  for (const g of L.gates ?? []) for (let r = g.row0; r <= g.row1; r++) gateOpen.add(g.col + ',' + r);
  const solid = (c: number, r: number) => gateOpen.has(c + ',' + r) ? false : (at(c, r) === '#' || at(c, r) === 'S' || at(c, r) === 'T');
  const ladder = (c: number, r: number) => at(c, r) === 'L';
  const stand = (c: number, r: number) => (solid(c, r) || ladder(c, r)) && !solid(c, r - 1) && !solid(c, r - 2);

  // find spawn P and exit E
  let P: [number, number] | null = null, E: [number, number] | null = null;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < (rows[r]?.length ?? 0); c++) {
    if (rows[r][c] === 'P') P = [c, r + 1];
    if (rows[r][c] === 'E') E = [c, r + 1];
  }
  if (!P || !E) return { id: L.id, ok: false, why: `missing ${!P ? 'P' : ''}${!E ? 'E' : ''}` };

  // BFS over standing cells with the real move-set
  const key = (c: number, r: number) => c + ',' + r;
  const seen = new Set([key(P[0], P[1])]); const q: [number, number][] = [[P[0], P[1]]];
  const push = (c: number, r: number) => { if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return; if (stand(c, r) && !seen.has(key(c, r))) { seen.add(key(c, r)); q.push([c, r]); } };
  while (q.length) {
    const [c, r] = q.shift()!;
    push(c - 1, r); push(c + 1, r);
    for (const lr of [r - 2, r - 3, r - 4]) { push(c, lr); push(c - 1, lr); push(c + 1, lr); }      // climb up a ledge (<=3)
    for (const d of [-1, 1]) for (const k of [5, 6, 7]) push(c + d * k, r);                          // stand/run jump (+grab)
    for (let rr = r + 1; rr < ROWS; rr++) { if (stand(c, rr)) { if (rr - r <= 11) push(c, rr); break; } if (solid(c, rr)) break; } // drop (>2 floors = lethal, not a valid path)
    if (ladder(c, r - 1)) { let t = r - 1; while (ladder(c, t)) t--; push(c, t + 1); }               // ladder up
    if (ladder(c, r) || ladder(c, r + 1)) { let b = r; while (ladder(c, b + 1)) b++; push(c, b + 1); } // ladder down
  }
  const solvable = seen.has(key(E[0], E[1]));

  // ladder-pierce check: a 'L' cell that sits on a floor surface mid-ladder
  const pierces: string[] = [];
  for (let c = 0; c < COLS; c++) for (let r = 2; r < ROWS; r++) {
    if (at(c, r) === 'L' && at(c, r - 1) === 'L') {
      const floorHere = solid(c - 1, r) && !solid(c - 1, r - 1) && solid(c + 1, r) && !solid(c + 1, r - 1);
      if (floorHere) pierces.push(c + ',' + r);
    }
  }
  return { id: L.id, size: `${COLS}x${ROWS}`, spawn: P, exit: E, solvable, reach: seen.size, ladderPierces: pierces.length };
}

for (const L of [LEVEL0, LEVEL1, LEVEL2, LEVEL3, LEVEL4, LEVEL5]) console.log(JSON.stringify(check(L)));
