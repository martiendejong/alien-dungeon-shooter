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
  interactPressed = false;
  grenadePressed = false;
  reloadPressed = false;
  meleePressed = false;
  firePressed = false;
  pausePressed = false;

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
      esc: kb.addKey(KC.ESC),
    };
    scene.input.on('wheel', (_p: any, _o: any, _dx: number, dy: number) => { this.wheelDelta += dy; });
  }

  update(_time: number) {
    const JD = Phaser.Input.Keyboard.JustDown;
    this.jumpPressed = JD(this.k.space);
    this.upPressed = JD(this.k.up) || JD(this.k.w);
    this.downPressed = JD(this.k.down) || JD(this.k.s);
    this.interactPressed = JD(this.k.interact);
    this.grenadePressed = JD(this.k.grenade);
    this.reloadPressed = JD(this.k.reload);
    this.pausePressed = JD(this.k.esc);

    const p = this.scene.input.activePointer;
    this.firePressed = p.leftButtonDown();
    this.meleePressed = p.rightButtonDown() || JD(this.k.melee);

    this.weaponSlot = JD(this.k.one) ? 1 : JD(this.k.two) ? 2 : JD(this.k.three) ? 3 : 0;
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
