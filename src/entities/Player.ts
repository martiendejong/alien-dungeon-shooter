import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { InputManager } from '../systems/InputManager';
import { LevelGrid } from '../levels/grid';

export interface LevelQuery {
  hideAt(x: number, y: number): boolean;
  darknessAt(x: number, y: number): number;
}

type State = 'idle' | 'turn' | 'step' | 'run' | 'jumpUp' | 'jumpFwd' | 'fall' | 'hang' | 'climb' | 'climbUp' | 'cover' | 'melee' | 'dead';

interface Action {
  type: State;
  start: number; dur: number;
  fromX: number; fromY: number; toX: number; toY: number;
  arc: boolean; peak: number; strides: number;
  toCol: number; toRow: number;
  onDone: () => void;
}

const M = TUNING.move;

export class Player {
  scene: Phaser.Scene;
  grid: LevelGrid;
  block: number;
  x: number; y: number;            // center px
  facing: 1 | -1 = 1;
  aimAngle = 0;
  col: number; row: number;        // grid column / floor row (solid the player stands on)
  hp: number = TUNING.player.maxHp;
  maxHp: number = TUNING.player.maxHp;
  alive = true;
  inCover = false;
  state: State = 'idle';

  private halfW = TUNING.player.width / 2;
  private halfH = TUNING.player.height / 2;
  private act?: Action;
  private vis: Phaser.GameObjects.Sprite;
  private gun: Phaser.GameObjects.Image;
  private invulnUntil = 0;
  private meleeUntil = 0;
  private meleeCdUntil = 0;
  private exposedUntil = 0;
  reloadUntil = 0;        // while > now, you're reloading: rooted, standing still
  /** Called when a shot is fired: stand still and reload for `ms`. */
  beginReload(ms: number) { this.reloadUntil = this.scene.time.now + ms; }
  get reloading() { return this.scene.time.now < this.reloadUntil; }
  private bufferedJump = false;     // a jump was pressed during a step/run; resolve when it finishes
  private bufferedJumpRun = false;  // ...and it was during a RUN → big jump
  private runDist = 0;              // blocks covered in the CURRENT unbroken run (run-jump needs >= 3)
  private grabCol = 0; private grabRow = 0;
  private bob = 0;
  private climbTopY = 0; private climbBottomY = 0; private fallStartY = 0;
  private onLadderStop = false; // arrived on a ladder via run/step → stay until key released
  armed = true;                 // when false (start of L1) no gun is drawn until you pick one up
  private coleSheet = false;    // using the real player sprite sheet (feet-aligned)
  private coleSheet2 = false;   // hang/mantle ledge-climb sheet
  private coleSheet3 = false;   // ladder-climb sheet
  // each sheet is drawn at a different size — normalise so the character stays consistent on screen
  private static readonly SCALE1 = 0.46; // sheet 1 (idle/walk/run/jump/crouch)
  private static readonly SCALE2 = 0.27; // sheet 2 (hang/mantle)
  private static readonly SCALE3 = 0.20; // sheet 3 (ladder)

  constructor(scene: Phaser.Scene, grid: LevelGrid, col: number, floorRow: number) {
    this.scene = scene; this.grid = grid; this.block = grid.block;
    this.col = col; this.row = floorRow;
    this.x = this.cx(col); this.y = this.cy(floorRow);
    this.coleSheet = scene.textures.exists('cole_sheet');
    this.coleSheet2 = scene.textures.exists('cole_sheet2');
    this.coleSheet3 = scene.textures.exists('cole_sheet3');
    if (this.coleSheet)
      this.vis = scene.add.sprite(this.x, this.y, 'cole_sheet', 'idle0').setOrigin(0.5, 1).setScale(Player.SCALE1).setDepth(40);
    else
      this.vis = scene.add.sprite(this.x, this.y, 'cole_idle').setDepth(40);
    this.gun = scene.add.image(this.x, this.y, 'gun').setOrigin(0.25, 0.6).setDepth(41);
    this.gunScale = 26 / Math.max(1, this.gun.width); // fit any art to ~26px wide
  }
  private gunScale = 1;

  // grid <-> px
  private cx(c: number) { return c * this.block + this.block / 2; }
  private cy(r: number) { return r * this.block - this.halfH; } // feet on top of floor row r

  get isClimbing() { return this.state === 'climb'; }
  get canMeleeNow() { return this.scene.time.now >= this.meleeCdUntil; }
  private get busy() { return !!this.act; }

  getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.x - this.halfW, this.y - this.halfH, this.halfW * 2, this.halfH * 2);
  }
  getMuzzle(): { x: number; y: number } {
    const len = 22, cy = this.y - 14; // from the hand, along the aim
    return { x: this.x + Math.cos(this.aimAngle) * len, y: cy + Math.sin(this.aimAngle) * len };
  }
  meleeHitbox(): { x: number; y: number; r: number } | null {
    if (this.scene.time.now > this.meleeUntil) return null;
    return { x: this.x + this.facing * (TUNING.melee.rangePx * 0.6), y: this.y - 6, r: TUNING.melee.rangePx };
  }

  takeDamage(hearts = 1, ignoreCover = false): boolean {
    if (!this.alive) return false;
    const now = this.scene.time.now;
    if (now < this.invulnUntil) return false;
    if (this.inCover && !ignoreCover) return false;
    this.hp -= hearts;
    this.invulnUntil = now + TUNING.player.invulnMs;
    this.scene.cameras.main.shake(120, 0.006);
    if (this.hp <= 0) { this.hp = 0; this.die(); }
    else this.interrupt(); // any hit cancels what you're doing and drops you to the floor below your current cell
    return true;
  }

  /** Cancel the current action; if airborne/hanging, come straight down to the floor below the current cell. */
  private interrupt() {
    this.act = undefined; this.bufferedJump = false; this.runDist = 0;
    const curCol = Math.floor(this.x / this.block);
    const feetRow = Math.round((this.y + this.halfH) / this.block);
    this.col = curCol; this.x = this.cx(curCol); this.row = feetRow;
    if (this.grid.isSolid(curCol, feetRow) || this.grid.isLadder(curCol, feetRow)) {
      this.y = this.cy(feetRow); this.state = 'idle';   // grounded → just stop
    } else {
      this.beginFall(curCol, false);                    // airborne/hanging → drop straight down
    }
  }
  private die() {
    if (!this.alive) return;
    this.alive = false; this.state = 'dead'; this.act = undefined;
    this.scene.events.emit('player-died');
  }
  /** Respawn at a checkpoint: full health, grounded, idle. */
  revive(col: number, floorRow: number) {
    this.alive = true; this.hp = this.maxHp; this.state = 'idle'; this.act = undefined;
    this.inCover = false; this.bufferedJump = false; this.runDist = 0; this.reloadUntil = 0;
    this.col = col; this.row = floorRow; this.x = this.cx(col); this.y = this.cy(floorRow);
    this.invulnUntil = this.scene.time.now + 1200; // brief safety i-frames
    this.vis.clearTint().setAlpha(1);
  }

  // ---- main tick ------------------------------------------------------------
  tick(time: number, dtMs: number, input: InputManager, q: LevelQuery) {
    this.updateAim(input);
    if (!this.alive) { this.syncVisual(); return; }

    if (this.state === 'climb') { this.updateClimb(dtMs, input); this.syncVisual(); return; }

    // jump can be buffered out of a run ("finish the run, then jump")
    // jump pressed DURING a step/run → resolve when the move finishes (run = big jump)
    if ((this.state === 'run' || this.state === 'step') && input.jumpPressed) { this.bufferedJump = true; this.bufferedJumpRun = (this.state === 'run'); }

    if (this.act) {
      this.progress(time);
      if (this.act) { this.syncVisual(); return; }
    }
    // ready (idle / hang / cover) — choose next action
    this.handleReady(time, input, q);
    this.settleIfEmbedded(); // never leave the player stuck inside solid ground
    this.syncVisual();
  }

  private updateAim(input: InputManager) {
    const aim = input.aimWorld();
    this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y - 6, aim.x, aim.y);
  }

  private handleReady(time: number, input: InputManager, q: LevelQuery) {
    if (this.state === 'cover') { this.updateCover(time, input, q); return; }
    if (this.state === 'hang') {
      if (input.upHeld) this.beginClimbUp();
      else if (input.downPressed) this.beginFall(this.col, true); // a SECOND down press drops you off the ledge
      return;
    }

    // enter cover (hide) — anywhere dark enough (hide in shadow)
    if (input.coverHeld && q.darknessAt(this.x, this.y) >= TUNING.cover.hideDarknessThreshold) {
      this.state = 'cover'; this.inCover = true; return;
    }
    // reloading only blocks SHOOTING (handled by the weapon cooldown) — you can still move/jump/climb
    if (input.meleePressed && this.canMeleeNow) { this.beginMelee(time); return; }

    // ladder entry (Up/Down) takes priority over jumps when a ladder is present
    if (input.upHeld && this.grid.isLadder(this.col, this.row - 1)) { this.enterClimb(); return; }
    if (input.downHeld && this.grid.isLadder(this.col, this.row) && this.grid.isLadder(this.col, this.row + 1)) { this.enterClimb(); return; }

    if (input.downPressed && this.beginClimbDownToHang()) return; // grab & hang on the ledge edge (press down again to drop)

    if (input.upPressed) { this.beginJumpUp(); return; }
    if (input.jumpPressed) { this.beginJumpFwd(false); return; } // standing/walking jump = fixed standing distance

    const dir = Math.sign(input.moveX) as 1 | -1 | 0;
    if (dir === 0) { this.onLadderStop = false; this.state = 'idle'; this.runDist = 0; return; }
    if (dir !== this.facing) { this.onLadderStop = false; this.beginTurn(dir); return; }
    if (this.onLadderStop) { this.state = 'idle'; this.runDist = 0; return; } // rest on the ladder until key released / turned
    if (input.runMode) this.beginRun(dir); else this.beginStep(dir);
  }

  private updateCover(time: number, input: InputManager, q: LevelQuery) {
    const ok = q.darknessAt(this.x, this.y) >= TUNING.cover.hideDarknessThreshold;
    if (!input.coverHeld || !ok) { this.state = 'idle'; this.inCover = false; return; }
    if (input.firePressed) this.exposedUntil = time + TUNING.cover.popOutMs;
    this.inCover = time > this.exposedUntil;
  }

  // ---- ladder climb (continuous) --------------------------------------------
  private enterClimb() {
    const c = this.col;
    let top = this.row; while (this.grid.isLadder(c, top - 1)) top--;
    let bot = this.row; while (this.grid.isLadder(c, bot + 1)) bot++;
    // Stand on the platform UNDER the ladder — never descend below it. floorBelow finds the first
    // standable surface beneath the lowest rung (the platform directly under it, or the next one down).
    let bottomFloorRow = this.grid.floorBelow(c, bot + 1);
    if (bottomFloorRow < 0) bottomFloorRow = bot; // nothing below at all → stop at the last rung
    this.climbTopY = top * this.block;
    this.climbBottomY = bottomFloorRow * this.block;
    this.bob = 0; this.onLadderStop = false;
    this.state = 'climb';
  }

  private updateClimb(dtMs: number, input: InputManager) {
    const c = this.col;
    this.x = this.cx(c); this.bob = 0;
    if (input.jumpPressed) { this.row = Math.round((this.y + this.halfH) / this.block); this.y = this.cy(this.row); this.state = 'idle'; return; }
    let feetY = this.y + this.halfH;
    const v = M.climbSpeed * (dtMs / 1000);
    if (input.upHeld) feetY = Math.max(this.climbTopY, feetY - v);
    else if (input.downHeld) feetY = Math.min(this.climbBottomY, feetY + v);
    this.y = feetY - this.halfH;

    const dir = Math.sign(input.moveX);
    const feetRow = Math.round(feetY / this.block);
    if (dir !== 0 && Math.abs(feetY - feetRow * this.block) < 6 && this.grid.isStandFloor(c, feetRow)) {
      this.row = feetRow; this.y = this.cy(feetRow); this.facing = dir as 1 | -1; this.state = 'idle'; return;
    }
    if (feetY <= this.climbTopY + 0.5) { this.row = Math.round(this.climbTopY / this.block); this.y = this.cy(this.row); this.state = 'idle'; }
    else if (feetY >= this.climbBottomY - 0.5) { this.row = Math.round(this.climbBottomY / this.block); this.y = this.cy(this.row); this.state = 'idle'; }
  }

  private applyFallDamage(landRow: number) {
    const startFeet = this.fallStartY + this.halfH;
    const floors = Math.round((landRow * this.block - startFeet) / (this.block * 4));
    if (floors > 2) this.die();                 // more than 2 floors → dead
    else if (floors === 2) this.takeDamage(1, true); // exactly 2 floors → lose 1 heart (1 floor = safe)
  }

  // ---- action starters ------------------------------------------------------
  private start(a: Omit<Action, 'fromX' | 'fromY' | 'start'>) {
    if (a.type !== 'run') this.runDist = 0; // any non-run action breaks the run-up streak
    this.act = { ...a, fromX: this.x, fromY: this.y, start: this.scene.time.now };
    this.state = a.type;
  }

  private beginTurn(dir: 1 | -1) {
    this.start({ type: 'turn', dur: M.turnMs, toX: this.x, toY: this.y, arc: false, peak: 0, strides: 0,
      toCol: this.col, toRow: this.row, onDone: () => { this.facing = dir; this.state = 'idle'; } });
  }

  private canStand(c: number, r: number) {
    return this.grid.isStandFloor(c, r) && !this.grid.isSolid(c, r - 1) && !this.grid.isSolid(c, r - 2);
  }

  private beginStep(dir: 1 | -1) {
    const c2 = this.col + dir;
    if (!this.canStand(c2, this.row)) { this.state = 'idle'; return; }   // wall or edge → careful, don't move
    if (this.grid.isSpike(c2, this.row)) { this.state = 'idle'; return; } // don't walk onto spikes — jump them
    this.start({ type: 'step', dur: M.stepMs, toX: this.cx(c2), toY: this.y, arc: false, peak: 0, strides: 1,
      toCol: c2, toRow: this.row, onDone: () => {
        this.land(c2, this.row);
        if (this.bufferedJump) { this.bufferedJump = false; this.beginJumpFwd(this.bufferedJumpRun); } // jump while walking = standing distance
      } });
  }

  private beginRun(dir: 1 | -1) {
    let clear = 0, onLadder = false;
    for (let d = 1; d <= M.runBlocks; d++) {
      const c = this.col + dir * d;
      if (!this.canStand(c, this.row)) break;
      clear = d;
      if (this.grid.isLadder(c, this.row)) { onLadder = true; break; } // stop ON the ladder, like a ledge edge
    }
    const blockedCol = this.col + dir * (clear + 1);
    const isEdge = !this.grid.isSolid(blockedCol, this.row); // nothing to stand on → a gap/edge
    if (clear === 0 && !isEdge) { this.state = 'idle'; this.runDist = 0; return; } // wall right ahead → refuse
    const destCol = this.col + dir * clear;
    const dur = M.runMs * Math.max(0.25, clear / M.runBlocks);
    const willFall = !onLadder && clear < M.runBlocks && isEdge;
    this.runDist += clear; // accumulate the unbroken run length (for the 3-block run-jump rule)
    this.start({ type: 'run', dur, toX: this.cx(destCol), toY: this.y, arc: false, peak: 0, strides: Math.max(1, clear),
      toCol: destCol, toRow: this.row, onDone: () => {
        this.col = destCol; this.x = this.cx(destCol);
        if (this.bufferedJump) {
          this.bufferedJump = false;
          // a RUN-jump needs at least 3 blocks of run-up; too short → don't jump (keep running / run off the edge)
          if (this.bufferedJumpRun && this.runDist < 3) { if (willFall) this.beginFall(destCol + dir, false); else this.state = 'idle'; }
          else this.beginJumpFwd(this.bufferedJumpRun);
        }
        else if (willFall) this.beginFall(destCol + dir, false); // ran off the edge
        else this.state = 'idle';
      } });
  }

  private beginJumpUp() {
    const reach = M.jumpUpReach;
    let gc = -1, gr = -1;
    // Climb a ledge at its OPEN EDGE — works when you stand EXACTLY under the edge (or just beside it).
    // The target must be a platform top that is an actual edge (a solid cell with an OPEN neighbour);
    // you can never climb the middle of a floor / a closed side (no climbing straight through a floor).
    for (let lr = this.row - 2; lr >= this.row - (reach + 1); lr--) {
      let clear = true;
      for (let rr = this.row - 1; rr > lr; rr--) if (this.grid.isSolid(this.col, rr)) { clear = false; break; }
      if (!clear) break;                                 // ceiling above us — can't rise
      for (const c of [this.col - 1, this.col, this.col + 1]) {
        if (!this.grid.isStandFloor(c, lr)) continue;    // must be a platform top
        const openL = !this.grid.isSolid(c - 1, lr), openR = !this.grid.isSolid(c + 1, lr);
        if (!openL && !openR) continue;                  // middle of a floor → not an edge
        // You must FACE the solid side (back to the gap): either directly under the edge, or one cell out
        // on the gap side facing toward the edge.
        let ok = false;
        if (openL && !openR)      ok = this.facing === 1  && (this.col === c || this.col === c - 1); // gap left, face right
        else if (openR && !openL) ok = this.facing === -1 && (this.col === c || this.col === c + 1); // gap right, face left
        else                      ok = this.col === c; // 1-wide ledge (open both sides): only straight under
        if (ok) { gc = c; gr = lr; break; }
      }
      if (gc >= 0) break;
    }
    if (gc >= 0) { // grab the edge from its OPEN (gap) side and hang on the face — never through the platform
      const hangX = this.cx(gc) - this.facing * this.block * 0.5; // gap side = -facing
      const hangY = gr * this.block + this.halfH;
      this.grabCol = gc; this.grabRow = gr; // keep facing the same (back to the gap)
      this.start({ type: 'jumpUp', dur: M.jumpUpMs * 0.5, toX: hangX, toY: hangY, arc: false, peak: 0, strides: 0,
        toCol: gc, toRow: gr, onDone: () => { this.state = 'hang'; } });
    } else { // no ledge: hop up and fall back, clamped so we don't pop through the ceiling
      let openAbove = 0; while (openAbove < 3 && !this.grid.isSolid(this.col, this.row - 1 - openAbove)) openAbove++;
      const apexRows = Math.max(0.5, Math.min(2.4, openAbove - 0.2));
      this.start({ type: 'jumpUp', dur: M.jumpUpMs, toX: this.x, toY: this.y, arc: true, peak: this.block * apexRows, strides: 0,
        toCol: this.col, toRow: this.row, onDone: () => { this.state = 'idle'; } });
    }
  }

  private beginJumpFwd(running: boolean) {
    const s = this.facing;
    const reach = running ? M.runJump : M.standJump;
    const peak = (running ? M.runJumpPeak : M.standJumpPeak) * this.block;
    const dur = running ? M.runJumpMs : M.standJumpMs;
    // FIXED distance: always exactly `reach` blocks (4 standing/walking, 6 running) — but stop before a wall.
    let dest = this.col + s * reach;
    for (let d = 1; d <= reach; d++) {
      const c = this.col + s * d;
      if (this.grid.isSolid(c, this.row - 1) || this.grid.isSolid(c, this.row - 2)) { dest = this.col + s * (d - 1); break; } // wall → stop just before it
    }
    if (dest === this.col) { this.state = 'idle'; return; } // wall right in front — can't jump

    if (this.grid.isStandFloor(dest, this.row)) {
      this.start({ type: 'jumpFwd', dur, toX: this.cx(dest), toY: this.y, arc: true, peak, strides: 0,
        // a RUN-jump lands still running: keep the run-up so you flow straight into another run/run-jump
        toCol: dest, toRow: this.row, onDone: () => { this.land(dest, this.row); if (running) this.runDist = M.runBlocks; } });
    } else if (this.grid.isStandFloor(dest + s, this.row)) {
      // landed one block short of a ledge → grab its edge and hang (e.g. a 6-wide gap)
      const gc = dest + s, hangX = this.cx(dest), hangY = this.row * this.block + this.halfH;
      this.grabCol = gc; this.grabRow = this.row;
      // hang at `dest` (the cell you grabbed from) so pressing DOWN drops you STRAIGHT down here,
      // not back at the take-off column; pressing UP still climbs onto the grabbed ledge `gc`.
      this.start({ type: 'jumpFwd', dur, toX: hangX, toY: hangY, arc: true, peak, strides: 0,
        toCol: gc, toRow: this.row, onDone: () => { this.col = dest; this.x = hangX; this.state = 'hang'; } });
    } else {
      // no floor within reach → arc out and fall
      this.start({ type: 'jumpFwd', dur: dur * 0.8, toX: this.cx(dest), toY: this.y - this.block * 0.5, arc: true, peak, strides: 0,
        toCol: dest, toRow: this.row, onDone: () => this.beginFall(dest, false) });
    }
  }

  private beginFall(col: number, fromHang: boolean) {
    this.col = col; this.x = this.cx(col); this.fallStartY = this.y;
    const landRow = this.grid.floorBelow(col, this.row + (fromHang ? 0 : 1));
    if (landRow < 0) { // no floor at all → death (shouldn't happen with solid bedrock)
      this.start({ type: 'fall', dur: 600, toX: this.x, toY: this.grid.worldH + 80, arc: false, peak: 0, strides: 0,
        toCol: col, toRow: this.row, onDone: () => this.die() });
      return;
    }
    const toY = this.cy(landRow);
    const dur = Math.max(140, Math.abs(toY - this.y) * M.fallPxPerMs);
    this.start({ type: 'fall', dur, toX: this.x, toY, arc: false, peak: 0, strides: 0,
      toCol: col, toRow: landRow, onDone: () => { this.applyFallDamage(landRow); this.land(col, landRow); } });
  }

  /** Climb DOWN over a ledge edge: first lower yourself to HANG on the edge (back to the gap).
   *  You stay hanging until a second Down press drops you (handled in the 'hang' state). */
  private beginClimbDownToHang(): boolean {
    // Only over a real EDGE — the cell on the gap side (behind you, -facing) must be open at your row,
    // and there must be a floor somewhere below the gap to eventually drop onto.
    const dir = -this.facing as 1 | -1;
    const gapCol = this.col + dir;
    if (this.grid.isSolid(gapCol, this.row)) return false;       // wall/floor behind → not a drop edge
    if (this.grid.floorBelow(gapCol, this.row) < 0) return false; // nothing below the gap → don't climb into the void
    this.grabCol = this.col; this.grabRow = this.row;            // up = climb back to where we stood
    const hangX = this.cx(this.col) - this.facing * this.block * 0.5; // hang on the gap-side face
    const hangY = this.row * this.block + this.halfH;
    this.start({ type: 'climbUp', dur: M.climbUpMs, toX: hangX, toY: hangY, arc: false, peak: 0, strides: 0,
      toCol: gapCol, toRow: this.row, onDone: () => { this.col = gapCol; this.x = hangX; this.state = 'hang'; } });
    return true;
  }

  private beginClimbUp() {
    const c = this.grabCol, r = this.grabRow;
    this.start({ type: 'climbUp', dur: M.climbUpMs, toX: this.cx(c), toY: this.cy(r), arc: false, peak: 0, strides: 0,
      toCol: c, toRow: r, onDone: () => this.land(c, r) });
  }

  private beginMelee(time: number) {
    this.meleeUntil = time + 180; this.meleeCdUntil = time + TUNING.melee.cooldownMs;
    this.scene.events.emit('player-melee');
    this.start({ type: 'melee', dur: 220, toX: this.x, toY: this.y, arc: false, peak: 0, strides: 0,
      toCol: this.col, toRow: this.row, onDone: () => { this.state = 'idle'; } });
  }

  private land(col: number, row: number) {
    this.col = col; this.row = row; this.x = this.cx(col); this.y = this.cy(row); this.state = 'idle';
    this.onLadderStop = this.grid.isLadder(col, row); // stop & rest if we ended on a ladder
  }

  /** Safety net: if the player ever ends up with their body inside solid (a bad climb/fall), rise to the floor —
   *  you can never get stuck in the ground. */
  private settleIfEmbedded() {
    if (this.state !== 'idle') return;
    if (!this.grid.isSolid(this.col, this.row - 1)) return; // body cell is clear → standing normally
    let r = this.row;
    while (r > 1 && this.grid.isSolid(this.col, r - 1)) r--;  // rise until the body cell is open
    if (!this.grid.isStandFloor(this.col, r)) { const fb = this.grid.floorBelow(this.col, r); if (fb >= 0) r = fb; }
    this.row = r; this.x = this.cx(this.col); this.y = this.cy(r); this.act = undefined;
  }

  // ---- action progress ------------------------------------------------------
  private progress(time: number) {
    const a = this.act!;
    let p = (time - a.start) / a.dur;
    if (p >= 1) p = 1;
    const e = a.arc ? p : p * p * (3 - 2 * p); // smoothstep for grounded moves
    this.x = a.fromX + (a.toX - a.fromX) * e;
    this.y = a.fromY + (a.toY - a.fromY) * e - (a.arc ? a.peak * Math.sin(Math.PI * p) : 0);

    // step/run gait bob
    if ((a.type === 'step' || a.type === 'run') && a.strides > 0) {
      const amp = a.type === 'run' ? 4 : 2.6;
      this.bob = Math.abs(Math.sin(p * Math.PI * a.strides)) * amp;
    } else this.bob = 0;

    if (p >= 1) { const done = a.onDone; this.act = undefined; done(); }
  }

  // ---- visuals --------------------------------------------------------------
  private syncVisual() {
    const now = this.scene.time.now;
    const bobY = this.y - this.bob;
    if (!this.alive) this.vis.setTint(0x556070);
    else if (this.state === 'cover') this.vis.setTint(0x2b3340);
    else if (now < this.invulnUntil) this.vis.setTint(0xff6a6a);
    else this.vis.clearTint();

    let alpha = 1;
    if (this.state === 'cover') alpha = this.inCover ? 0.45 : 0.85;
    else if (this.alive && now < this.invulnUntil) alpha = (Math.floor(now / 70) % 2) ? 0.55 : 1;
    // hang hangs from its HANDS at the ledge (top anchor); everything else is feet-anchored
    const isHang = this.coleSheet2 && this.state === 'hang';
    this.vis.setOrigin(0.5, isHang ? 0 : 1);
    const visY = !this.coleSheet ? bobY : (isHang ? bobY - this.halfH : bobY + this.halfH);
    this.vis.setAlpha(alpha).setPosition(this.x, visY).setFlipX(this.facing < 0);

    // animation by state
    let animKey = '', staticTex = '', frameName = '', frameTex = 'cole_sheet', scale = Player.SCALE1;
    if (this.coleSheet) {
      switch (this.state) {
        case 'step': animKey = 'cole_walk'; break;
        case 'run': animKey = 'cole_run'; break;
        case 'jumpUp': case 'jumpFwd': animKey = 'cole_jump'; break;
        case 'climb': if (this.coleSheet3) { animKey = 'cole_climbladder'; scale = Player.SCALE3; } else animKey = 'cole_walk'; break;
        case 'climbUp': if (this.coleSheet2) { animKey = 'cole_mantle'; scale = Player.SCALE2; } else animKey = 'cole_jump'; break;
        case 'fall': frameName = 'jump5'; break;
        case 'hang': if (this.coleSheet2) { frameTex = 'cole_sheet2'; frameName = 'hang1'; scale = Player.SCALE2; } else frameName = 'jump2'; break;
        case 'cover': frameName = 'crouch0'; break;
        case 'turn': frameName = 'idle0'; break;
        case 'melee': frameName = 'run3'; break;
        default: animKey = 'cole_idle';
      }
      this.vis.setScale(scale);
      if (animKey) { if (this.vis.anims.currentAnim?.key !== animKey) this.vis.play(animKey, true); }
      else { this.vis.anims.stop(); if (this.vis.texture.key !== frameTex || this.vis.frame.name !== frameName) this.vis.setTexture(frameTex, frameName); }
    } else {
      switch (this.state) {
        case 'step': animKey = 'cole_walk'; break;
        case 'run': animKey = 'cole_run'; break;
        case 'climb': case 'climbUp': case 'hang': animKey = 'cole_climb'; break;
        case 'jumpUp': case 'jumpFwd': staticTex = 'cole_jump'; break;
        case 'fall': staticTex = 'cole_fall'; break;
        default: staticTex = 'cole_idle';
      }
      if (animKey) { if (this.vis.anims.currentAnim?.key !== animKey) this.vis.play(animKey, true); }
      else { this.vis.anims.stop(); if (this.vis.texture.key !== staticTex) this.vis.setTexture(staticTex); }
    }

    const hidden = this.state === 'cover' && this.inCover;
    const showGun = this.armed && this.alive && !hidden && this.state !== 'hang' && this.state !== 'climbUp' && this.state !== 'climb';
    this.gun.setVisible(showGun);
    const gs = this.gunScale;
    this.gun.setPosition(this.x + this.facing * 3, bobY - 14).setRotation(this.aimAngle).setScale(gs, this.facing < 0 ? -gs : gs);
  }

  destroy() { this.vis?.destroy(); this.gun?.destroy(); }
}
