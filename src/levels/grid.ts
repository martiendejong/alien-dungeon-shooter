/** Tile grid for PoP-style movement. '#' = solid; everything else is empty/air. */
export class LevelGrid {
  readonly rows: number;
  readonly cols: number;
  readonly block: number;
  private g: string[];
  /** cells forced PASSABLE despite being solid in the grid — open doors/gates */
  private open = new Set<number>();

  constructor(rows: string[], block: number) {
    this.g = rows;
    this.rows = rows.length;
    this.cols = rows.reduce((m, r) => Math.max(m, r.length), 0);
    this.block = block;
  }

  private key(c: number, r: number) { return r * this.cols + c; }
  /** open (passable) or close (solid) a grid cell at runtime — gates/doors */
  setOpen(c: number, r: number, isOpen: boolean) { const k = this.key(c, r); if (isOpen) this.open.add(k); else this.open.delete(k); }
  isOpenedCell(c: number, r: number): boolean { return this.open.has(this.key(c, r)); }

  charAt(c: number, r: number): string {
    if (r < 0 || r >= this.rows) return '.';          // open above / below world
    const row = this.g[r];
    if (c < 0 || c >= row.length) return '.';          // open at horizontal edges
    return row[c];
  }

  isSolid(c: number, r: number): boolean {
    if (this.open.has(this.key(c, r))) return false;   // a door currently raised/open
    const ch = this.charAt(c, r); return ch === '#' || ch === 'S';
  }
  isSolidPx(x: number, y: number): boolean { return this.isSolid(Math.floor(x / this.block), Math.floor(y / this.block)); }
  isLadder(c: number, r: number): boolean { return this.charAt(c, r) === 'L'; }
  isSpike(c: number, r: number): boolean { return this.charAt(c, r) === 'S'; } // deadly floor

  /** can the player stand here? on a solid block OR a ladder rung, with no wall in the head cell */
  isStandFloor(c: number, r: number): boolean { return (this.isSolid(c, r) || this.isLadder(c, r)) && !this.isSolid(c, r - 1); }

  /** first standable floor row at/below startRow in column c, else -1 */
  floorBelow(c: number, startRow: number): number {
    for (let r = startRow; r < this.rows; r++) if (this.isStandFloor(c, r)) return r;
    return -1;
  }

  colOfX(x: number) { return Math.floor(x / this.block); }
  centerX(c: number) { return c * this.block + this.block / 2; }
  topY(r: number) { return r * this.block; } // top surface of the block in row r
  get worldW() { return this.cols * this.block; }
  get worldH() { return this.rows * this.block; }
}
