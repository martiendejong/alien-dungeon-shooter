import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { Player } from './Player';
import { EnemyKind } from '../levels/types';
import { LevelGrid } from '../levels/grid';

export interface EnemyHost {
  fireEnemyBullet(x: number, y: number, angle: number, speed: number, dmg: number): void;
  spawnGrenade(x: number, y: number, vx: number, vy: number, friendly: boolean): void;
  summon(kind: EnemyKind, col: number, floorRow: number): void;
  shockwave(x: number, y: number, radius: number): void;
  losClear(x1: number, y1: number, x2: number, y2: number): boolean;
  darknessAt(x: number, y: number): number;
  readonly player: Player;
}

const BOSS_NAMES: Record<string, string> = { warden: 'SITE WARDEN', subject: 'SUBJECT ZERO', queen: 'THE QUEEN', commander: 'THE COMMANDER', overmind: 'THE OVERMIND' };
const DEFAULT_BEHAVIOR: Record<string, string> = { warden: 'gunner', commander: 'gunner', subject: 'charger', queen: 'charger', overmind: 'charger', crawler: 'melee' };

// Data-driven enemy. Behaviors: ranged (aim→[burst]→reload, fires only facing), gunner/charger (bosses),
// melee (crawler), hunter (chases across terrain: jumps gaps, climbs ladders & ledges), drone (flies).
export class Enemy extends Phaser.GameObjects.Sprite {
  kind: EnemyKind;
  hp: number; maxHp: number;
  alive = true;
  isBoss: boolean; bossName: string;

  private grid: LevelGrid;
  private host: EnemyHost;
  private cfg: any;
  private block: number;
  private art: string;
  private behavior: string;
  col: number; row: number;
  touchCd = 0;
  get isTouchAttacker() { return this.behavior === 'melee' || this.behavior === 'hunter'; }
  get fragile() { return !!this.cfg.fragile; }
  private facing: 1 | -1 = -1;
  private patrolMin: number; private patrolMax: number;

  // generalized move action
  private moving = false;
  private mFromX = 0; private mFromY = 0; private mToX = 0; private mToY = 0; private mStart = 0; private mDur = 0; private mPeak = 0; private mToCol = 0; private mToRow = 0;

  private fireState: 'patrol' | 'aim' | 'burst' | 'reload' = 'patrol';
  private aimUntil = 0; private reloadUntil = 0; private nextBurstAt = 0; private burstLeft = 0;
  private nextSummon = 0; private nextSlam = 0; private shotCount = 0; private shootUntil = 0;
  private alertUntil = 0; // while > now, a soldier holds position facing the player (a shot was fired)

  constructor(scene: Phaser.Scene, host: EnemyHost, grid: LevelGrid, kind: EnemyKind, col: number, floorRow: number, patrol: [number, number]) {
    const cfg = { ...(TUNING.enemies as any)[kind] }; // per-instance copy so tier tweaks never mutate the shared tuning
    super(scene, 0, 0, (cfg.art ?? kind) + '_0');
    this.kind = kind; this.host = host; this.grid = grid; this.block = grid.block; this.cfg = cfg;
    this.art = cfg.art ?? kind;
    this.behavior = cfg.behavior ?? DEFAULT_BEHAVIOR[kind] ?? 'ranged';
    this.isBoss = kind in BOSS_NAMES; this.bossName = BOSS_NAMES[kind] ?? '';
    this.hp = this.maxHp = cfg.hp;
    this.col = col; this.row = floorRow;
    this.setDepth(38);
    if (cfg.scale) this.setScale(cfg.scale);
    if (cfg.tint !== undefined) this.setTint(cfg.tint);
    this.setPosition(this.cx(col), this.feetY(floorRow));
    scene.add.existing(this);
    this.patrolMin = patrol[0]; this.patrolMax = patrol[1];
  }

  // per-level difficulty colors (tier 0 = no recolor). Each later level = the next color = +1 life & a longer burst.
  private static TIER_TINTS = [undefined, 0x7affa0, 0x6ab0ff, 0xc77dff, 0xff6a5a];
  /** Toughen this enemy for a later level: a distinct color, +tier hearts, and a 0.5s-spaced burst for shooters. */
  applyTier(tier: number) {
    if (tier <= 0 || this.isBoss) return;
    this.maxHp += tier; this.hp = this.maxHp;
    const tint = Enemy.TIER_TINTS[Math.min(tier, Enemy.TIER_TINTS.length - 1)];
    if (tint !== undefined) { this.cfg.tint = tint; this.setTint(tint); }
    if (this.behavior === 'ranged' || this.behavior === 'gunner' || this.behavior === 'drone')
      this.cfg.burst = { count: 1 + tier, gapMs: 500 }; // multiple shots, 0.5s apart
  }

  /** A shot was fired (by anyone): soldiers snap to face the player and HOLD POSITION for 5s before
   *  resuming their patrol. Only the patrolling shooter-soldiers react (not bosses/melee/drones). */
  alert(x: number, time: number) {
    if (!this.alive || this.behavior !== 'ranged') return;
    this.facing = x < this.x ? -1 : 1;
    this.alertUntil = time + 5000;
  }

  private cx(c: number) { return c * this.block + this.block / 2; }
  private feetY(row: number) { return row * this.block - this.displayHeight / 2; }
  private restoreTint() { if (this.cfg.tint !== undefined) this.setTint(this.cfg.tint); else this.clearTint(); }

  takeDamage(_amount: number) {
    if (!this.alive) return;
    this.hp -= 1;
    this.setTintFill(0xffffff); this.scene.time.delayedCall(50, () => { if (this.alive) this.restoreTint(); });
    if (this.hp <= 0) this.die();
  }
  private die() {
    if (!this.alive) return;
    this.alive = false;
    this.scene.events.emit('enemy-died', this);
    this.scene.tweens.add({ targets: this, alpha: 0, angle: this.facing * 70, y: this.y + 12, duration: 500, onComplete: () => this.destroy() });
  }

  // ---- grid queries ----
  private standAt(c: number, r: number) { return this.grid.isStandFloor(c, r) && !this.grid.isSpike(c, r) && !this.grid.isSolid(c, r - 1); }
  private walkablePatrol(c: number) { return c >= this.patrolMin && c <= this.patrolMax && this.standAt(c, this.row); }

  private canSee(p: Player): boolean {
    if (!p.alive) return false;
    const d = Phaser.Math.Distance.Between(this.x, this.y, p.x, p.y);
    const dark = this.host.darknessAt(p.x, p.y);
    if (d > this.cfg.sightPx * (1 - 0.45 * dark)) return false;
    if (!this.host.losClear(this.x, this.y - 8, p.x, p.y - 6)) return false;
    if (this.behavior !== 'melee' && this.behavior !== 'hunter' && p.inCover) return false; // melee/hunters sense you in cover
    return true;
  }

  update(time: number, dt: number) {
    if (!this.alive) return;
    if (this.moving) { this.progress(time); this.setFlipX(this.facing < 0); this.anim(true); return; }

    const p = this.host.player;
    const sees = this.canSee(p);
    switch (this.behavior) {
      case 'gunner': this.gunner(time, p, sees); break;
      case 'charger': this.charger(time, p, sees); break;
      case 'melee': if (sees) { this.facing = p.x < this.x ? -1 : 1; this.tryStep(this.facing, true); } else this.patrol(true); break;
      case 'hunter': if (sees) this.huntStep(p); else this.patrol(true); break;
      case 'drone': this.droneStep(time, dt, p, sees); break;
      default: // ranged
        if (time < this.alertUntil) {                       // alerted by a shot: hold position, face the player
          this.facing = p.x < this.x ? -1 : 1;
          if (sees) this.aimAndFire(time, p);               // fire if it can actually see you; otherwise just stand guard
          else this.fireState = 'patrol';
        } else if (sees && (p.x < this.x ? -1 : 1) === this.facing) this.aimAndFire(time, p);
        else { this.fireState = 'patrol'; this.patrol(false); }
    }
    this.setFlipX(this.facing < 0);
    this.anim(this.moving);
  }

  // ---- behaviors ----
  private gunner(time: number, p: Player, sees: boolean) {
    if (!sees) { this.fireState = 'patrol'; this.patrol(false); return; }
    this.facing = p.x < this.x ? -1 : 1;
    if (this.nextSummon === 0) this.nextSummon = time + (this.cfg.summonMs ?? 11000);
    else if (time >= this.nextSummon) { this.nextSummon = time + (this.cfg.summonMs ?? 11000); this.summonAdd(); }
    const wounded = this.hp <= this.maxHp * (this.cfg.chargeBelow ?? 0.4);
    if (wounded && Math.abs(p.x - this.x) > 2 * this.block) { this.fireState = 'patrol'; this.tryStep(this.facing, true); }
    else this.aimAndFire(time, p);
  }
  private charger(time: number, p: Player, sees: boolean) {
    if (!sees) { this.fireState = 'patrol'; this.patrol(true); return; }
    const dx = p.x - this.x; this.facing = dx < 0 ? -1 : 1;
    const enraged = this.cfg.summonAlways || this.hp <= this.maxHp * 0.5;
    if (enraged && (this.cfg.summonMs ?? 0) > 0) {
      if (this.nextSummon === 0) this.nextSummon = time + (this.cfg.summonMs ?? 7000);
      else if (time >= this.nextSummon) { this.nextSummon = time + (this.cfg.summonMs ?? 7000); this.summonAdd(); }
    }
    const range = (enraged ? 4 : (this.cfg.chargeRange ?? 6)) * this.block;
    if (Math.abs(dx) > range) { this.fireState = 'patrol'; this.tryStep(this.facing, true); }
    else {
      if (this.cfg.slamMs) {
        if (this.nextSlam === 0) this.nextSlam = time + this.cfg.slamMs;
        else if (time >= this.nextSlam) { this.nextSlam = time + this.cfg.slamMs; this.host.shockwave(this.x, this.y + this.displayHeight * 0.4, this.cfg.slamR ?? 90); }
      }
      this.aimAndFire(time, p);
    }
  }
  // hunter: pursue across terrain — climb to reach you, drop toward you, step, or JUMP a gap
  private huntStep(p: Player) {
    const dir = (p.x < this.x ? -1 : 1) as 1 | -1; this.facing = dir;
    if (this.cfg.canClimb && p.row < this.row - 1) { if (this.climbLadder()) return; if (this.climbLedge(dir)) return; }
    if (p.row > this.row + 1) { if (this.dropDown(dir)) return; }
    if (this.standAt(this.col + dir, this.row)) { this.tryStep(dir, true); return; }
    if (this.cfg.canJump && this.jumpGap(dir)) return;
    if (this.cfg.canClimb && this.climbLedge(dir)) return;
    this.facing = -dir as 1 | -1;
    if (this.standAt(this.col + this.facing, this.row)) this.tryStep(this.facing, true);
  }
  private droneStep(time: number, dt: number, p: Player, sees: boolean) {
    const sp = (this.cfg.droneSpeed ?? 95) * (dt / 1000);
    this.facing = p.x < this.x ? -1 : 1;
    const range = (this.cfg.fireRange ?? 6) * this.block;
    const tx = p.x - this.facing * range * 0.7, ty = p.y - 56; // hover off to the side, above head height
    this.x += Phaser.Math.Clamp(tx - this.x, -sp, sp);
    this.y += Phaser.Math.Clamp(ty - this.y, -sp, sp);
    if (sees && Math.abs(p.x - this.x) < range * 1.4) this.aimAndFire(time, p);
    else this.fireState = 'patrol';
  }

  // ---- combat ----
  private aimAndFire(time: number, p: Player) {
    const aimMs = this.cfg.aimMs ?? TUNING.enemyFire.aimMs;
    const reloadMs = this.cfg.reloadMs ?? TUNING.enemyFire.reloadMs;
    const bc = this.cfg.burst?.count ?? 1, bg = this.cfg.burst?.gapMs ?? 120;
    if (this.fireState === 'patrol') { this.fireState = 'aim'; this.aimUntil = time + aimMs; }
    else if (this.fireState === 'aim' && time >= this.aimUntil) {
      this.shoot(p); this.shootUntil = time + 260; this.burstLeft = bc - 1;
      if (this.burstLeft > 0) { this.fireState = 'burst'; this.nextBurstAt = time + bg; }
      else { this.fireState = 'reload'; this.reloadUntil = time + reloadMs; }
    } else if (this.fireState === 'burst' && time >= this.nextBurstAt) {
      this.shoot(p); this.shootUntil = time + 260; this.burstLeft--;
      if (this.burstLeft > 0) this.nextBurstAt = time + bg;
      else { this.fireState = 'reload'; this.reloadUntil = time + reloadMs; }
    } else if (this.fireState === 'reload' && time >= this.reloadUntil) { this.fireState = 'aim'; this.aimUntil = time + aimMs; }
  }
  private lob(p: Player) { const dx = Phaser.Math.Clamp(p.x - this.x, -360, 360); this.host.spawnGrenade(this.x, this.y - 8, dx * 1.1, -360, false); }
  private shoot(p: Player) {
    if (this.cfg.grenadeEvery && this.behavior === 'gunner') { this.shotCount++; if (this.shotCount % this.cfg.grenadeEvery === 0) { this.lob(p); return; } }
    if (this.cfg.lobs) { this.lob(p); return; }
    const base = Phaser.Math.Angle.Between(this.x, this.y - 8, p.x, p.y - 6);
    const pellets = this.cfg.pellets ?? 1;
    for (let i = 0; i < pellets; i++) {
      const spread = pellets > 1 ? (Math.random() - 0.5) * 2 * (this.cfg.spread ?? 0) : 0;
      this.host.fireEnemyBullet(this.x + this.facing * 14, this.y - 8, base + spread, this.cfg.projSpeed ?? 540, 1);
    }
  }
  private summonAdd() {
    for (const side of [-1, 1]) { const c = this.col + side * 2; if (this.standAt(c, this.row)) { this.host.summon('crawler', c, this.row); return; } }
  }

  // ---- movement primitives ----
  private patrol(run: boolean) {
    if (!this.walkablePatrol(this.col + this.facing)) this.facing = -this.facing as 1 | -1;
    if (this.walkablePatrol(this.col + this.facing)) this.tryStep(this.facing, run);
  }
  private tryStep(dir: 1 | -1, run: boolean) {
    this.facing = dir;
    if (this.behavior === 'hunter' ? !this.standAt(this.col + dir, this.row) : !this.walkablePatrol(this.col + dir)) return;
    const dur = run ? (TUNING.move.runMs / TUNING.move.runBlocks) : TUNING.move.stepMs;
    this.startMove(this.col + dir, this.row, dur, 0);
  }
  private jumpGap(dir: 1 | -1): boolean {
    if (this.grid.isSolid(this.col + dir, this.row - 1)) return false; // wall, not a gap
    for (let d = 2; d <= 5; d++) {
      const c = this.col + dir * d;
      if (this.standAt(c, this.row)) { this.startMove(c, this.row, 360, this.block * 1.4); return true; }
      if (this.grid.isSolid(c, this.row - 1)) break; // blocked overhead
    }
    return false;
  }
  private climbLadder(): boolean {
    if (!this.grid.isLadder(this.col, this.row - 1)) return false;
    let top = this.row; while (this.grid.isLadder(this.col, top - 1)) top--;
    if (top >= this.row) return false;
    this.startMove(this.col, top, 360, 0); return true;
  }
  private climbLedge(dir: 1 | -1): boolean {
    for (let lr = this.row - 2; lr >= this.row - 4; lr--) {
      if (this.grid.isSolid(this.col, lr) || this.grid.isSolid(this.col, lr + 1)) break; // ceiling above us
      if (this.standAt(this.col + dir, lr) && this.grid.isSolid(this.col + dir, lr + 1)) { this.startMove(this.col + dir, lr, 360, this.block * 0.5); return true; }
    }
    return false;
  }
  private dropDown(dir: 1 | -1): boolean {
    if (this.grid.isSolid(this.col + dir, this.row) || this.standAt(this.col + dir, this.row)) return false;
    const below = this.grid.floorBelow(this.col + dir, this.row + 1);
    if (below <= this.row || this.grid.isSpike(this.col + dir, below)) return false;
    this.startMove(this.col + dir, below, 320, 0); return true;
  }
  private startMove(toCol: number, toRow: number, dur: number, peak: number) {
    this.moving = true; this.mFromX = this.x; this.mFromY = this.y;
    this.mToX = this.cx(toCol); this.mToY = this.feetY(toRow); this.mToCol = toCol; this.mToRow = toRow;
    this.mStart = this.scene.time.now; this.mDur = dur; this.mPeak = peak;
  }
  private progress(time: number) {
    let pr = (time - this.mStart) / this.mDur; if (pr >= 1) pr = 1;
    const e = pr * pr * (3 - 2 * pr);
    this.x = this.mFromX + (this.mToX - this.mFromX) * e;
    this.y = this.mFromY + (this.mToY - this.mFromY) * e - (this.mPeak ? Math.sin(pr * Math.PI) * this.mPeak : 0);
    if (pr >= 1) { this.col = this.mToCol; this.row = this.mToRow; this.x = this.cx(this.col); this.y = this.feetY(this.row); this.moving = false; }
  }

  private anim(moving: boolean) {
    const A = this.scene.anims;
    if (moving) { const wk = this.art + '_walk'; if (A.exists(wk) && this.anims.currentAnim?.key !== wk) this.play(wk, true); return; }
    const firing = this.scene.time.now < this.shootUntil;
    let key = '';
    if (firing && A.exists(this.art + '_shoot')) key = this.art + '_shoot';
    else if (A.exists(this.art + '_idle')) key = this.art + '_idle';
    if (key) { if (this.anims.currentAnim?.key !== key) this.play(key, true); }
    else { this.anims.stop(); if (this.texture.key !== this.art + '_0') this.setTexture(this.art + '_0'); }
  }
}
