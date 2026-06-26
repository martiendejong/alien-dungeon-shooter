import Phaser from 'phaser';

// Immediate-mode UI for Phaser.
//
// Every frame: startFrame() → describe UI declaratively → endFrame().
// Layout engine runs post-order (sizes) then pre-order (positions).
// Mouse hit-testing uses the PREVIOUS frame's layout (chicken-and-egg solution).
// Object pools prevent per-frame allocation; unused objects are hidden, not destroyed.

interface BoxOpts {
  gap?: number;
  padX?: number;
  padY?: number;
  bg?: number;
  bgAlpha?: number;
  x?: number;
  y?: number;
}

export interface TxtOpts {
  x?: number; y?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  bold?: boolean;
  shadow?: boolean;
  originX?: number;
  originY?: number;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
}

export interface ImgOpts {
  tint?: number;
  alpha?: number;
}

type NK = 'row' | 'col' | 'text' | 'image';

interface N {
  kind: NK;
  sw: number; sh: number;
  px: number; py: number;
  children: N[];
  gap: number;
  padX: number; padY: number;
  bg?: number; bgAlpha: number;
  absX?: number; absY?: number;
  tobj?: Phaser.GameObjects.Text;
  iobj?: Phaser.GameObjects.Image;
}

// Rendered rect saved after endFrame() for mouse hit-testing.
export interface RenderedRect { x: number; y: number; w: number; h: number; id?: string; }

const FONT = 'Consolas, monospace';

export class ImUI {
  private g: Phaser.GameObjects.Graphics;
  private sc: Phaser.Scene;
  private dp: number;

  private tpool: Phaser.GameObjects.Text[] = [];
  private ti = 0;
  private ipool: Phaser.GameObjects.Image[] = [];
  private ii = 0;

  private roots: N[] = [];
  private stk: N[] = [];

  // Previous frame's rendered layout — available for mouse testing during next frame's build.
  private prevLayout: RenderedRect[] = [];
  private curLayout: RenderedRect[] = [];

  constructor(scene: Phaser.Scene, depth = 100) {
    this.sc = scene;
    this.dp = depth;
    this.g = scene.add.graphics().setDepth(depth);
  }

  startFrame() {
    this.ti = 0;
    this.ii = 0;
    this.roots = [];
    this.stk = [];
    this.curLayout = [];
    this.g.clear();
  }

  row(opts: BoxOpts = {}) { this.pushBox('row', opts); }
  col(opts: BoxOpts = {}) { this.pushBox('col', opts); }

  end() {
    if (!this.stk.length) return;
    const n = this.stk.pop()!;
    if (!this.stk.length) this.roots.push(n);
  }

  text(content: string, opts: TxtOpts = {}) {
    const t = this.acqText(content, opts);
    const n: N = {
      kind: 'text',
      sw: t.width, sh: t.height,
      px: 0, py: 0,
      children: [], gap: 0, padX: 0, padY: 0, bgAlpha: 0,
      absX: opts.x, absY: opts.y,
      tobj: t,
    };
    this.addLeaf(n);
  }

  img(key: string, w: number, h: number, opts: ImgOpts = {}) {
    const im = this.acqImg(key, opts);
    im.setDisplaySize(w, h);
    const n: N = {
      kind: 'image',
      sw: w, sh: h,
      px: 0, py: 0,
      children: [], gap: 0, padX: 0, padY: 0, bgAlpha: 0,
      iobj: im,
    };
    this.addLeaf(n);
  }

  // Direct graphics draws — bypass the layout tree. Use for vignettes, overlays.
  fillRect(x: number, y: number, w: number, h: number, color: number, alpha: number) {
    this.g.fillStyle(color, alpha);
    this.g.fillRect(x, y, w, h);
  }

  progressBar(x: number, y: number, w: number, h: number, ratio: number, bg: number, fg: number) {
    this.g.fillStyle(0x10151f, 0.85);
    this.g.fillRect(x - 3, y - 3, w + 6, h + 6);
    this.g.fillStyle(bg, 1);
    this.g.fillRect(x, y, w, h);
    this.g.fillStyle(fg, 1);
    this.g.fillRect(x, y, w * Phaser.Math.Clamp(ratio, 0, 1), h);
  }

  endFrame() {
    for (const r of this.roots) {
      this.computeSizes(r);
      this.applyPositions(r, r.absX ?? 0, r.absY ?? 0);
    }
    for (let i = this.ti; i < this.tpool.length; i++) this.tpool[i].setVisible(false);
    for (let i = this.ii; i < this.ipool.length; i++) this.ipool[i].setVisible(false);
    this.prevLayout = this.curLayout;
  }

  // Returns whether the mouse (screen coords) was inside a registered rect from the PREVIOUS frame.
  hovered(mx: number, my: number, id: string): boolean {
    return this.prevLayout.some(r => r.id === id && mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h);
  }

  // Register a named rect in the current frame for next-frame mouse testing.
  hitZone(id: string, x: number, y: number, w: number, h: number) {
    this.curLayout.push({ id, x, y, w, h });
  }

  // ---- internals ----

  private pushBox(kind: 'row' | 'col', opts: BoxOpts) {
    const n: N = {
      kind,
      sw: 0, sh: 0,
      px: 0, py: 0,
      children: [],
      gap: opts.gap ?? 4,
      padX: opts.padX ?? 0,
      padY: opts.padY ?? 0,
      bg: opts.bg,
      bgAlpha: opts.bgAlpha ?? 1,
      absX: opts.x,
      absY: opts.y,
    };
    if (this.stk.length) this.stk[this.stk.length - 1].children.push(n);
    this.stk.push(n);
  }

  private addLeaf(n: N) {
    if (this.stk.length) this.stk[this.stk.length - 1].children.push(n);
    else this.roots.push(n);
  }

  private computeSizes(n: N) {
    if (n.kind === 'text' || n.kind === 'image') return;
    for (const c of n.children) this.computeSizes(c);
    const p2x = n.padX * 2, p2y = n.padY * 2;
    const gapTotal = n.children.length > 1 ? n.gap * (n.children.length - 1) : 0;
    if (n.kind === 'row') {
      n.sw = n.children.reduce((s, c) => s + c.sw, 0) + gapTotal + p2x;
      n.sh = (n.children.length ? Math.max(...n.children.map(c => c.sh)) : 0) + p2y;
    } else {
      n.sw = (n.children.length ? Math.max(...n.children.map(c => c.sw)) : 0) + p2x;
      n.sh = n.children.reduce((s, c) => s + c.sh, 0) + gapTotal + p2y;
    }
  }

  private applyPositions(n: N, x: number, y: number) {
    n.px = x; n.py = y;
    if (n.kind === 'text') {
      n.tobj!.setPosition(x, y).setVisible(true);
      return;
    }
    if (n.kind === 'image') {
      n.iobj!.setPosition(x, y).setVisible(true);
      return;
    }
    if (n.bg !== undefined) {
      this.g.fillStyle(n.bg, n.bgAlpha);
      this.g.fillRect(x, y, n.sw, n.sh);
    }
    let cur = n.kind === 'row' ? x + n.padX : y + n.padY;
    for (const c of n.children) {
      if (n.kind === 'row') {
        const cy = y + n.padY + (n.sh - n.padY * 2 - c.sh) / 2; // center child on the off-axis
        this.applyPositions(c, cur, cy);
        cur += c.sw + n.gap;
      } else {
        this.applyPositions(c, x + n.padX, cur);
        cur += c.sh + n.gap;
      }
    }
  }

  private acqText(content: string, opts: TxtOpts): Phaser.GameObjects.Text {
    let t: Phaser.GameObjects.Text;
    if (this.ti < this.tpool.length) {
      t = this.tpool[this.ti];
    } else {
      t = this.sc.add.text(0, 0, '', {}).setDepth(this.dp + 1);
      this.tpool.push(t);
    }
    this.ti++;
    t.setStyle({
      fontFamily: opts.fontFamily ?? FONT,
      fontSize: `${opts.fontSize ?? 14}px`,
      color: opts.color ?? '#ffffff',
      fontStyle: opts.bold ? 'bold' : 'normal',
    });
    t.setText(content);
    if (opts.shadow) t.setShadow(0, 2, '#000000', 6, false, true);
    else t.setShadow(0, 0, '#000000', 0, false, false);
    t.setOrigin(opts.originX ?? 0, opts.originY ?? 0);
    t.setScale(opts.scaleX ?? 1, opts.scaleY ?? 1);
    t.setAlpha(opts.alpha ?? 1);
    return t;
  }

  private acqImg(key: string, opts: ImgOpts): Phaser.GameObjects.Image {
    let im: Phaser.GameObjects.Image;
    if (this.ii < this.ipool.length) {
      im = this.ipool[this.ii];
    } else {
      im = this.sc.add.image(0, 0, '').setDepth(this.dp + 1).setOrigin(0, 0);
      this.ipool.push(im);
    }
    this.ii++;
    im.setTexture(key);
    if (opts.tint !== undefined) im.setTint(opts.tint);
    else im.clearTint();
    im.setAlpha(opts.alpha ?? 1);
    return im;
  }
}
