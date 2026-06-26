import Phaser from 'phaser';
import { TextureFactory } from '../art/TextureFactory';
import { ASSETS } from '../art/manifest';

// Player sprite sheet "player animations 1.png" (1536x1024) — frame boxes detected from the art.
const COLE_SHEET = 'cole_sheet';
const COLE_SHEET_FILE = 'assets/tiles/player animations 1.png';
const COLE_FRAMES: Record<string, number[][]> = {
  idle: [[154,49,42,121],[264,49,44,121],[374,49,46,121],[484,49,42,121],[594,49,43,121],[703,49,43,121]],
  walk: [[152,234,60,124],[263,234,64,123],[391,234,58,125],[498,234,75,124],[624,234,61,125],[737,234,65,118],[870,234,70,124],[994,234,64,124]],
  run:  [[143,402,77,117],[267,402,79,119],[396,401,71,116],[519,401,92,116],[669,402,71,120],[782,401,78,121],[901,401,77,120],[1017,405,73,117]],
  jump: [[140,596,59,88],[236,577,86,107],[368,557,75,121],[486,554,66,108],[612,553,62,99],[737,559,63,114],[841,597,59,87]],
  crouch: [[157,863,54,80],[285,855,52,86],[388,860,53,81]],
};
// "player animations 2.png" — a hang→mantle→stand ledge-climb sequence (8 frames, character only)
const COLE_SHEET2 = 'cole_sheet2';
const COLE_SHEET2_FILE = 'assets/tiles/player animations 2.png';
const COLE2_FRAMES: Record<string, number[][]> = {
  hang: [[85,437,83,251],[272,427,76,261],[451,376,100,234],[634,351,102,208],[810,375,143,98],[1002,344,135,128],[1204,309,105,162],[1386,260,72,212]],
};
// "player animations 3.png" — ladder climb cycle (back view, 7 frames, character only)
const COLE_SHEET3 = 'cole_sheet3';
const COLE_SHEET3_FILE = 'assets/tiles/player animations 3.png';
const COLE3_FRAMES: Record<string, number[][]> = {
  ladder: [[87,392,104,319],[296,376,110,329],[505,358,109,326],[715,340,105,320],[930,327,107,318],[1147,304,106,310],[1357,276,113,277]],
};

export class BootScene extends Phaser.Scene {
  private coleReady = false;
  private cole2Ready = false;
  private cole3Ready = false;
  private alienReady = false;
  private soldierReady = false;
  private soldier2Ready = false;
  constructor() { super('BootScene'); }

  create() {
    TextureFactory.generateAll(this);

    const finish = () => {
      for (const a of ASSETS) this.makePot(a.key);
      this.defineColeSheet();
      this.keyOutBackground('gun', 70);   // drawn pistol → transparent background
      this.trimToContent('gun');          // crop away the empty margins so it scales right
      this.bakeCrawler();                 // running-alien sheet → crawler frames
      this.bakeSoldiers();                // soldier sheets → guard + grenadier frames
      this.makeAnims();
      this.scene.start('MainMenuScene');
    };

    for (const a of ASSETS) { if (this.textures.exists(a.key)) this.textures.remove(a.key); this.load.image(a.key, a.file); }
    if (this.textures.exists(COLE_SHEET)) this.textures.remove(COLE_SHEET);
    this.load.image(COLE_SHEET, COLE_SHEET_FILE);
    if (this.textures.exists(COLE_SHEET2)) this.textures.remove(COLE_SHEET2);
    this.load.image(COLE_SHEET2, COLE_SHEET2_FILE);
    if (this.textures.exists(COLE_SHEET3)) this.textures.remove(COLE_SHEET3);
    this.load.image(COLE_SHEET3, COLE_SHEET3_FILE);
    if (this.textures.exists('gun')) this.textures.remove('gun');
    this.load.image('gun', 'assets/tiles/gun.png');
    if (this.textures.exists('exit')) this.textures.remove('exit');
    this.load.image('exit', 'assets/tiles/elevatordoor.png');
    this.load.image('alien_run', 'assets/tiles/running alien.png');
    this.load.image('soldier_sheet', 'assets/tiles/soldier.png');
    this.load.image('soldier2_sheet', 'assets/tiles/soldier 2.png');
    this.load.once(Phaser.Loader.Events.COMPLETE, finish);
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (f: any) => console.warn('[assets] missing override:', f.key, f.src));
    this.load.start();
  }

  // Make the sheet's solid background transparent: flood-fill from the borders through background-coloured
  // pixels (so the character's own dark pixels, which aren't connected to the border, are preserved).
  // flood-fill from the borders, turning background-coloured (or already-transparent) pixels transparent
  private floodAlpha(d: Uint8ClampedArray, W: number, H: number, bg: number[], tol: number) {
    const isBg = (i: number) => d[i + 3] < 8 || Math.max(Math.abs(d[i] - bg[0]), Math.abs(d[i + 1] - bg[1]), Math.abs(d[i + 2] - bg[2])) <= tol;
    const seen = new Uint8Array(W * H);
    const stack: number[] = [];
    for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
    for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
    while (stack.length) {
      const p = stack.pop()!; if (seen[p]) continue; const i = p * 4; if (!isBg(i)) continue;
      seen[p] = 1; d[i + 3] = 0;
      const x = p % W, y = (p / W) | 0;
      if (x > 0) stack.push(p - 1); if (x < W - 1) stack.push(p + 1);
      if (y > 0) stack.push(p - W); if (y < H - 1) stack.push(p + W);
    }
  }
  private keyOutBackground(key: string, tol = 24) {
    if (!this.textures.exists(key)) return;
    const src = this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const W = src.width, H = src.height;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!; ctx.drawImage(src as any, 0, 0);
    const id = ctx.getImageData(0, 0, W, H); const d = id.data;
    const bi = (2 * W + 2) * 4;
    this.floodAlpha(d, W, H, [d[bi], d[bi + 1], d[bi + 2]], tol);
    ctx.putImageData(id, 0, 0);
    this.textures.remove(key);
    this.textures.addCanvas(key, cv);
  }

  // crop a (transparent-bg) texture to its non-transparent content bounds
  private trimToContent(key: string) {
    if (!this.textures.exists(key)) return;
    const src = this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const W = src.width, H = src.height;
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d')!; ctx.drawImage(src as any, 0, 0);
    const d = ctx.getImageData(0, 0, W, H).data;
    let mnx = W, mny = H, mxx = -1, mxy = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 16) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
    if (mxx < 0) return;
    const w = mxx - mnx + 1, h = mxy - mny + 1;
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    out.getContext('2d')!.drawImage(cv, mnx, mny, w, h, 0, 0, w, h);
    this.textures.remove(key); this.textures.addCanvas(key, out);
  }

  // tight-crop a (transparent) cell canvas to its content and scale by a fixed factor (feet stay at the bottom)
  private tightScale(cell: HTMLCanvasElement, alphaMin: number, scale: number): HTMLCanvasElement {
    const w = cell.width, h = cell.height;
    const d = cell.getContext('2d')!.getImageData(0, 0, w, h).data;
    let mnx = w, mny = h, mxx = -1, mxy = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > alphaMin) { if (x < mnx) mnx = x; if (x > mxx) mxx = x; if (y < mny) mny = y; if (y > mxy) mxy = y; }
    if (mxx < 0) { const e = document.createElement('canvas'); e.width = e.height = 1; return e; }
    const cw = mxx - mnx + 1, ch = mxy - mny + 1, ow = Math.max(1, Math.round(cw * scale)), oh = Math.max(1, Math.round(ch * scale));
    const out = document.createElement('canvas'); out.width = ow; out.height = oh;
    out.getContext('2d')!.drawImage(cell, mnx, mny, cw, ch, 0, 0, ow, oh);
    return out;
  }
  private addBaked(key: string, cv: HTMLCanvasElement) { if (this.textures.exists(key)) this.textures.remove(key); this.textures.addCanvas(key, cv); }

  // running-alien sheet (8 frames, dark bg) → crawler_0..7 (full frame each, nothing clipped)
  private bakeCrawler() {
    if (!this.textures.exists('alien_run')) return;
    const src = this.textures.get('alien_run').getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const x0 = 30, x1 = 1743, n = 8, y0 = 311, y1 = 574, cellW = (x1 - x0) / n, ch = y1 - y0 + 1, scale = 54 / ch;
    for (let i = 0; i < n; i++) {
      const sx = Math.round(x0 + i * cellW), w = Math.round(cellW);
      const cell = document.createElement('canvas'); cell.width = w; cell.height = ch;
      const ctx = cell.getContext('2d')!; ctx.drawImage(src as any, sx, y0, w, ch, 0, 0, w, ch);
      const id = ctx.getImageData(0, 0, w, ch); const d = id.data; const bi = (2 * w + 2) * 4;
      this.floodAlpha(d, w, ch, [d[bi], d[bi + 1], d[bi + 2]], 30);
      ctx.putImageData(id, 0, 0);
      this.addBaked('crawler_' + i, this.tightScale(cell, 24, scale));
    }
    this.alienReady = true;
  }

  // a soldier sheet (transparent bg) → tight full frames under the given prefixes (idle/walk/shoot rows)
  private bakeSoldierSheet(sheetKey: string, rows: { y0: number; y1: number; x0: number; x1: number; n: number; pre: string }[]): boolean {
    if (!this.textures.exists(sheetKey)) return false;
    const src = this.textures.get(sheetKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    const scale = 54 / (rows[1].y1 - rows[1].y0 + 1); // consistent size, keyed to the walk row height
    for (const r of rows) {
      const cellW = (r.x1 - r.x0) / r.n, ch = r.y1 - r.y0 + 1;
      for (let i = 0; i < r.n; i++) {
        const sx = Math.round(r.x0 + i * cellW), w = Math.round(cellW);
        const cell = document.createElement('canvas'); cell.width = w; cell.height = ch;
        const ctx = cell.getContext('2d')!; ctx.drawImage(src as any, sx, r.y0, w, ch, 0, 0, w, ch);
        const id = ctx.getImageData(0, 0, w, ch); const d = id.data;
        for (let p = 3; p < d.length; p += 4) if (d[p] < 55) d[p] = 0; // strip faint glow halo
        ctx.putImageData(id, 0, 0);
        this.addBaked(r.pre + i, this.tightScale(cell, 60, scale));
      }
    }
    return true;
  }
  private bakeSoldiers() {
    this.soldierReady = this.bakeSoldierSheet('soldier_sheet', [
      { y0: 131, y1: 343, x0: 337, x1: 1400, n: 6, pre: 'guard_' },
      { y0: 398, y1: 610, x0: 301, x1: 1348, n: 6, pre: 'guard_w_' },
      { y0: 675, y1: 887, x0: 319, x1: 1288, n: 5, pre: 'guard_s_' },
    ]);
    this.soldier2Ready = this.bakeSoldierSheet('soldier2_sheet', [ // x0 skips the faint left-side row labels
      { y0: 128, y1: 342, x0: 338, x1: 1392, n: 6, pre: 'grenadier_' },
      { y0: 396, y1: 612, x0: 299, x1: 1344, n: 6, pre: 'grenadier_w_' },
      { y0: 675, y1: 898, x0: 324, x1: 1205, n: 4, pre: 'grenadier_s_' },
    ]);
  }

  // slice the player sheet into named frames (idle0.., walk0.., run0.., jump0.., crouch0..)
  private defineColeSheet() {
    if (!this.textures.exists(COLE_SHEET)) return;
    this.keyOutBackground(COLE_SHEET);
    const tex = this.textures.get(COLE_SHEET);
    for (const [name, boxes] of Object.entries(COLE_FRAMES))
      boxes.forEach((b, i) => tex.add(`${name}${i}`, 0, b[0], b[1], b[2], b[3]));
    this.coleReady = true;

    if (this.textures.exists(COLE_SHEET2)) {
      this.keyOutBackground(COLE_SHEET2);
      const t2 = this.textures.get(COLE_SHEET2);
      for (const [name, boxes] of Object.entries(COLE2_FRAMES))
        boxes.forEach((b, i) => t2.add(`${name}${i}`, 0, b[0], b[1], b[2], b[3]));
      this.cole2Ready = true;
    }
    if (this.textures.exists(COLE_SHEET3)) {
      this.keyOutBackground(COLE_SHEET3);
      const t3 = this.textures.get(COLE_SHEET3);
      for (const [name, boxes] of Object.entries(COLE3_FRAMES))
        boxes.forEach((b, i) => t3.add(`${name}${i}`, 0, b[0], b[1], b[2], b[3]));
      this.cole3Ready = true;
    }
  }

  private makePot(key: string, size = 512) {
    if (!this.textures.exists(key)) return;
    const src = this.textures.get(key).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!src || !src.width) return;
    const potKey = key + '_pot';
    if (this.textures.exists(potKey)) this.textures.remove(potKey);
    const cv = this.textures.createCanvas(potKey, size, size);
    if (!cv) return;
    cv.context.drawImage(src as any, 0, 0, src.width, src.height, 0, 0, size, size);
    cv.refresh();
  }

  private makeAnims() {
    const a = this.anims;
    const frames = (keys: string[]) => keys.map(key => ({ key }));
    if (this.coleReady) {
      const sf = (name: string, n: number) => Array.from({ length: n }, (_, i) => ({ key: COLE_SHEET, frame: `${name}${i}` }));
      a.create({ key: 'cole_idle', frames: sf('idle', 6), frameRate: 6, repeat: -1 });
      a.create({ key: 'cole_walk', frames: sf('walk', 8), frameRate: 11, repeat: -1 });
      a.create({ key: 'cole_run',  frames: sf('run', 8),  frameRate: 16, repeat: -1 });
      a.create({ key: 'cole_jump', frames: sf('jump', 7), frameRate: 12, repeat: 0 });
      if (this.cole2Ready) {
        const hf = (i: number) => ({ key: COLE_SHEET2, frame: `hang${i}` });
        a.create({ key: 'cole_mantle', frames: [2, 3, 4, 5, 6, 7].map(hf), frameRate: 12, repeat: 0 });
      }
      if (this.cole3Ready) {
        const lf = Array.from({ length: 7 }, (_, i) => ({ key: COLE_SHEET3, frame: `ladder${i}` }));
        a.create({ key: 'cole_climbladder', frames: lf, frameRate: 8, repeat: -1 });
      }
    } else {
      a.create({ key: 'cole_walk', frames: frames(['cole_walk_0', 'cole_walk_1', 'cole_walk_2', 'cole_walk_3']), frameRate: 9, repeat: -1 });
      a.create({ key: 'cole_run', frames: frames(['cole_walk_0', 'cole_walk_1', 'cole_walk_2', 'cole_walk_3']), frameRate: 15, repeat: -1 });
      a.create({ key: 'cole_climb', frames: frames(['cole_climb_0', 'cole_climb_1']), frameRate: 6, repeat: -1 });
    }
    const gunners = ['warden', 'subject', 'queen', 'overmind', 'commander'];
    const soldierAnims = (pre: string, k: string, shootN: number) => {
      a.create({ key: k + '_idle', frames: frames([0, 1, 2, 3, 4, 5].map(i => pre + i)), frameRate: 6, repeat: -1 });
      a.create({ key: k + '_walk', frames: frames([0, 1, 2, 3, 4, 5].map(i => pre + 'w_' + i)), frameRate: 11, repeat: -1 });
      a.create({ key: k + '_shoot', frames: frames(Array.from({ length: shootN }, (_, i) => pre + 's_' + i)), frameRate: 12, repeat: -1 });
    };
    if (this.soldierReady) soldierAnims('guard_', 'guard', 5); else gunners.unshift('guard');
    if (this.soldier2Ready) soldierAnims('grenadier_', 'grenadier', 4); else gunners.unshift('grenadier');
    for (const kind of gunners)
      a.create({ key: kind + '_walk', frames: frames([kind + '_0', kind + '_1', kind + '_2', kind + '_3']), frameRate: 8, repeat: -1 });
    a.create({ key: 'crawler_walk', frames: frames(this.alienReady ? Array.from({ length: 8 }, (_, i) => 'crawler_' + i) : ['crawler_0', 'crawler_1']), frameRate: this.alienReady ? 14 : 10, repeat: -1 });
    a.create({ key: 'drone_idle', frames: frames(['drone_0', 'drone_1']), frameRate: 8, repeat: -1 });
  }
}
