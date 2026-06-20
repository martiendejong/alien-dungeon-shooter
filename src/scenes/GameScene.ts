import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { LEVEL1 } from '../levels/level1';
import { LEVEL2 } from '../levels/level2';
import { LevelData, EnemyKind } from '../levels/types';
import { LevelGrid } from '../levels/grid';
import { Player, LevelQuery } from '../entities/Player';
import { Enemy, EnemyHost } from '../entities/Enemy';
import { LightingSystem, PxLight } from '../systems/LightingSystem';
import { InputManager } from '../systems/InputManager';
import { WeaponSystem, CombatHost, WeaponKey } from '../systems/WeaponSystem';
import { Sfx } from '../systems/Sfx';
import { LEVEL3 } from '../levels/level3';
import { LEVEL4 } from '../levels/level4';
import { LEVEL5 } from '../levels/level5';

const LEVELS: Record<string, LevelData> = { level1: LEVEL1, level2: LEVEL2, level3: LEVEL3, level4: LEVEL4, level5: LEVEL5 };

// Weapons found persist into later levels (the arsenal grows). Reset when a fresh run begins at level 1.
const carriedWeapons = new Set<string>();

export interface HudState {
  hp: number; maxHp: number; weapon: string; ammo: string; grenades: number;
  mode: string; objective: string; message: string;
  bossActive: boolean; bossHp: number; bossMax: number; bossName: string;
  alarm: boolean; escapeLeft: number;
}

export class GameScene extends Phaser.Scene implements LevelQuery, EnemyHost, CombatHost {
  private level!: LevelData;
  private grid!: LevelGrid;
  private block = 32;
  private _player!: Player;
  private input2!: InputManager;
  private weapons!: WeaponSystem;
  lighting!: LightingSystem;

  private solidsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemies: Enemy[] = [];
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private grenades!: Phaser.Physics.Arcade.Group;
  private pickups: { img: Phaser.GameObjects.Image; kind: string; weaponKey?: WeaponKey }[] = [];
  private reticle!: Phaser.GameObjects.Image;
  private followTarget!: Phaser.GameObjects.Image;

  private meleeHits = new Set<Enemy>();
  private grenadeCount = TUNING.grenade.startCount;
  private bossDead = false;
  private boss?: Enemy;
  private bossName = 'BOSS';
  private alarm = false;
  private levelTier = 0; // 0 for level 1; +1 per later level → enemy colour + extra life + longer burst
  private respawn = { col: 0, floorRow: 0 }; private respawnArmed = false; private cpReached = 0;
  private escapeUntil = 0;
  private searchX = 0; private searchDir: 1 | -1 = 1; private searchBeam?: Phaser.GameObjects.Image; private spottedCd = 0;
  private waveQueue: { kind: EnemyKind; col: number; floorRow: number }[] = []; private nextWaveAt = 0;
  private hazards: { col: number; floorRow: number; periodMs: number; onMs: number; offset: number; kind?: 'flame' | 'spike'; img: Phaser.GameObjects.Image }[] = [];
  // PoP-style timed gates + pressure plates
  private gateCells = new Set<number>();
  private gates: { id: number; col: number; row0: number; row1: number; openMs: number; stayOpen?: boolean; color?: number; openUntil: number; open: boolean; imgs: Phaser.GameObjects.Image[] }[] = [];
  private plates: { id: number; col: number; floorRow: number; color?: number; img: Phaser.GameObjects.Image; pressed: boolean }[] = [];
  private lastPlayerX = NaN;
  // loose/crumbling tiles ('T'): solid until you stand on one, then it shakes and falls away
  private looseCells = new Set<number>();
  private looseTiles: { col: number; row: number; img: Phaser.GameObjects.Image; fallAt: number; falling: boolean }[] = [];
  private ended = false;
  private paused = false;
  private msgUntil = 0;
  private lastGrenadeAt = 0;
  private exitX = 0; private exitY = 0;
  private lampPositions: { x: number; y: number }[] = [];

  hud: HudState = {
    hp: 100, maxHp: 100, weapon: 'PISTOL', ammo: '∞', grenades: 4,
    mode: 'WALK', objective: '', message: '', bossActive: false, bossHp: 0, bossMax: 1, bossName: 'BOSS', alarm: false, escapeLeft: -1,
  };

  constructor() { super('GameScene'); }
  get player(): Player { return this._player; }

  create(data: { level?: string }) {
    Sfx.resume(); Sfx.setMusicIntensity(0); Sfx.startMusic();
    this.ended = false; this.paused = false; this.bossDead = false; this.alarm = false;
    this.escapeUntil = 0; this.searchBeam = undefined; this.spottedCd = 0; this.hazards = []; this.waveQueue = []; this.nextWaveAt = 0;
    this.enemies = []; this.pickups = []; this.boss = undefined;
    this.gates = []; this.plates = []; this.gateCells = new Set<number>(); this.lastPlayerX = NaN;
    this.looseCells = new Set<number>(); this.looseTiles = [];
    this.grenadeCount = TUNING.grenade.startCount; this.meleeHits.clear();
    this.level = LEVELS[data?.level ?? 'level1'];
    this.levelTier = Math.max(0, (parseInt(this.level.id.replace(/\D/g, ''), 10) || 1) - 1); // level1→0, level2→1 … each = a new enemy color + extra life
    this.grid = new LevelGrid(this.level.grid, this.level.block);
    this.block = this.level.block;
    // gate cells must be known BEFORE buildSolids so the wall mesh skips them (doors are drawn separately)
    for (const ga of this.level.gates ?? []) for (let r = ga.row0; r <= ga.row1; r++) this.gateCells.add(r * this.grid.cols + ga.col);
    for (let r = 0; r < this.grid.rows; r++) for (let c = 0; c < this.grid.cols; c++) if (this.grid.charAt(c, r) === 'T') this.looseCells.add(r * this.grid.cols + c);
    this.makePuzzleTextures();
    const W = this.grid.worldW, H = this.grid.worldH;

    this.cameras.main.setBounds(0, 0, W, H).setZoom(1.6).setBackgroundColor(this.level.bgColor);
    this.physics.world.setBounds(0, 0, W, H);

    this.add.tileSprite(0, 0, W, H, 'tile_bg').setOrigin(0, 0).setDepth(-10).setScrollFactor(0.3).setAlpha(0.5);
    this.add.tileSprite(0, 0, W, H, 'tile_bg').setOrigin(0, 0).setDepth(-5).setScrollFactor(0.6).setAlpha(0.4);

    this.buildBackground();
    this.buildSolids();

    // lights: convert block coords → px
    const px: PxLight[] = this.level.lights.map(l => ({
      x: l.col * this.block + this.block / 2, y: l.row * this.block + this.block / 2,
      radius: l.radius * this.block, intensity: l.intensity, color: l.color, flicker: l.flicker,
    }));
    this.lighting = new LightingSystem(this, px, W, H);
    if (this.level.ambient !== undefined) this.lighting.setAmbient(this.level.ambient);
    for (const lp of this.lampPositions) this.lighting.addLight(lp.x, lp.y, this.block * 3.5, 0.5, 0xffcf6a, 0.12); // wall lamps glow

    this.enemyBullets = this.physics.add.group({ allowGravity: false });
    this.grenades = this.physics.add.group({ allowGravity: true });

    this.parseMarkers();
    this.buildPuzzles();

    this.physics.add.collider(this.grenades, this.solidsGroup);
    this.physics.add.collider(this.enemyBullets, this.solidsGroup, (b) => (b as any).destroy());

    this.input2 = new InputManager(this);
    this.weapons = new WeaponSystem(this);
    if (this.level.id === 'level1') carriedWeapons.clear();           // fresh run starts at the picture level
    if (!this.level.startUnarmed) this.weapons.acquire();             // armed by default; level 1 starts unarmed
    for (const k of carriedWeapons) this.weapons.give(k as WeaponKey); // carry the arsenal found in earlier levels
    this._player.armed = this.weapons.armed;                          // no gun drawn until acquired
    this.reticle = this.add.image(0, 0, 'reticle').setDepth(80);
    this.input.setDefaultCursor('none');

    this.followTarget = this.add.image(this._player.x, this._player.y, 'particle').setVisible(false);
    this.cameras.main.startFollow(this.followTarget, true, 0.14, 0.14).setDeadzone(140, 100);

    this.hud.objective = this.level.objective;
    this.events.on('player-melee', () => this.meleeHits.clear());
    this.events.on('enemy-died', (en: Enemy) => {
      Sfx.enemyDeath();
      this.deathBurst(en.x, en.y, en.isBoss);
      this.cameras.main.shake(en.isBoss ? 380 : 90, en.isBoss ? 0.013 : 0.0045);
      if (en.isBoss) {
        this.bossDead = true;
        this.cameras.main.flash(320, 255, 244, 210);
        this.tweens.add({ targets: this.cameras.main, zoom: 2.2, duration: 150, yoyo: true, hold: 260, ease: 'Sine.inOut' }); // kill-cam punch
        this.flashMessage(`${en.bossName} DOWN — reach the exit`);
      }
    });
    this.events.on('player-died', () => this.onPlayerDied());

    const sl = this.level.searchlights?.[0];
    if (sl) { this.searchX = sl.x0; this.searchBeam = this.add.image(sl.x0, sl.y, 'searchbeam').setOrigin(0.5, 0).setDepth(58).setBlendMode(Phaser.BlendModes.ADD); }
    for (const h of this.level.hazards ?? []) {
      const spike = h.kind === 'spike';
      const img = this.add.image(h.col * this.block + this.block / 2, h.floorRow * this.block, spike ? 'spikes' : 'flame')
        .setOrigin(0.5, 1).setDepth(55).setVisible(false);
      if (!spike) img.setBlendMode(Phaser.BlendModes.ADD); // flame glows; spikes are solid metal
      this.hazards.push({ ...h, img });
    }

    this.flashMessage(this.level.name);
    if (this.level.intro) this.time.delayedCall(2100, () => { if (!this.ended) this.flashMessage(this.level.intro!); });
  }

  // ---- world build ----------------------------------------------------------
  private cellHash(c: number, r: number) { return (((c * 73856093) ^ (r * 19349663) ^ (c * r * 0x9e37)) >>> 0); }
  /** solid for the static wall mesh — excludes gate/door + loose-tile cells, which are drawn separately */
  private isWall(c: number, r: number) { const k = r * this.grid.cols + c; return this.grid.isSolid(c, r) && !this.gateCells.has(k) && !this.looseCells.has(k); }

  private makePuzzleTextures() {
    if (!this.textures.exists('door')) {
      const b = this.block, g = this.add.graphics();
      g.fillStyle(0x2a2f3a, 1).fillRect(0, 0, b, b);
      g.fillStyle(0x3c4760, 1).fillRect(2, 0, 4, b).fillRect(b - 6, 0, 4, b); // side rails
      g.lineStyle(2, 0x8aa0c8, 1);
      for (let y = 4; y < b; y += 7) g.lineBetween(2, y, b - 2, y);            // horizontal bars
      g.fillStyle(0xffcf6a, 1).fillRect(b / 2 - 2, 2, 4, b - 4);               // bright center stud
      g.generateTexture('door', b, b); g.destroy();
    }
    if (!this.textures.exists('plate')) {
      const b = this.block, g = this.add.graphics();
      g.fillStyle(0x3a2f1a, 1).fillRect(2, b - 9, b - 4, 7);
      g.fillStyle(0xffcf3a, 1).fillRect(5, b - 8, b - 10, 4);                  // glowing button top
      g.generateTexture('plate', b, b); g.destroy();
    }
    if (!this.textures.exists('tile_loose')) {
      const b = this.block, g = this.add.graphics();
      g.fillStyle(0x6a5a48, 1).fillRect(0, 0, b, b);                      // cracked sandstone slab
      g.fillStyle(0x7e6c54, 1).fillRect(0, 0, b, 4);
      g.lineStyle(2, 0x3a2f22, 1);                                        // crack lines
      g.lineBetween(6, 2, 12, b - 4).lineBetween(b - 8, 3, b - 14, b - 5).lineBetween(2, b / 2, b - 2, b / 2 + 4);
      g.lineStyle(1, 0x241c14, 1).strokeRect(0, 0, b, b);
      g.generateTexture('tile_loose', b, b); g.destroy();
    }
    if (!this.textures.exists('plate_dn')) {
      const b = this.block, g = this.add.graphics();
      g.fillStyle(0x3a2f1a, 1).fillRect(2, b - 6, b - 4, 4);
      g.fillStyle(0x7a6a2a, 1).fillRect(5, b - 5, b - 10, 2);                  // pressed (dim, flush)
      g.generateTexture('plate_dn', b, b); g.destroy();
    }
  }

  private buildPuzzles() {
    const b = this.block;
    for (const ga of this.level.gates ?? []) {
      const imgs: Phaser.GameObjects.Image[] = [];
      for (let r = ga.row0; r <= ga.row1; r++) {
        const img = this.add.image(ga.col * b, r * b, 'door').setOrigin(0, 0).setDepth(24);
        if (ga.color !== undefined) img.setTint(ga.color);
        imgs.push(img);
      }
      this.gates.push({ ...ga, openUntil: 0, open: false, imgs });
    }
    for (const pl of this.level.plates ?? []) {
      const img = this.add.image(pl.col * b, (pl.floorRow - 1) * b, 'plate').setOrigin(0, 0).setDepth(23);
      if (pl.color !== undefined) img.setTint(pl.color);
      this.plates.push({ ...pl, img, pressed: false });
    }
    for (const k of this.looseCells) {
      const col = k % this.grid.cols, row = Math.floor(k / this.grid.cols);
      const img = this.add.image(col * b, row * b, 'tile_loose').setOrigin(0, 0).setDepth(22).setDisplaySize(b, b);
      this.looseTiles.push({ col, row, img, fallAt: 0, falling: false });
    }
  }

  private texW(key: string): number { const s = this.textures.get(key).getSourceImage() as any; return s ? s.width : 32; }

  /** Tile a rectangular REGION with a texture (one TileSprite per region — was per-cell, which froze the GPU).
   *  Real art is POT-tiled at a believable scale; placeholders tile per-cell. Globally aligned so regions seam up. */
  private tileRegion(x: number, y: number, w: number, h: number, key: string, depth: number, mode: 'block' | 'floor') {
    const b = this.block;
    const potKey = key + '_pot';
    const useKey = this.textures.exists(potKey) ? potKey : key;
    const big = useKey === potKey;
    const tw = this.texW(useKey);
    const ts = this.add.tileSprite(x, y, w, h, useKey).setOrigin(0, 0).setDepth(depth);
    if (mode === 'floor') {
      const spanX = big ? 8 : 1;
      const sx = (b * spanX) / tw, sy = b / tw; // whole texture height → one cell tall; lit lip stays on top
      ts.setTileScale(sx, sy); ts.setTilePosition(x / sx, 0);
    } else {
      const span = big ? 10 : 1, scale = (b * span) / tw;
      ts.setTileScale(scale, scale); ts.setTilePosition(x / scale, y / scale);
    }
    return ts;
  }

  private buildBackground() {
    const b = this.block;
    // ONE world-size brick layer behind everything — tinted darker so the background recedes
    this.tileRegion(0, 0, this.grid.worldW, this.grid.worldH, 'tile_brick', 2, 'block').setTint(0x8c8c98);
    // wall items hung on the brick (no windows). Lamps are weighted and also cast light.
    const props = ['prop_lamp', 'prop_lamp', 'prop_pipes', 'prop_chains', 'prop_grate', 'prop_sign'];
    this.lampPositions = [];
    for (let r = 0; r < this.grid.rows; r++)
      for (let c = 0; c < this.grid.cols; c++) {
        if (this.grid.isSolid(c, r) || this.grid.isLadder(c, r) || this.cellHash(c, r) % 13 !== 0) continue;
        const key = props[(this.cellHash(c, r) >> 5) % props.length];
        const x = c * b + b / 2, y = r * b + b / 2;
        this.add.image(x, y, key).setDepth(3);
        if (key === 'prop_lamp') this.lampPositions.push({ x, y });
      }
  }

  /** A flat Prince-of-Persia-style ledge: bright lit walking surface on top, stone face, dark underside. */
  private makePlatformTexture() {
    if (this.textures.exists('tile_platform')) return;
    const w = 64, h = 24, g = this.add.graphics();
    g.fillStyle(0x5d5d54, 1).fillRect(0, 0, w, h);             // stone body
    g.fillStyle(0x7c7c6e, 1).fillRect(0, 0, w, 6);             // lit top band
    g.fillStyle(0xa2a28c, 1).fillRect(0, 0, w, 2);             // bright walking edge
    g.fillStyle(0x4c4c45, 1); for (let x = 0; x < w; x += 16) g.fillRect(x, 6, 1, h - 11); // block joints
    g.fillStyle(0x383832, 1).fillRect(0, h - 5, w, 5);         // shadowed underside
    g.fillStyle(0x24241f, 1).fillRect(0, h - 2, w, 2);         // dark drop line
    g.generateTexture('tile_platform', w, h); g.destroy();
  }

  /** A merged solid rect is a "thin platform" (PoP ledge) when it is one row tall and open above AND below. */
  private isThinPlatform(c0: number, r: number, w: number, h: number): boolean {
    if (h !== 1) return false;
    for (let c = c0; c < c0 + w; c++) if (this.grid.isSolid(c, r - 1) || this.grid.isSolid(c, r + 1)) return false;
    return true;
  }

  private buildSolids() {
    this.solidsGroup = this.physics.add.staticGroup();
    const b = this.block;
    this.makePlatformTexture();
    const PLAT_LIP = 18; // visible thickness of a flat walkable ledge (px)
    const decals = ['decal_crack', 'decal_stain', 'decal_vent', 'decal_pipe', 'decal_panel', 'decal_moss', 'decal_cable', 'decal_bolts'];

    // 2D-merge solid cells into rectangles → one block TileSprite + one collision body per rectangle
    const seen: boolean[][] = Array.from({ length: this.grid.rows }, () => new Array(this.grid.cols).fill(false));
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        if (!this.isWall(c, r) || seen[r][c]) continue;
        let w = 1; while (c + w < this.grid.cols && this.isWall(c + w, r) && !seen[r][c + w]) w++;
        let h = 1;
        grow: while (r + h < this.grid.rows) {
          for (let cc = c; cc < c + w; cc++) if (!this.isWall(cc, r + h) || seen[r + h][cc]) break grow;
          h++;
        }
        for (let rr = r; rr < r + h; rr++) for (let cc = c; cc < c + w; cc++) seen[rr][cc] = true;
        const x = c * b, y = r * b, pw = w * b, ph = h * b;
        // thin platforms render as a flat floating ledge only (drawn in the floor pass) — no chunky rock body.
        // thick ground/walls keep a rock body, tinted dark so it recedes behind the lit walking surface.
        if (!this.isThinPlatform(c, r, w, h)) this.tileRegion(x, y, pw, ph, 'tile_rock_0', 20, 'block').setTint(0xcacad4);
        const body = this.add.rectangle(x + pw / 2, y + ph / 2, pw, ph).setVisible(false);
        this.physics.add.existing(body, true);
        this.solidsGroup.add(body);
      }
    }

    // floor caps: merge horizontal runs of walkable-surface cells → one floor TileSprite per run
    for (let r = 0; r < this.grid.rows; r++) {
      let c = 0;
      while (c < this.grid.cols) {
        if (this.isWall(c, r) && !this.grid.isSolid(c, r - 1) && !this.grid.isSpike(c, r)) {
          const c0 = c; while (c < this.grid.cols && this.isWall(c, r) && !this.grid.isSolid(c, r - 1) && !this.grid.isSpike(c, r)) c++;
          // flat PoP ledge: a thin lit walking slab at the very top of the floor row (no chunky full-cell cap)
          const runW = (c - c0) * b;
          const slab = this.add.tileSprite(c0 * b, r * b, runW, PLAT_LIP, 'tile_platform').setOrigin(0, 0).setDepth(21);
          slab.setTileScale(1, PLAT_LIP / 24); slab.setTilePosition(c0 * b, 0);
        } else c++;
      }
    }

    // scattered decals (cheap images) on bulk cells + ladders
    for (let r = 0; r < this.grid.rows; r++) {
      for (let c = 0; c < this.grid.cols; c++) {
        const h = this.cellHash(c, r);
        if (this.isWall(c, r) && this.grid.isSolid(c, r - 1) && h % 9 === 0)
          this.add.image(c * b + b / 2, r * b + b / 2, decals[(h >> 4) % decals.length]).setDepth(23).setAlpha(0.85).setDisplaySize(b, b);
        if (this.grid.isLadder(c, r)) this.add.image(c * b, r * b, 'tile_ladder').setOrigin(0, 0).setDepth(22).setDisplaySize(b, b);
        if (this.grid.isSpike(c, r)) this.add.image(c * b, r * b, 'spikes').setOrigin(0, 0).setDepth(22).setDisplaySize(b, b);
      }
    }
  }

  private parseMarkers() {
    const b = this.block;
    const kindOf: Record<string, EnemyKind> = {
      g: 'guard', c: 'crawler', r: 'grenadier', W: 'warden', Z: 'subject', Q: 'queen', K: 'commander', O: 'overmind',
      R: 'trooper_red', G: 'trooper_gold', M: 'marksman', N: 'sniper', B: 'bomber', H: 'hunter', J: 'leaper', U: 'brute', D: 'drone', F: 'gundrone',
    };
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const ch = this.grid.charAt(col, row);
        const floorRow = row + 1;
        if (ch === 'P') {
          this._player = new Player(this, this.grid, col, floorRow);
          this.respawn = { col, floorRow }; this.respawnArmed = !this.level.startUnarmed; this.cpReached = 0;
        } else if (ch === 'h') {
          this.add.tileSprite(col * b, row * b, b, b, 'tile_hide').setOrigin(0, 0).setDepth(19).setAlpha(0.92);
        } else if (ch === 'm' || ch === 'a' || ch === 'w' || ch === 'x' || ch === 'y' || ch === 'z') {
          const WK: Record<string, WeaponKey> = { w: 'pistol', x: 'shotgun', y: 'smg', z: 'rifle' };
          const TINT: Record<string, number> = { pistol: 0xffffff, shotgun: 0xff9a3a, smg: 0x6ad0ff, rifle: 0x7aff8a };
          const wkey = WK[ch];
          const kind = ch === 'm' ? 'medkit' : wkey ? 'weapon' : 'ammo';
          const tex = kind === 'weapon' ? 'gun' : kind;
          const img = this.add.image(col * b + b / 2, row * b + b / 2, tex).setDepth(30);
          if (kind === 'weapon') { img.setDisplaySize(28, 28 * img.height / img.width); if (wkey) img.setTint(TINT[wkey]); } // a small gun on the floor (texture is large)
          this.tweens.add({ targets: img, y: img.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
          this.pickups.push({ img, kind, weaponKey: wkey });
        } else if (ch === 'E') {
          this.exitX = col * b + b / 2; this.exitY = floorRow * b - 36;
          this.add.image(this.exitX, this.exitY, 'exit').setDepth(25);
        } else if (kindOf[ch]) {
          this.spawnEnemy(kindOf[ch], col, floorRow);
        }
      }
    }
  }

  private spawnEnemy(kind: EnemyKind, col: number, floorRow: number) {
    // auto patrol bounds = contiguous walkable floor around the spawn column (in COLS)
    let minC = col, maxC = col;
    while (this.grid.isStandFloor(minC - 1, floorRow) && !this.grid.isSpike(minC - 1, floorRow)) minC--;
    while (this.grid.isStandFloor(maxC + 1, floorRow) && !this.grid.isSpike(maxC + 1, floorRow)) maxC++;
    const en = new Enemy(this, this, this.grid, kind, col, floorRow, [minC, maxC]);
    en.applyTier(this.levelTier); // later levels: tougher, colour-coded variants (no-op for bosses / level 1)
    this.enemies.push(en);
    if (en.isBoss) { this.boss = en; this.bossName = en.bossName; }
  }

  // ---- CombatHost / EnemyHost ----------------------------------------------
  fireBullet(x: number, y: number, angle: number, speed: number, dmg: number, friendly: boolean) {
    const group = friendly ? this.enemyBullets : this.enemyBullets; // only enemies use projectiles now
    const b = group.create(x, y, 'bullet_enemy') as Phaser.Physics.Arcade.Image;
    b.setRotation(angle).setDepth(62).setData('dmg', dmg);
    (b.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.physics.velocityFromRotation(angle, speed, (b.body as Phaser.Physics.Arcade.Body).velocity);
    this.time.delayedCall(2200, () => { if (b.active) b.destroy(); });
  }
  fireEnemyBullet(x: number, y: number, angle: number, speed: number, dmg: number) { this.fireBullet(x, y, angle, speed, dmg, false); Sfx.enemyShot(); this.alertSoldiers(); }

  hitscan(x: number, y: number, angle: number, dmg: number, range: number) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    let endX = x + dx * range, endY = y + dy * range;
    let hitEnemy: Enemy | undefined;
    for (let t = 6; t <= range; t += 6) {
      const px = x + dx * t, py = y + dy * t;
      if (this.grid.isSolidPx(px, py)) { endX = px; endY = py; break; }
      let blocked = false;
      for (const en of this.enemies) {
        if (!en.alive) continue;
        const bb = en.getBounds();
        if (px >= bb.x && px <= bb.x + bb.width && py >= bb.y && py <= bb.y + bb.height) { hitEnemy = en; endX = px; endY = py; blocked = true; break; }
      }
      if (blocked) break;
    }
    if (hitEnemy) hitEnemy.takeDamage(dmg);
    const dist = Phaser.Math.Distance.Between(x, y, endX, endY);
    const streak = this.add.image(x, y, 'tracer').setDepth(64).setBlendMode(Phaser.BlendModes.ADD).setRotation(angle).setOrigin(0.85, 0.5);
    const dur = Phaser.Math.Clamp(dist / 2.6, 18, 130);
    this.tweens.add({
      targets: streak, x: endX, y: endY, duration: dur, ease: 'Linear',
      onComplete: () => {
        streak.destroy();
        const spark = this.add.image(endX, endY, 'spark').setDepth(70).setBlendMode(Phaser.BlendModes.ADD).setScale(hitEnemy ? 1.5 : 0.9);
        this.tweens.add({ targets: spark, alpha: 0, scale: 0.2, duration: 120, onComplete: () => spark.destroy() });
        this.lighting.pulse(endX, endY, 70, 0.6, 50);
      },
    });
  }

  flash(x: number, y: number) {
    this.lighting.pulse(x, y, 130, 1, 80);
    const f = this.add.image(x, y, 'spark').setDepth(70).setScale(1.9).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: f, alpha: 0, scale: 0.4, duration: 90, onComplete: () => f.destroy() });
    this.cameras.main.shake(60, 0.004); // recoil kick on every shot
    // ejected shell casing
    const dir = this._player ? this._player.facing : 1;
    const sc = this.add.image(x, y, 'particle').setDepth(63).setScale(0.5).setTint(0xffcf6a);
    this.tweens.add({ targets: sc, x: x - dir * (10 + Math.random() * 8), y: y + 16 + Math.random() * 6, angle: 220, alpha: 0, duration: 380, onComplete: () => sc.destroy() });
    Sfx.shot();
    this.alertSoldiers(); // a shot gives you away: every soldier turns to face you and holds for 5s
  }

  /** Particle burst for a kill (bigger for bosses) — pure visual juice. */
  private deathBurst(x: number, y: number, big: boolean) {
    const n = big ? 26 : 10, reach = big ? 170 : 90;
    this.lighting.pulse(x, y, big ? 190 : 80, 1, big ? 200 : 90);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.6, sp = reach * (0.5 + Math.random());
      const p = this.add.image(x, y, 'spark').setDepth(72).setBlendMode(Phaser.BlendModes.ADD).setTint(big ? 0xff7a3a : 0xffd060).setScale(big ? 1.6 : 1);
      this.tweens.add({ targets: p, x: x + Math.cos(a) * sp, y: y + Math.sin(a) * sp, alpha: 0, scale: 0.2, duration: big ? 520 : 300, onComplete: () => p.destroy() });
    }
  }

  /** A shot was fired (player or enemy): all soldiers snap to face the player and hold position 5s. */
  private alertSoldiers() {
    const t = this.time.now;
    for (const en of this.enemies) en.alert(this._player.x, t);
  }

  // ---- ALARM: grabbing the weapon puts Site Echo into lockdown ----------------
  private triggerAlarm() {
    if (this.alarm) return;
    this.alarm = true;
    this.flashMessage(this.level.alarmMsg ?? '⚠ ALARM — SITE ECHO LOCKDOWN');
    Sfx.alarm(); Sfx.setMusicIntensity(1);
    this.cameras.main.flash(360, 150, 10, 10);
    this.cameras.main.shake(500, 0.012);
    if (this.level.escapeMs) this.escapeUntil = this.time.now + this.level.escapeMs;
    this.searchBeam?.setVisible(false);
    this.waveQueue = [...(this.level.reinforcements ?? [])]; // released in waves, not all at once
    this.nextWaveAt = this.time.now + 700;
  }
  summon(kind: EnemyKind, col: number, floorRow: number) {
    if (!this.grid.isStandFloor(col, floorRow) || this.grid.isSpike(col, floorRow)) return;
    this.spawnEnemy(kind, col, floorRow);
    if (kind === 'warden' || kind === 'subject' || kind === 'queen' || kind === 'commander' || kind === 'overmind') Sfx.bossRoar();
    // teleport-in spark
    const x = col * this.block + this.block / 2, y = floorRow * this.block - 16;
    const s = this.add.image(x, y, 'spark').setDepth(70).setScale(2.4).setTint(0xff5a3a).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: s, alpha: 0, scale: 0.4, duration: 260, onComplete: () => s.destroy() });
  }

  spawnGrenade(x: number, y: number, vx: number, vy: number, _friendly: boolean) {
    const g = this.grenades.create(x, y, 'grenade') as Phaser.Physics.Arcade.Image;
    g.setDepth(62);
    const body = g.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true).setBounce(TUNING.grenade.bounce, TUNING.grenade.bounce).setVelocity(vx, vy);
    this.tweens.add({ targets: g, angle: 360, duration: 600, repeat: -1 });
    this.time.delayedCall(TUNING.grenade.fuseMs, () => { if (g.active) { this.explode(g.x, g.y); g.destroy(); } });
  }
  explode(x: number, y: number) {
    const R = TUNING.grenade.radius;
    Sfx.explosion();
    this.lighting.pulse(x, y, R * 2.2, 1, 160);
    this.cameras.main.shake(220, 0.012);
    const ring = this.add.image(x, y, 'particle').setDepth(70).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffb060).setScale(2);
    this.tweens.add({ targets: ring, scale: R / 6, alpha: 0, duration: 320, onComplete: () => ring.destroy() });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2, sp = 120 + Math.random() * 160;
      const pt = this.add.image(x, y, 'spark').setDepth(70).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: pt, x: x + Math.cos(a) * sp, y: y + Math.sin(a) * sp, alpha: 0, duration: 380, onComplete: () => pt.destroy() });
    }
    if (this._player.alive && Phaser.Math.Distance.Between(x, y, this._player.x, this._player.y) <= R) this._player.takeDamage(1, true);
    for (const en of this.enemies) if (en.alive && Phaser.Math.Distance.Between(x, y, en.x, en.y) <= R) en.takeDamage(TUNING.grenade.dmg);
  }

  shockwave(x: number, y: number, radius: number) {
    Sfx.explosion(); this.cameras.main.shake(200, 0.011);
    const ring = this.add.image(x, y, 'particle').setDepth(70).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff8a3a).setScale(1.4);
    this.tweens.add({ targets: ring, scale: radius / 6, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    if (this._player.alive && Phaser.Math.Distance.Between(x, y, this._player.x, this._player.y) <= radius) { if (this._player.takeDamage(1, true)) Sfx.hit(); }
  }

  losClear(x1: number, y1: number, x2: number, y2: number): boolean {
    const steps = Math.ceil(Phaser.Math.Distance.Between(x1, y1, x2, y2) / 12);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (this.grid.isSolidPx(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
    }
    return true;
  }

  // ---- LevelQuery -----------------------------------------------------------
  darknessAt(x: number, y: number): number { return this.lighting.darknessAt(x, y); }
  hideAt(x: number, y: number): boolean {
    return this.grid.charAt(this.grid.colOfX(x), Math.floor(y / this.block)) === 'h';
  }

  // ---- gameplay -------------------------------------------------------------
  private collect(p: { img: Phaser.GameObjects.Image; kind: string; weaponKey?: WeaponKey }) {
    Sfx.pickup();
    if (p.kind === 'medkit') { this._player.hp = Math.min(this._player.maxHp, this._player.hp + 1); this.flashMessage('+1 HEART'); }
    else if (p.kind === 'weapon') {
      const key = p.weaponKey ?? 'pistol';
      this.weapons.give(key); this._player.armed = true;
      this.flashMessage(`${key.toUpperCase()} ACQUIRED`);
    }
    else { this.weapons.addAmmo(20); this.flashMessage('+AMMO'); }
    p.img.destroy();
  }
  private onPlayerDied() {
    if (this.ended) return;
    // FULL level restart on death: every enemy respawns and any weapon picked up here is lost
    // (create() re-arms only when the level isn't startUnarmed) — no checkpoints.
    this.ended = true; Sfx.lose();
    this.flashMessage('YOU DIED — RESTARTING LEVEL');
    this.cameras.main.flash(300, 90, 0, 0);
    this.time.delayedCall(1200, () => this.scene.restart({ level: this.level.id }));
  }
  private win() {
    if (this.ended) return;
    this.ended = true; Sfx.win();
    for (const k of this.weapons.ownedKeys()) carriedWeapons.add(k); // carry the arsenal into the next level
    const next = this.level.next;
    if (next && LEVELS[next]) {
      this.flashMessage(this.level.outro ?? 'LEVEL CLEARED…');
      this.time.delayedCall(1900, () => this.scene.restart({ level: next }));
    } else {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', { win: true, level: this.level.name });
    }
  }
  private flashMessage(msg: string) { this.hud.message = msg; this.msgUntil = this.time.now + 2200; }

  // ---- loop -----------------------------------------------------------------
  update(time: number, delta: number) {
    if (!this._player) return;
    this.input2.update(time);
    if (this.input2.pausePressed && !this.ended) this.paused = !this.paused;
    if (this.paused) { this.hud.message = 'PAUSED  (ESC to resume)'; this.msgUntil = time + 100; this.syncHud(); return; }

    this._player.tick(time, delta, this.input2, this);
    if (this._player.alive) {
      this.weapons.update(time, this.input2, this._player);
      this.handleGrenade(time);
      this.handleMelee();
      this.handlePlayerHits(time);
      const st = this._player.state;
      if (this.grid.isSpike(this._player.col, this._player.row) && (st === 'idle' || st === 'step' || st === 'run' || st === 'melee')) {
        this.flashMessage('IMPALED ON THE SPIKES'); this._player.takeDamage(999, true);
      }
    }
    for (const e of this.enemies) e.update(time, delta);
    this.updateLooseTiles(time);
    this.updatePuzzles(time);
    this.updateAlarm(time, delta);
    this.lighting.update(time);

    this.followTarget.setPosition(this._player.x, this._player.y);
    const aim = this.input2.aimWorld();
    this.reticle.setPosition(aim.x, aim.y);
    if (time > this.msgUntil) this.hud.message = '';
    this.syncHud();
  }

  private updateAlarm(time: number, delta: number) {
    // crossing a trigger column trips the alarm (e.g. the infestation in the dungeon)
    if (!this.alarm && this._player.alive && ((this.level.alarmAtCol !== undefined && this._player.col >= this.level.alarmAtCol) || (this.level.alarmAtRow !== undefined && this._player.row <= this.level.alarmAtRow))) this.triggerAlarm();
    const sl = this.level.searchlights?.[0];
    if (sl && this.searchBeam) {
      if (this.alarm) this.searchBeam.setVisible(false);
      else {
        this.searchX += this.searchDir * sl.speed * (delta / 1000);
        if (this.searchX <= sl.x0) { this.searchX = sl.x0; this.searchDir = 1; }
        else if (this.searchX >= sl.x1) { this.searchX = sl.x1; this.searchDir = -1; }
        this.searchBeam.setPosition(this.searchX, sl.y);
        this.lighting.pulse(this.searchX, sl.y + 130, 95, 0.7, 30);
        const p = this._player;
        if (p.alive && !p.inCover && Math.abs(p.x - this.searchX) < 46 && p.y > sl.y && time > this.spottedCd) {
          this.spottedCd = time + 4500;
          this.flashMessage('SPOTTED!'); this.cameras.main.shake(220, 0.008);
          this.summon('crawler', p.col + 4, p.row); this.summon('crawler', p.col - 4, p.row);
        }
      }
    }
    // reinforcement WAVES: release the breach queue gradually (never a single burst, never a runaway)
    if (this.alarm && !this.ended && this.waveQueue.length && time >= this.nextWaveAt) {
      if (this.enemies.filter(e => e.alive && !e.isBoss).length < 10) {
        const r = this.waveQueue.shift()!; this.summon(r.kind, r.col, r.floorRow);
      }
      this.nextWaveAt = time + (this.level.waveMs ?? 3000);
    }
    if (this.alarm && this.escapeUntil && !this.ended && time > this.escapeUntil) {
      this.flashMessage('OUT OF TIME'); this._player.takeDamage(99, true);
    }
    // timed flame jets
    const p = this._player;
    for (const h of this.hazards) {
      const t = (time + h.offset) % h.periodMs;
      const on = t < h.onMs, warn = !on && t > h.periodMs - 400;
      h.img.setVisible(on || warn).setAlpha(on ? 1 : 0.4).setScale(1, on ? 1 : 0.5);
      if (on && p.alive && p.col === h.col && p.row === h.floorRow) p.takeDamage(1, true);
    }
  }

  // ---- PoP timed gates ------------------------------------------------------
  private openGate(g: GameScene['gates'][number], time: number) {
    g.openUntil = time + g.openMs;          // (re)start the close timer on every press
    if (g.open) return;
    g.open = true;
    const b = this.block;
    for (let i = 0; i < g.imgs.length; i++) {
      const r = g.row0 + i; this.grid.setOpen(g.col, r, true);
      const img = g.imgs[i];
      this.tweens.killTweensOf(img);
      this.tweens.add({ targets: img, y: (g.row0 - 1) * b, alpha: 0.25, duration: 220, ease: 'Back.in' }); // slide up into the lintel
    }
    Sfx.alarm();
    this.lighting.pulse(g.col * b + b / 2, (g.row0 + g.imgs.length) * b, 90, 0.6, 120);
  }
  private closeGate(g: GameScene['gates'][number]) {
    g.open = false; g.openUntil = 0;
    const b = this.block;
    const p = this._player;
    const crushed = p?.alive && p.col === g.col && p.row - 1 >= g.row0 && p.row - 1 <= g.row1 + 1;
    for (let i = 0; i < g.imgs.length; i++) {
      const r = g.row0 + i; this.grid.setOpen(g.col, r, false);
      const img = g.imgs[i];
      this.tweens.killTweensOf(img);
      img.setAlpha(1); img.setTint(g.color ?? 0xffffff);
      this.tweens.add({ targets: img, y: r * b, duration: 90, ease: 'Bounce.out' }); // SLAM shut
    }
    Sfx.melee(); this.cameras.main.shake(120, 0.006);
    if (crushed) { // caught in the doorway — shoved out the way you were facing + hurt
      this.flashMessage('CRUSHED BY THE GATE');
      if (this._player.takeDamage(1, true)) Sfx.hit();
      const dir = this._player.facing >= 0 ? 1 : -1;
      const dest = this.grid.floorBelow(g.col + dir, g.row0);
      if (dest >= 0) this._player.revive(g.col + dir, dest);
    }
  }
  /** Loose tiles: when you stand on one it shakes for ~0.4s, then drops away and you fall through. */
  private updateLooseTiles(time: number) {
    const p = this._player; const b = this.block;
    for (const t of this.looseTiles) {
      if (t.falling) continue;
      const onIt = p?.alive && p.col === t.col && p.row === t.row;
      if (onIt && t.fallAt === 0) t.fallAt = time + 420;           // armed — start the timer
      if (t.fallAt > 0 && time < t.fallAt) { t.img.x = t.col * b + (Math.floor(time / 45) % 2 ? 1.5 : -1.5); } // shake
      else if (t.fallAt > 0 && time >= t.fallAt) {                 // crumble: open the cell and drop the tile
        t.falling = true; t.img.x = t.col * b;
        this.grid.setOpen(t.col, t.row, true);
        Sfx.land();
        this.tweens.add({ targets: t.img, y: t.img.y + b * 4, alpha: 0, angle: 40, duration: 600, onComplete: () => t.img.destroy() });
      }
    }
  }

  private updatePuzzles(time: number) {
    const p = this._player;
    const b = this.block;
    // SWEPT detection: the grid col only snaps when a run-step finishes and the loop can run at low FPS,
    // so point-sampling would let a sprinter blow past the plate. Trigger if the player's x crossed the cell.
    const curX = p ? p.x : NaN;
    const prevX = isNaN(this.lastPlayerX) ? curX : this.lastPlayerX;
    const lo = Math.min(prevX, curX), hi = Math.max(prevX, curX);
    const grounded = !!p && (p.state === 'idle' || p.state === 'run' || p.state === 'step');
    for (const pl of this.plates) {
      const x0 = pl.col * b, x1 = (pl.col + 1) * b;
      const swept = !isNaN(curX) && hi >= x0 && lo <= x1;            // player crossed (or rests on) the plate cell
      const on = !!p && p.alive && grounded && swept && p.row === pl.floorRow;
      if (on && !pl.pressed) { Sfx.pickup(); this.flashMessage('GATE OPEN — GO!'); }
      if (on) { pl.img.setTexture('plate_dn'); for (const g of this.gates) if (g.id === pl.id) this.openGate(g, time); }
      else pl.img.setTexture('plate');
      pl.pressed = !!on;
    }
    this.lastPlayerX = curX;
    for (const g of this.gates) {
      if (!g.open) continue;
      if (g.stayOpen) continue;                  // permanent switch-gate: never re-closes
      if (time >= g.openUntil) { this.closeGate(g); continue; }
      // blink urgently in the last second before it slams
      if (g.openUntil - time < 1000) {
        const blink = Math.floor(time / 110) % 2 === 0;
        for (const img of g.imgs) img.setTint(blink ? 0xff5a3a : (g.color ?? 0xffffff));
      }
    }
  }

  private handleGrenade(time: number) {
    if (!this.input2.grenadePressed || this.grenadeCount <= 0 || time - this.lastGrenadeAt < 400) return;
    this.lastGrenadeAt = time; this.grenadeCount--;
    const m = this._player.getMuzzle(); const a = this._player.aimAngle;
    this.spawnGrenade(m.x, m.y - 4, Math.cos(a) * TUNING.grenade.throwSpeed, Math.sin(a) * TUNING.grenade.throwSpeed - 120, true);
  }
  private handleMelee() {
    const hb = this._player.meleeHitbox();
    if (!hb) return;
    for (const en of this.enemies) {
      if (!en.alive || this.meleeHits.has(en)) continue;
      if (Phaser.Math.Distance.Between(hb.x, hb.y, en.x, en.y) <= hb.r) {
        en.takeDamage(TUNING.melee.dmg); this.meleeHits.add(en); this.cameras.main.shake(80, 0.004); Sfx.melee();
      }
    }
  }
  private handlePlayerHits(time: number) {
    const pb = this._player.getBounds();
    // enemy bullets vs player
    for (const b of this.enemyBullets.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (!b.active) continue;
      if (Phaser.Geom.Rectangle.Contains(pb, b.x, b.y)) { if (this._player.takeDamage(1)) Sfx.hit(); b.destroy(); }
    }
    // melee/hunter contact: costs the player 1 heart; "fragile" ones (crawlers/leapers) die on contact, the rest keep attacking
    for (const en of this.enemies) {
      if (!en.alive || !en.isTouchAttacker) continue;
      if (Phaser.Math.Distance.Between(en.x, en.y, this._player.x, this._player.y) < 28 && time >= en.touchCd) {
        en.touchCd = time + 600;
        if (this._player.takeDamage(1, true)) Sfx.hit();
        if (en.fragile) en.takeDamage(1);
      }
    }
    // pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const p = this.pickups[i];
      if (Phaser.Math.Distance.Between(p.img.x, p.img.y, this._player.x, this._player.y) < 26) { this.collect(p); this.pickups.splice(i, 1); }
    }
    // exit
    if (this.exitX && Phaser.Math.Distance.Between(this.exitX, this.exitY, this._player.x, this._player.y) < 40) {
      if (this.bossDead || !this.boss) this.win(); // no boss in the level → the exit is simply the goal (e.g. the stealth maze)
      else if (time > this.msgUntil) this.flashMessage(`The gate is locked. Kill ${this.bossName}.`);
    }
  }
  private syncHud() {
    const w = this.weapons.hud();
    this.hud.hp = this._player.hp; this.hud.maxHp = this._player.maxHp;
    this.hud.weapon = w.name; this.hud.ammo = this._player.reloading ? 'RELOADING…' : w.ammo;
    this.hud.grenades = this.grenadeCount;
    this.hud.mode = this.input2.runMode ? 'RUN' : 'WALK';
    this.hud.bossActive = !!this.boss && this.boss.alive && this.cameras.main.worldView.contains(this.boss.x, this.boss.y);
    if (this.boss) { this.hud.bossHp = Math.max(0, this.boss.hp); this.hud.bossMax = this.boss.maxHp; this.hud.bossName = this.boss.bossName; }
    this.hud.alarm = this.alarm;
    this.hud.escapeLeft = (this.alarm && this.escapeUntil) ? Math.max(0, Math.ceil((this.escapeUntil - this.time.now) / 1000)) : -1;
  }
}
