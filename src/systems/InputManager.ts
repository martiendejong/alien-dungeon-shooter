import Phaser from 'phaser';

/** Translates raw keyboard/mouse into intent flags. */
export class InputManager {
  private scene: Phaser.Scene;
  private k: Record<string, Phaser.Input.Keyboard.Key> = {};
  wheelDelta = 0;
  weaponSlot = 0;

  // edge-triggered (true only on the frame pressed)
  jumpPressed = false;   // Space → forward jump
  upPressed = false;     // Up / W → vertical jump / climb
  downPressed = false;   // Down / S → grab a ledge to hang; press again to drop
  dashPressed = false;   // double-tap left/right → dash
  dashDir: 1 | -1 = 1;
  private lastLeftTap = -9999; private lastRightTap = -9999;
  private comboState: Record<string, { taps: number; expire: number }> = {}; // 3×-tap debug combos (L/K/J)
  interactPressed = false;
  grenadePressed = false;
  reloadPressed = false;
  meleePressed = false;
  firePressed = false;
  pausePressed = false;
  skipLevelPressed = false; // debug: tap L 3× within 3s to jump to the next level
  skipLevelTapped = false;  // true the frame an L tap registers (for HUD feedback)
  skipLevelTaps = 0;        // current tap count in the active window
  giveAllPressed = false; giveAllTapped = false; giveAllTaps = 0;       // debug: tap K 3× → all weapons
  giveHeartPressed = false; giveHeartTapped = false; giveHeartTaps = 0; // debug: tap J 3× → +1 permanent max heart

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const KC = Phaser.Input.Keyboard.KeyCodes;
    const kb = scene.input.keyboard!;
    this.k = {
      left: kb.addKey(KC.LEFT), right: kb.addKey(KC.RIGHT),
      up: kb.addKey(KC.UP), down: kb.addKey(KC.DOWN),
      a: kb.addKey(KC.A), d: kb.addKey(KC.D), w: kb.addKey(KC.W), s: kb.addKey(KC.S), // WASD = arrows
      space: kb.addKey(KC.SPACE), shift: kb.addKey(KC.SHIFT),
      cover: kb.addKey(KC.C), interact: kb.addKey(KC.E),
      grenade: kb.addKey(KC.G), reload: kb.addKey(KC.R), melee: kb.addKey(KC.F),
      one: kb.addKey(KC.ONE), two: kb.addKey(KC.TWO), three: kb.addKey(KC.THREE),
      four: kb.addKey(KC.FOUR), five: kb.addKey(KC.FIVE), six: kb.addKey(KC.SIX), seven: kb.addKey(KC.SEVEN),
      eight: kb.addKey(KC.EIGHT), nine: kb.addKey(KC.NINE),
      esc: kb.addKey(KC.ESC), l: kb.addKey(KC.L), kkey: kb.addKey(KC.K), jkey: kb.addKey(KC.J),
    };
    scene.input.on('wheel', (_p: any, _o: any, _dx: number, dy: number) => { this.wheelDelta += dy; });
  }

  update(_time: number) {
    const JD = Phaser.Input.Keyboard.JustDown;
    this.jumpPressed = JD(this.k.space);
    const upJD = JD(this.k.up) || JD(this.k.w);
    const hasDir = this.k.left.isDown || this.k.a.isDown || this.k.right.isDown || this.k.d.isDown;
    if (upJD && hasDir) this.jumpPressed = true; // Up + direction = forward jump
    else this.upPressed = upJD;                  // Up alone = vertical hop / ledge grab
    this.downPressed = JD(this.k.down) || JD(this.k.s);
    this.interactPressed = JD(this.k.interact);
    this.grenadePressed = JD(this.k.grenade);
    this.reloadPressed = JD(this.k.reload);
    this.pausePressed = JD(this.k.esc);
    // Debug 3×-tap combos (within 3s): L = skip level, K = all weapons, J = +1 permanent heart
    const skip = this.combo3('l', _time);   this.skipLevelTapped = skip.tapped;  this.skipLevelTaps = skip.count;  this.skipLevelPressed = skip.fired;
    const all  = this.combo3('kkey', _time); this.giveAllTapped = all.tapped;     this.giveAllTaps = all.count;     this.giveAllPressed = all.fired;
    const heart= this.combo3('jkey', _time); this.giveHeartTapped = heart.tapped; this.giveHeartTaps = heart.count; this.giveHeartPressed = heart.fired;

    const p = this.scene.input.activePointer;
    this.firePressed = p.leftButtonDown();
    this.meleePressed = p.rightButtonDown() || JD(this.k.melee);

    this.weaponSlot = JD(this.k.one) ? 1 : JD(this.k.two) ? 2 : JD(this.k.three) ? 3
      : JD(this.k.four) ? 4 : JD(this.k.five) ? 5 : JD(this.k.six) ? 6 : JD(this.k.seven) ? 7
      : JD(this.k.eight) ? 8 : JD(this.k.nine) ? 9 : 0;

    // double-tap left/right → dash
    this.dashPressed = false;
    const TAP = 260;
    if (JD(this.k.left) || JD(this.k.a)) { if (_time - this.lastLeftTap < TAP) { this.dashPressed = true; this.dashDir = -1; } this.lastLeftTap = _time; }
    if (JD(this.k.right) || JD(this.k.d)) { if (_time - this.lastRightTap < TAP) { this.dashPressed = true; this.dashDir = 1; } this.lastRightTap = _time; }
  }

  /** Tap a key 3× within 3s. Returns whether a tap registered this frame, the running count, and whether it fired (hit 3). */
  private combo3(keyName: string, time: number): { tapped: boolean; count: number; fired: boolean } {
    const st = (this.comboState[keyName] ??= { taps: 0, expire: 0 });
    if (!Phaser.Input.Keyboard.JustDown(this.k[keyName])) return { tapped: false, count: st.taps, fired: false };
    if (time > st.expire) st.taps = 0;
    st.taps++; st.expire = time + 3000;
    const fired = st.taps >= 3;
    const count = fired ? 3 : st.taps;
    if (fired) st.taps = 0;
    return { tapped: true, count, fired };
  }

  get runMode() { return !this.k.shift.isDown; } // RUN by default; hold Shift to WALK carefully
  get moveX(): number { return ((this.k.left.isDown || this.k.a.isDown) ? -1 : 0) + ((this.k.right.isDown || this.k.d.isDown) ? 1 : 0); }
  get upHeld() { return this.k.up.isDown || this.k.w.isDown; }
  get downHeld() { return this.k.down.isDown || this.k.s.isDown; }
  get coverHeld() { return this.k.cover.isDown; }

  aimWorld(): Phaser.Math.Vector2 {
    const p = this.scene.input.activePointer;
    return p.positionToCamera(this.scene.cameras.main) as Phaser.Math.Vector2;
  }
}
