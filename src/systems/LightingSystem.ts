import Phaser from 'phaser';
import { TUNING } from '../config/tuning';

// px-space light (GameScene converts block-coord LightDefs into these)
export interface PxLight {
  x: number; y: number; radius: number; intensity: number;
  color?: number; flicker?: number;
}

interface LiveLight extends PxLight {
  phase: number;
  img: Phaser.GameObjects.Image;
  mult: number;
}

/**
 * Gameplay + visual lighting. darknessAt() drives the hide mechanic and enemy sight;
 * a world-space RenderTexture punches lit "holes" in a dark overlay so what you see
 * matches what the rules use.
 */
export class LightingSystem {
  private scene: Phaser.Scene;
  private lights: LiveLight[] = [];
  private rt: Phaser.GameObjects.RenderTexture;
  private ambient: number = TUNING.lighting.ambientDarkness;
  // The VISIBLE overlay is lighter than the gameplay darkness, so walls/blocked areas stay readable
  // while hide-in-shadow & enemy-sight still use the full `ambient` via darknessAt().
  private visualScale = 0.55;
  setAmbient(a: number) { this.ambient = a; }
  private dynamic: { x: number; y: number; radius: number; mult: number; ttl: number }[] = [];

  constructor(scene: Phaser.Scene, defs: PxLight[], worldW: number, worldH: number) {
    this.scene = scene;
    this.rt = scene.add.renderTexture(0, 0, worldW, worldH).setOrigin(0, 0).setDepth(60);
    for (const d of defs) {
      const img = scene.make.image({ x: d.x, y: d.y, key: 'light', add: false });
      img.setOrigin(0.5, 0.5).setScale(d.radius / 128);
      this.lights.push({ ...d, phase: (d.x * 0.013 + d.y * 0.07) % 6.28, img, mult: 1 });
    }
  }

  /** add a persistent light at runtime (e.g. wall lamps) */
  addLight(x: number, y: number, radius: number, intensity: number, color?: number, flicker = 0) {
    const img = this.scene.make.image({ x, y, key: 'light', add: false });
    img.setOrigin(0.5, 0.5).setScale(radius / 128);
    this.lights.push({ x, y, radius, intensity, color, flicker, phase: (x * 0.013 + y * 0.07) % 6.28, img, mult: 1 });
  }

  /** transient light (muzzle flash, explosion) for this frame */
  pulse(x: number, y: number, radius: number, mult = 1, ttl = 60) {
    this.dynamic.push({ x, y, radius, mult, ttl });
  }

  private lightContribution(px: number, py: number): number {
    let light = 0;
    for (const L of this.lights) {
      const d = Phaser.Math.Distance.Between(px, py, L.x, L.y);
      if (d < L.radius) light += L.intensity * L.mult * (1 - d / L.radius);
    }
    for (const L of this.dynamic) {
      const d = Phaser.Math.Distance.Between(px, py, L.x, L.y);
      if (d < L.radius) light += L.mult * (1 - d / L.radius);
    }
    return Math.min(1, light);
  }

  /** 0 = fully lit, 1 = pitch dark */
  darknessAt(x: number, y: number): number {
    return this.ambient * (1 - this.lightContribution(x, y));
  }

  update(time: number) {
    // flicker
    for (const L of this.lights) {
      if (L.flicker && L.flicker > 0) {
        const n = Math.sin(time * 0.02 + L.phase) * 0.5 + 0.5;
        const n2 = Math.sin(time * 0.071 + L.phase * 2.3) * 0.5 + 0.5;
        L.mult = 1 - L.flicker * (0.6 * n + 0.4 * n2);
      } else L.mult = 1;
    }

    // redraw overlay (visually lighter than the gameplay darkness so blocked areas stay readable)
    this.rt.clear();
    this.rt.fill(0x000000, this.ambient * this.visualScale);
    const eraseList: Phaser.GameObjects.Image[] = [];
    for (const L of this.lights) {
      L.img.setPosition(L.x, L.y).setScale(L.radius / 128).setAlpha(Math.min(1, L.intensity * L.mult));
      eraseList.push(L.img);
    }
    this.rt.erase(eraseList);

    // transient lights
    for (let i = this.dynamic.length - 1; i >= 0; i--) {
      const L = this.dynamic[i];
      const img = this.scene.make.image({ x: L.x, y: L.y, key: 'light', add: false });
      img.setScale(L.radius / 128).setAlpha(Math.min(1, L.mult));
      this.rt.erase(img);
      img.destroy();
      L.ttl -= this.scene.game.loop.delta;
      if (L.ttl <= 0) this.dynamic.splice(i, 1);
    }
  }

  destroy() {
    this.rt.destroy();
    for (const L of this.lights) L.img.destroy();
  }
}
