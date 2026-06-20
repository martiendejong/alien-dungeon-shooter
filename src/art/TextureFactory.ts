import Phaser from 'phaser';

/**
 * Procedural placeholder art (Pass A). Characters are SIDE-PROFILE and ANIMATED:
 * a bright visor + nose bump on the front make facing direction unmistakable, and
 * walk/run cycles animate the legs. All drawn facing RIGHT; the game flipX's for left.
 * Pass B swaps these for hand/AI art via the loader — no gameplay code changes.
 */
export class TextureFactory {
  static generateAll(scene: Phaser.Scene) {
    this.radialLight(scene);
    this.softCircle(scene, 'particle', 8, 0xffffff);
    this.softCircle(scene, 'spark', 6, 0xffe08a);

    this.gun(scene);
    this.playerFrames(scene);
    this.enemyFrames(scene, 'guard', 0x55606f, 0x2c333d, 0xff4d4d, true);
    this.enemyFrames(scene, 'grenadier', 0x6b5230, 0x3a2c18, 0xe8a13a, false);
    this.enemyFrames(scene, 'warden', 0x2c2f3a, 0x14161c, 0xff2a2a, true, 1.7);
    this.crawlerFrames(scene);
    this.subjectFrames(scene, 'subject', 0x35563b, 0x1d3024, 0x55794f, 0xfff04a);
    this.subjectFrames(scene, 'queen', 0x4a2b6b, 0x281540, 0x6b4a8a, 0xff5ad0);
    this.subjectFrames(scene, 'overmind', 0x6b1a1a, 0x3a0d0d, 0x8a3a3a, 0xffd23a);
    this.enemyFrames(scene, 'commander', 0x3a4a5a, 0x18202c, 0x9fe8ff, true, 1.5);
    this.searchBeam(scene);
    this.flameTex(scene);
    this.droneFrames(scene);

    this.bullet(scene, 'bullet_player', 0x9fe8ff, 0x36e0d4);
    this.bullet(scene, 'bullet_enemy', 0xffb38a, 0xff5a3a);
    this.tracer(scene);
    this.grenadeTex(scene);

    for (let i = 0; i < 4; i++) this.rockTile(scene, 'tile_rock_' + i, i);
    for (let i = 0; i < 3; i++) this.floorTile(scene, 'tile_solid_' + i, i);
    this.tile(scene, 'tile_hide', 0x161b25, 0x0d111a, 0x20283a);
    this.brickTile(scene);
    this.windowProp(scene);
    this.wallProps(scene);
    this.spikes(scene);
    this.decals(scene);
    this.ladder(scene);
    this.bgTile(scene);

    this.heart(scene, 'heart_full', 'full');
    this.heart(scene, 'heart_half', 'half');
    this.heart(scene, 'heart_empty', 'empty');
    this.reticle(scene);
    this.pickup(scene, 'medkit', 0xc0392b);
    this.pickup(scene, 'ammo', 0xe8a13a);
    this.exitDoor(scene);
    this.portal(scene);
  }

  // ---- lighting / particles -------------------------------------------------
  private static radialLight(scene: Phaser.Scene) {
    const size = 256;
    const tex = scene.textures.createCanvas('light', size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size); tex.refresh();
  }
  private static softCircle(scene: Phaser.Scene, key: string, r: number, color: number) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(color, 1).fillCircle(r, r, r);
    g.generateTexture(key, r * 2, r * 2); g.destroy();
  }

  // ---- characters (side-profile, animated) ----------------------------------
  private static leg(g: Phaser.GameObjects.Graphics, x: number, hipY: number, kneeY: number, footY: number, off: number, lw: number, color: number) {
    g.fillStyle(color, 1);
    g.fillRect(x - lw / 2, hipY, lw, kneeY - hipY);                 // thigh
    g.fillRect(x - lw / 2 + off * 0.6, kneeY, lw, footY - kneeY);   // shin (shifted = stride)
    g.fillRect(x - lw / 2 - 1 + off, footY - 3, lw + 3, 3);         // foot
  }

  /** one biped frame, facing right */
  private static biped(scene: Phaser.Scene, key: string, w: number, h: number, body: number, dark: number, accent: number, pose: string, lp: number, weapon: boolean) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const cx = w / 2, ground = h - 2;
    const hipY = h * 0.56, footY = ground, kneeY = (hipY + footY) / 2;
    const lw = Math.max(3, w * 0.13);
    const headR = h * 0.15, headY = h * 0.20;
    const lean = pose === 'run' ? w * 0.10 : pose === 'walk' ? w * 0.04 : pose === 'jump' ? w * 0.10 : 0;

    let front = 0, back = 0;
    if (pose === 'walk' || pose === 'run') { const seq = [0, w * 0.18, 0, -w * 0.18]; front = seq[lp % 4]; back = -front; if (pose === 'run') { front *= 1.3; back *= 1.3; } }
    else if (pose === 'jump') { front = w * 0.14; back = -w * 0.10; }
    else if (pose === 'fall') { front = w * 0.20; back = -w * 0.20; }
    else if (pose === 'climb') { front = lp ? h * 0.06 : -h * 0.06; back = -front; }

    if (pose === 'climb') { // legs vertical, alternating up/down
      this.leg(g, cx - lw, hipY + front, kneeY + front, footY, 0, lw, dark);
      this.leg(g, cx + lw, hipY + back, kneeY + back, footY, 0, lw, dark);
    } else {
      this.leg(g, cx - lw * 0.6, hipY, kneeY, footY, back, lw, dark);    // back leg
    }
    // torso
    g.fillStyle(body, 1).fillRoundedRect(cx - w * 0.28 + lean, h * 0.26, w * 0.56, h * 0.34, 4);
    // back arm
    g.fillStyle(dark, 1).fillRect(cx - w * 0.32 + lean, h * 0.30, lw, h * 0.22);
    if (pose !== 'climb') this.leg(g, cx + lw * 0.4, hipY, kneeY, footY, front, lw, dark); // front leg
    // head
    const hx = cx + lean + w * 0.04, hy = headY;
    g.fillStyle(dark, 1).fillCircle(hx, hy, headR);
    // FACE — visor + nose pointing right (front)
    g.fillStyle(accent, 1).fillRect(hx, hy - headR * 0.4, headR * 0.95, headR * 0.5);
    g.fillStyle(dark, 1).fillTriangle(hx + headR, hy - headR * 0.2, hx + headR * 1.7, hy + headR * 0.2, hx + headR, hy + headR * 0.6);
    // front arm (+ weapon stub showing facing)
    const armY = h * 0.34;
    if (pose === 'climb') { g.fillStyle(body, 1).fillRect(hx - lw / 2, hy - headR, lw, h * 0.20); } // reaching up
    else {
      g.fillStyle(body, 1).fillRect(cx + w * 0.10 + lean, armY, w * 0.34, lw);
      if (weapon) g.fillStyle(0x20262f, 1).fillRect(cx + w * 0.40 + lean, armY - 1, w * 0.34, lw + 1);
    }
    g.generateTexture(key, w, h); g.destroy();
  }

  private static playerFrames(scene: Phaser.Scene) {
    const w = 28, h = 48, body = 0x3d6b5a, dark = 0x1f3a31, accent = 0x6fe3c0;
    this.biped(scene, 'cole_idle', w, h, body, dark, accent, 'idle', 0, false);
    for (let i = 0; i < 4; i++) this.biped(scene, 'cole_walk_' + i, w, h, body, dark, accent, 'walk', i, false);
    this.biped(scene, 'cole_jump', w, h, body, dark, accent, 'jump', 0, false);
    this.biped(scene, 'cole_fall', w, h, body, dark, accent, 'fall', 0, false);
    this.biped(scene, 'cole_climb_0', w, h, body, dark, accent, 'climb', 0, false);
    this.biped(scene, 'cole_climb_1', w, h, body, dark, accent, 'climb', 1, false);
  }

  private static enemyFrames(scene: Phaser.Scene, kind: string, body: number, dark: number, accent: number, weapon: boolean, scale = 1) {
    const w = Math.round(28 * scale), h = Math.round(48 * scale);
    this.biped(scene, kind + '_0', w, h, body, dark, accent, 'idle', 0, weapon);
    for (let i = 0; i < 4; i++) this.biped(scene, kind + '_' + i, w, h, body, dark, accent, 'walk', i, weapon);
  }

  private static crawlerFrames(scene: Phaser.Scene) {
    for (let f = 0; f < 2; f++) {
      const w = 44, h = 28;
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x3a2150, 1).fillRoundedRect(8, 8, 28, 12, 6);
      g.fillStyle(0x2a1740, 1);
      for (let i = 0; i < 4; i++) { const up = ((i + f) % 2) ? 0 : 3; g.fillRect(10 + i * 7, 20, 2, 6 - up); g.fillRect(10 + i * 7, 26 - up, 4, 2); }
      g.fillStyle(0x2a1740, 1).fillTriangle(36, 9, 43, 13, 36, 17); // mandible (front, right)
      g.fillStyle(0x7a5cff, 1).fillCircle(33, 12, 3).fillCircle(29, 13, 2); // eyes (front)
      g.generateTexture('crawler_' + f, w, h); g.destroy();
    }
  }

  // a hunched alien, drawn facing right — palette-driven so bosses (subject/queen/overmind) differ.
  private static subjectFrames(scene: Phaser.Scene, key: string, body: number, dark: number, skin: number, eye: number) {
    const w = 46, h = 64;
    const claw = 0xd8e0c8, mouth = 0x6a1020;
    for (let f = 0; f < 4; f++) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      const sway = (f % 2) ? 3 : -3;
      // legs (digitigrade) + feet
      g.fillStyle(dark, 1);
      g.fillRoundedRect(16 + sway, 42, 7, 18, 3); g.fillRect(13 + sway, 58, 12, 4);
      g.fillRoundedRect(26 - sway, 42, 7, 18, 3); g.fillRect(23 - sway, 58, 12, 4);
      // tail
      g.fillStyle(dark, 1).fillTriangle(13, 40, 3, 53, 15, 47);
      // hunched torso
      g.fillStyle(body, 1).fillRoundedRect(14, 22, 22, 24, 7);
      g.fillStyle(skin, 1).fillRoundedRect(18, 29, 12, 12, 4);   // belly
      g.fillStyle(dark, 1).fillRoundedRect(14, 22, 22, 7, 4);    // back ridge
      for (let i = 0; i < 3; i++) g.fillTriangle(16 + i * 7, 22, 21 + i * 7, 22, 18 + i * 7, 15); // spines
      // forward arm + claws
      g.fillStyle(body, 1).fillRoundedRect(30, 26, 9, 14, 3);
      g.fillStyle(claw, 1).fillTriangle(37, 38, 44, 36, 41, 45).fillTriangle(34, 41, 41, 41, 41, 47);
      // elongated head + snout
      g.fillStyle(body, 1).fillCircle(38, 19, 9);
      g.fillStyle(body, 1).fillTriangle(45, 14, 53, 21, 45, 25);
      g.fillStyle(mouth, 1).fillTriangle(46, 20, 53, 21, 46, 24);
      g.fillStyle(eye, 1).fillCircle(40, 16, 2.6);
      g.fillStyle(0xffffff, 0.6).fillCircle(40, 15, 1.1);
      g.generateTexture(key + '_' + f, w, h); g.destroy();
    }
  }

  // a downward searchlight cone (origin top-centre), bright at the lamp, fading down
  private static searchBeam(scene: Phaser.Scene) {
    const w = 150, h = 360;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffe88a, 0.16).fillTriangle(w / 2, 0, 0, h, w, h);
    g.fillStyle(0xfff6c0, 0.22).fillTriangle(w / 2, 0, w / 2 - 22, h, w / 2 + 22, h);
    g.fillStyle(0xffffff, 0.9).fillCircle(w / 2, 6, 6);
    g.generateTexture('searchbeam', w, h); g.destroy();
  }

  // a vertical flame jet (origin bottom-centre), rising ~2.5 tiles
  private static flameTex(scene: Phaser.Scene) {
    const w = 30, h = 84;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xff3a14, 0.85).fillTriangle(w / 2, 0, 2, h, w - 2, h);
    g.fillStyle(0xff8a2a, 0.9).fillTriangle(w / 2, 12, 7, h, w - 7, h);
    g.fillStyle(0xffe24a, 1).fillTriangle(w / 2, 30, 11, h, w - 11, h);
    g.generateTexture('flame', w, h); g.destroy();
  }

  // a hovering combat drone (faces right), 2 frames for a light flicker
  private static droneFrames(scene: Phaser.Scene) {
    const w = 40, h = 30;
    for (let f = 0; f < 2; f++) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      g.fillStyle(0x3a4250, 1).fillRoundedRect(8, 8, 22, 12, 5);     // hull
      g.fillStyle(0x2a313c, 1).fillRoundedRect(8, 8, 22, 5, 3);      // top shade
      g.fillStyle(0x12161c, 1).fillRect(6, 6, 28, 2);                // rotor bar
      g.fillStyle(f ? 0x9fe8ff : 0x36e0d4, 1).fillCircle(26, 14, 3); // sensor eye (flickers)
      g.fillStyle(0x20262f, 1).fillRect(28, 17, 9, 3);               // barrel (right)
      g.fillStyle(0x2a313c, 1).fillTriangle(10, 20, 18, 20, 14, 26); // underslung pod
      g.generateTexture('drone_' + f, w, h); g.destroy();
    }
  }

  private static gun(scene: Phaser.Scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x20262f, 1).fillRect(0, 4, 22, 6);
    g.fillStyle(0x4a5366, 1).fillRect(0, 3, 5, 8);
    g.generateTexture('gun', 22, 14); g.destroy();
  }

  // ---- projectiles ----------------------------------------------------------
  private static bullet(scene: Phaser.Scene, key: string, core: number, glow: number) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(glow, 0.5).fillCircle(7, 4, 4);
    g.fillStyle(core, 1).fillCircle(7, 4, 2.4).fillRect(0, 3, 8, 2);
    g.generateTexture(key, 14, 8); g.destroy();
  }
  private static tracer(scene: Phaser.Scene) {
    const w = 30, h = 8;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffc23a, 0.35).fillRoundedRect(0, 1, w, h - 2, 3);
    g.fillStyle(0xffe87a, 0.9).fillRoundedRect(3, 2, w - 6, h - 4, 2);
    g.fillStyle(0xfffbe0, 1).fillRect(w - 9, 3, 7, 2);
    g.generateTexture('tracer', w, h); g.destroy();
  }
  private static grenadeTex(scene: Phaser.Scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x2c3a24, 1).fillCircle(7, 7, 6);
    g.fillStyle(0xe8a13a, 1).fillRect(5, 0, 4, 3);
    g.generateTexture('grenade', 14, 14); g.destroy();
  }

  // ---- tiles ----------------------------------------------------------------
  private static tile(scene: Phaser.Scene, key: string, fill: number, edge: number, top: number) {
    const s = 32;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(fill, 1).fillRect(0, 0, s, s);
    g.fillStyle(top, 1).fillRect(0, 0, s, 4);
    g.lineStyle(1, edge, 0.6).strokeRect(0.5, 0.5, s - 1, s - 1);
    g.fillStyle(edge, 0.5).fillRect(4, 8, 6, 6).fillRect(20, 18, 8, 4);
    g.generateTexture(key, s, s); g.destroy();
  }
  // pseudo-random but deterministic generator seeded per variant
  private static prng(seed: number) { let x = seed * 1664525 + 1013904223; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; }

  private static rockTile(scene: Phaser.Scene, key: string, v: number) {
    const s = 32, g = scene.make.graphics({ x: 0, y: 0 }, false);
    const bases = [0x232a38, 0x262d3c, 0x1e2532, 0x29303f];
    g.fillStyle(bases[v % 4], 1).fillRect(0, 0, s, s);
    g.lineStyle(1, 0x141925, 0.55).strokeRect(0.5, 0.5, s - 1, s - 1);
    const rnd = this.prng(v + 7);
    g.fillStyle(0x161b27, 0.5);
    for (let i = 0; i < 6; i++) g.fillRect(Math.floor(rnd() * 27) + 2, Math.floor(rnd() * 27) + 2, Math.floor(rnd() * 5) + 3, Math.floor(rnd() * 5) + 3);
    g.fillStyle(0x2c3447, 0.45).fillRect(3 + (v % 3) * 6, 4, 4, 3);
    g.generateTexture(key, s, s); g.destroy();
  }

  private static floorTile(scene: Phaser.Scene, key: string, v: number) {
    const s = 32, g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x3a4150, 1).fillRect(0, 0, s, s);
    g.fillStyle(0x4a5366, 1).fillRect(0, 0, s, 4);
    g.fillStyle(0x55607a, 0.6).fillRect(0, 0, s, 1);
    g.lineStyle(1, 0x222834, 0.6).strokeRect(0.5, 0.5, s - 1, s - 1);
    g.fillStyle(0x222834, 0.5);
    if (v === 0) { g.fillRect(6, 12, 6, 4).fillRect(20, 20, 8, 3); }
    else if (v === 1) { g.fillRect(10, 12, 12, 3); g.fillStyle(0x2c3447, 0.5).fillRect(4, 22, 22, 2); }
    else { g.fillRect(14, 16, 6, 6); g.fillStyle(0x55607a, 0.4).fillRect(6, 10, 4, 4); }
    g.generateTexture(key, s, s); g.destroy();
  }

  private static brickTile(scene: Phaser.Scene) {
    const s = 32, g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x251d27, 1).fillRect(0, 0, s, s); // mortar
    const bw = 14, bh = 6, m = 2; let row = 0;
    for (let y = 0; y < s; y += bh + m) {
      const off = (row % 2) ? -(bw / 2) : 0;
      for (let x = -bw; x < s; x += bw + m) { g.fillStyle(row % 2 ? 0x453643 : 0x40313e, 1).fillRect(x + off, y, bw, bh); }
      row++;
    }
    g.fillStyle(0x000000, 0.18).fillRect(0, 0, s, s);
    g.generateTexture('tile_brick', s, s); g.destroy();
  }

  private static wallProps(scene: Phaser.Scene) {
    let g: Phaser.GameObjects.Graphics;
    // caged wall lamp (warm glow)
    g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffcf6a, 0.30).fillCircle(11, 17, 12);                 // glow halo
    g.fillStyle(0x14161c, 1).fillRect(9, 0, 4, 5);                      // bracket
    g.fillStyle(0x2c333d, 1).fillRoundedRect(3, 5, 16, 22, 3);         // housing
    g.fillStyle(0xffcf6a, 1).fillCircle(11, 17, 6);                     // bulb
    g.fillStyle(0xfff2c0, 1).fillCircle(11, 16, 3);
    g.lineStyle(1, 0x14161c, 1).lineBetween(3, 12, 19, 12).lineBetween(11, 5, 11, 27);
    g.generateTexture('prop_lamp', 22, 30); g.destroy();
    // pipes + valve
    g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x3a4252, 1).fillRect(3, 0, 6, 44).fillRect(17, 0, 6, 44);
    g.fillStyle(0x4a5366, 1).fillRect(3, 0, 2, 44).fillRect(17, 0, 2, 44);
    g.fillStyle(0x20262f, 1).fillCircle(13, 22, 6);
    g.lineStyle(2, 0x4a5366, 1).strokeCircle(13, 22, 6).lineBetween(7, 22, 19, 22).lineBetween(13, 16, 13, 28);
    g.generateTexture('prop_pipes', 26, 44); g.destroy();
    // chains + shackle
    g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x2c333d, 1).fillCircle(9, 3, 3);
    g.lineStyle(2, 0x3a4252, 1);
    for (let y = 6; y < 30; y += 5) g.strokeCircle(9, y, 2);
    g.fillStyle(0x4a5366, 1).fillRoundedRect(4, 30, 10, 6, 3);
    g.generateTexture('prop_chains', 18, 38); g.destroy();
    // grate / vent
    g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x10141d, 1).fillRect(0, 0, 30, 30);
    g.fillStyle(0x2c333d, 1).fillRect(2, 2, 26, 26);
    g.lineStyle(2, 0x10141d, 1);
    for (let y = 5; y < 28; y += 5) g.lineBetween(3, y, 27, y);
    g.lineStyle(1, 0x4a5366, 0.5).strokeRect(2, 2, 26, 26);
    g.generateTexture('prop_grate', 30, 30); g.destroy();
    // hazard sign
    g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xe8a13a, 1).fillTriangle(13, 2, 2, 24, 24, 24);
    g.fillStyle(0x14161c, 1).fillTriangle(13, 7, 6, 22, 20, 22);
    g.fillStyle(0xe8a13a, 1).fillRect(12, 11, 2, 6).fillRect(12, 19, 2, 2);
    g.generateTexture('prop_sign', 26, 26); g.destroy();
  }

  private static spikes(scene: Phaser.Scene) {
    const s = 32, g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x14161c, 1).fillRect(0, s * 0.6, s, s * 0.4); // dark base
    g.fillStyle(0xb9c2cf, 1);                                   // steel spikes
    for (let i = 0; i < 4; i++) { const x = i * 8; g.fillTriangle(x, s, x + 4, s * 0.18, x + 8, s); }
    g.fillStyle(0xeef3f8, 0.7);
    for (let i = 0; i < 4; i++) { const x = i * 8; g.fillTriangle(x + 3, s, x + 4, s * 0.3, x + 5, s); }
    g.generateTexture('spikes', s, s); g.destroy();
  }

  private static windowProp(scene: Phaser.Scene) {
    const w = 40, h = 56, g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x14110f, 1).fillRect(0, 0, w, h);                 // frame
    g.fillStyle(0x2a3550, 1).fillRect(4, 4, w - 8, h - 8);        // night glass
    g.fillStyle(0x3a4a70, 0.8).fillRect(4, 4, w - 8, (h - 8) / 2); // upper glow
    g.fillStyle(0x9fb8e0, 0.18).fillRect(6, 6, w - 12, 12);
    g.fillStyle(0x0d0b0a, 1).fillRect(w / 2 - 1, 4, 2, h - 8).fillRect(4, h / 2 - 1, w - 8, 2); // bars
    g.generateTexture('prop_window', w, h); g.destroy();
  }

  private static decals(scene: Phaser.Scene) {
    const D = (key: string, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      const g = scene.make.graphics({ x: 0, y: 0 }, false); draw(g); g.generateTexture(key, 32, 32); g.destroy();
    };
    D('decal_crack', g => { g.lineStyle(1, 0x10141d, 0.85); g.beginPath(); g.moveTo(7, 2); g.lineTo(13, 13); g.lineTo(9, 21); g.lineTo(17, 30); g.strokePath(); g.lineBetween(13, 13, 22, 11); });
    D('decal_stain', g => { g.fillStyle(0x3a2418, 0.5).fillCircle(12, 14, 7).fillCircle(20, 18, 5); g.fillStyle(0x5a2018, 0.4).fillCircle(15, 16, 4); });
    D('decal_vent', g => { g.lineStyle(2, 0x10141d, 0.7).strokeRect(4, 6, 24, 20); for (let y = 9; y < 26; y += 4) g.lineBetween(5, y, 27, y); });
    D('decal_pipe', g => { g.fillStyle(0x3a4252, 0.9).fillRect(0, 10, 32, 8); g.fillStyle(0x4a5366, 0.9).fillRect(0, 10, 32, 2); g.fillStyle(0x20262f, 1).fillRect(12, 8, 4, 12); });
    D('decal_panel', g => { g.fillStyle(0x20262f, 0.9).fillRoundedRect(4, 6, 24, 20, 2); g.fillStyle(0x141925, 1).fillRect(7, 9, 18, 9); g.fillStyle(0x6fe3c0, 0.9).fillRect(9, 21, 3, 2); g.fillStyle(0xe8a13a, 0.9).fillRect(15, 21, 3, 2); });
    D('decal_moss', g => { g.fillStyle(0x2f4a30, 0.5).fillCircle(10, 20, 6).fillCircle(19, 24, 5); g.fillStyle(0x3f6a40, 0.4).fillCircle(14, 22, 4); });
    D('decal_cable', g => { g.lineStyle(2, 0x14161c, 0.8); g.beginPath(); g.moveTo(10, 0); g.lineTo(12, 13); g.lineTo(9, 23); g.strokePath(); g.lineStyle(2, 0x2c1f14, 0.7); g.beginPath(); g.moveTo(21, 0); g.lineTo(18, 17); g.strokePath(); });
    D('decal_bolts', g => { g.fillStyle(0x4a5366, 0.9); for (const x of [5, 27]) for (const y of [5, 27]) g.fillCircle(x, y, 1.6); g.fillStyle(0x2c3447, 0.5).fillRect(5, 16, 22, 1); });
  }

  private static ladder(scene: Phaser.Scene) {
    const s = 32;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x5a4a2a, 0.95).fillRect(6, 0, 4, s).fillRect(22, 0, 4, s);
    for (let y = 4; y < s; y += 9) g.fillRect(6, y, 20, 3);
    g.generateTexture('tile_ladder', s, s); g.destroy();
  }
  private static bgTile(scene: Phaser.Scene) {
    const s = 64;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x141a26, 1).fillRect(0, 0, s, s);
    g.lineStyle(1, 0x1c2433, 0.8).strokeRect(0, 0, s, s);
    g.fillStyle(0x10151f, 1).fillRect(8, 8, 18, 26).fillRect(34, 30, 22, 18);
    g.fillStyle(0x232c3d, 0.6).fillRect(40, 8, 4, 14);
    g.generateTexture('tile_bg', s, s); g.destroy();
  }

  // ---- ui / props -----------------------------------------------------------
  private static heart(scene: Phaser.Scene, key: string, mode: 'full' | 'half' | 'empty') {
    const w = 26, h = 24;
    const tex = scene.textures.createCanvas(key, w, h);
    if (!tex) return;
    const ctx = tex.getContext();
    ctx.clearRect(0, 0, w, h);
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.88);
      ctx.bezierCurveTo(-w * 0.10, h * 0.42, w * 0.20, h * 0.04, w / 2, h * 0.30);
      ctx.bezierCurveTo(w * 0.80, h * 0.04, w * 1.10, h * 0.42, w / 2, h * 0.88);
      ctx.closePath();
    };
    const red = () => { ctx.fillStyle = '#e23b3b'; ctx.fill(); };
    const drk = () => { ctx.fillStyle = 'rgba(38,44,56,0.55)'; ctx.fill(); };
    if (mode === 'full') { path(); red(); }
    else if (mode === 'empty') { path(); drk(); }
    else {
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w / 2, h); ctx.clip(); path(); red(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(w / 2, 0, w / 2, h); ctx.clip(); path(); drk(); ctx.restore();
    }
    path(); ctx.lineWidth = 2; ctx.strokeStyle = mode === 'empty' ? '#6a4350' : '#ff8a8a'; ctx.stroke();
    tex.refresh();
  }
  private static reticle(scene: Phaser.Scene) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.lineStyle(2, 0x6fe3c0, 0.95).strokeCircle(12, 12, 8);
    g.lineBetween(12, 0, 12, 5).lineBetween(12, 19, 12, 24).lineBetween(0, 12, 5, 12).lineBetween(19, 12, 24, 12);
    g.generateTexture('reticle', 24, 24); g.destroy();
  }
  private static pickup(scene: Phaser.Scene, key: string, color: number) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x0d111a, 1).fillRoundedRect(0, 0, 20, 20, 4);
    g.fillStyle(color, 1).fillRect(8, 4, 4, 12).fillRect(4, 8, 12, 4);
    g.generateTexture(key, 20, 20); g.destroy();
  }
  private static exitDoor(scene: Phaser.Scene) {
    const w = 40, h = 72;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x14161c, 1).fillRect(0, 0, w, h);
    g.fillStyle(0x2c333d, 1).fillRect(4, 4, w - 8, h - 4);
    g.fillStyle(0x6fe3c0, 0.85).fillRect(w / 2 - 2, 12, 4, h - 20);
    g.generateTexture('exit', w, h); g.destroy();
  }
  private static portal(scene: Phaser.Scene) {
    const s = 80;
    const tex = scene.textures.createCanvas('portal', s, s);
    if (!tex) return;
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s / 2);
    grad.addColorStop(0, 'rgba(180,160,255,1)');
    grad.addColorStop(0.5, 'rgba(122,92,255,0.7)');
    grad.addColorStop(1, 'rgba(54,224,212,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(s / 2, s / 2, s / 2.6, s / 2, 0, 0, Math.PI * 2); ctx.fill();
    tex.refresh();
  }
}
