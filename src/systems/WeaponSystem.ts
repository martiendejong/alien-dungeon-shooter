import Phaser from 'phaser';
import { TUNING } from '../config/tuning';
import { InputManager } from './InputManager';
import { Player } from '../entities/Player';

export type WeaponKey = 'pistol' | 'shotgun' | 'smg' | 'rifle';
interface Slot { key: WeaponKey; def: any; ammo: number; owned: boolean; }

export interface CombatHost {
  fireBullet(x: number, y: number, angle: number, speed: number, dmg: number, friendly: boolean): void;
  hitscan(x: number, y: number, angle: number, dmg: number, range: number): void;
  flash(x: number, y: number): void;
}

export class WeaponSystem {
  slots: Slot[];
  index = 0;
  armed = false;            // you START UNARMED — pick up the weapon to be able to shoot
  private nextFireAt = 0;
  private wasFire = false;

  constructor(private host: CombatHost) {
    const w = TUNING.weapons;
    this.slots = [
      { key: 'pistol', def: w.pistol, ammo: Infinity, owned: false },
      { key: 'shotgun', def: w.shotgun, ammo: w.shotgun.ammo, owned: false },
      { key: 'smg', def: w.smg, ammo: w.smg.ammo, owned: false },
      { key: 'rifle', def: w.rifle, ammo: w.rifle.ammo, owned: false },
    ];
  }

  /** Grab the weapon (the pistol) — now you can fire. */
  acquire() { this.armed = true; this.slots[0].owned = true; if (!this.slots[this.index].owned) this.index = 0; }

  /** Pick up a SPECIFIC weapon — own it, top up its ammo, switch to it. */
  give(key: WeaponKey) {
    this.armed = true;
    const i = this.slots.findIndex(s => s.key === key);
    if (i < 0) return;
    const s = this.slots[i];
    s.owned = true;
    if (s.def.ammo !== Infinity) s.ammo = Math.max(s.ammo, s.def.ammo); // refill to a full magazine
    this.index = i;
  }

  /** Which weapons are currently owned (to carry the arsenal into the next level). */
  ownedKeys(): WeaponKey[] { return this.slots.filter(s => s.owned).map(s => s.key); }

  get current() { return this.slots[this.index]; }

  addAmmo(amount = 16) {
    // refill current non-infinite, else the shotgun
    const s = this.current.ammo !== Infinity ? this.current : this.slots[1];
    s.ammo += amount;
  }

  private switchTo(i: number) {
    if (i < 0 || i >= this.slots.length || !this.slots[i].owned) return;
    this.index = i;
  }

  update(time: number, input: InputManager, player: Player) {
    if (!this.armed) return; // unarmed → can't shoot or switch
    if (input.weaponSlot) this.switchTo(input.weaponSlot - 1);
    if (input.wheelDelta !== 0) {
      let i = this.index;
      do { i = (i + (input.wheelDelta > 0 ? 1 : this.slots.length - 1)) % this.slots.length; }
      while (!this.slots[i].owned && i !== this.index);
      this.index = i;
      input.wheelDelta = 0;
    }

    const s = this.current;
    const wantSemi = input.firePressed && !this.wasFire;
    const wantAuto = input.firePressed && s.def.auto;
    this.wasFire = input.firePressed;
    if (!(wantSemi || wantAuto)) return;
    if (time < this.nextFireAt) return;
    if (s.ammo <= 0) return;

    this.nextFireAt = time + s.def.cooldownMs;
    if (s.ammo !== Infinity) s.ammo--;

    const m = player.getMuzzle();
    const base = player.aimAngle;
    const pellets = s.def.pellets ?? 1;
    for (let p = 0; p < pellets; p++) {
      const spread = (Math.random() - 0.5) * 2 * s.def.spread;
      this.host.hitscan(m.x, m.y, base + spread, s.def.dmg, s.def.range);
    }
    this.host.flash(m.x, m.y);
    player.beginReload(s.def.cooldownMs); // stand still and reload before the next shot
  }

  hud(): { name: string; ammo: string } {
    if (!this.armed) return { name: 'UNARMED', ammo: '' };
    const s = this.current;
    return { name: s.def.name, ammo: s.ammo === Infinity ? '∞' : String(s.ammo) };
  }
}
