import Phaser from 'phaser';
import type { GameScene } from './GameScene';
import { ImUI } from '../ui/ImUI';

export class HUDScene extends Phaser.Scene {
  private gs!: GameScene;
  private ui!: ImUI;

  constructor() { super('HUDScene'); }

  create() {
    this.gs = this.scene.get('GameScene') as GameScene;
    this.ui = new ImUI(this, 100);
  }

  update() {
    const h = this.gs?.hud;
    if (!h) return;
    const { ui } = this;
    const W = this.scale.width, H = this.scale.height;
    const now = this.time.now;

    ui.startFrame();

    // top-left: HP + weapon stats
    ui.col({ x: 28, y: 28, gap: 8 });
      ui.row({ gap: 2 });
        for (let i = 0; i < h.maxHp; i++)
          ui.img(h.hp >= i + 1 ? 'heart_full' : 'heart_empty', 28, 28);
      ui.end();
      ui.text(`${h.weapon}  ${h.ammo}`, { fontSize: 18, color: '#9fe8ff' });
      ui.text(`[${h.mode}]  Shift toggles`, { fontSize: 14, color: '#e8a13a' });
      ui.text(`GRENADES x${h.grenades}   (G)`, { fontSize: 14, color: '#cfe0a0' });
    ui.end();

    // top-center: objective
    ui.text(h.objective, { x: W / 2, y: 18, fontSize: 14, color: '#8090a4', originX: 0.5 });

    // boss bar (only when boss is alive and on-screen)
    if (h.bossActive) {
      const bw = 420, bh = 14;
      ui.text(h.bossName, { x: W / 2, y: 44, fontSize: 14, color: '#ff6a5a', originX: 0.5 });
      ui.progressBar(W / 2 - bw / 2, 66, bw, bh, h.bossHp / h.bossMax, 0x3a2330, 0xc0392b);
    }

    // top-right: escape countdown
    if (h.escapeLeft >= 0) {
      const danger = h.escapeLeft <= 15;
      const scale = danger ? 1.25 + 0.12 * Math.sin(now * 0.02) : 1;
      ui.text(`ESCAPE  ${h.escapeLeft}s`, {
        x: W - 28, y: 60,
        fontSize: 20, color: danger ? '#ff4030' : '#ffd23a', bold: true,
        originX: 1, scaleX: scale, scaleY: scale,
      });
    }

    // center: flash message
    if (h.message) {
      ui.text(h.message, {
        x: W / 2, y: H * 0.32,
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: 30, color: '#e8e0c0', bold: true, shadow: true,
        originX: 0.5, originY: 0.5,
      });
    }

    // danger vignette — pulses red on ALARM, heartbeat at 1 HP
    let edge = 0;
    if (h.alarm) edge = 0.16 + 0.10 * Math.sin(now * 0.011);
    if (h.hp <= 1) edge = Math.max(edge, 0.30 + 0.22 * Math.abs(Math.sin(now * 0.006)));
    if (edge > 0) {
      const t = 80;
      ui.fillRect(0, 0, W, t, 0xd01818, edge);
      ui.fillRect(0, H - t, W, t, 0xd01818, edge);
      ui.fillRect(0, 0, t, H, 0xd01818, edge);
      ui.fillRect(W - t, 0, t, H, 0xd01818, edge);
    }

    ui.endFrame();
  }
}
