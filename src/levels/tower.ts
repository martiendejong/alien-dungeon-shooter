// Builds a tall, NARROW zig-zag climb-shaft into a solid grid — the opposite of a long horizontal
// corridor. Ledges are 3 rows apart, alternating left/right with an overlapping middle, so you move
// vertically by JUMP-CLIMBING up (jump-up grab, reach 3) and climbing DOWN (hang+drop) between them.
// Short horizontal hops, no long sightlines. Returns the ledges top→bottom for marker placement.

export interface Ledge { row: number; c0: number; c1: number; mid: number; }

export function buildShaft(g: string[][], COLS: number, ROWS: number, topRow: number, count: number): Ledge[] {
  const M = Math.floor(COLS / 2);
  const set = (c: number, r: number, ch: string) => { if (c >= 0 && c < COLS && r >= 0 && r < ROWS) g[r][c] = ch; };
  const ledges: Ledge[] = [];
  const bottom = topRow + (count - 1) * 3;
  for (let r = topRow - 2; r <= bottom + 1; r++) for (let c = 2; c <= COLS - 3; c++) set(c, r, '.'); // carve the shaft interior
  for (let i = 0; i < count; i++) {
    const row = topRow + i * 3;
    const c0 = i % 2 === 0 ? 2 : M - 3;
    const c1 = i % 2 === 0 ? M + 3 : COLS - 3;
    for (let c = c0; c <= c1; c++) set(c, row, '#');
    ledges.push({ row, c0, c1, mid: M });
  }
  return ledges;
}
