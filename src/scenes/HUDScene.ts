import Phaser from 'phaser';
import type { GameScene } from './GameScene';

export class HUDScene extends Phaser.Scene {
  private gs!: GameScene;
  private g!: Phaser.GameObjects.Graphics;
  private hearts: Phaser.GameObjects.Image[] = [];
  private weaponText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private nadeText!: Phaser.GameObjects.Text;
  private objText!: Phaser.GameObjects.Text;
  private msgText!: Phaser.GameObjects.Text;
  private bossText!: Phaser.GameObjects.Text;
  private escapeText!: Phaser.GameObjects.Text;

  constructor() { super('HUDScene'); }

  create() {
    this.gs = this.scene.get('GameScene') as GameScene;
    this.g = this.add.graphics();
    const font = 'Consolas, monospace';

    const maxHearts = Math.max(1, this.gs.hud?.maxHp ?? 3);
    this.hearts = [];
    for (let i = 0; i < maxHearts; i++)
      this.hearts.push(this.add.image(36 + i * 30, 36, 'heart_full').setScrollFactor(0));

    this.weaponText = this.add.text(28, 64, '', { fontFamily: font, fontSize: '18px', color: '#9fe8ff' });
    this.modeText = this.add.text(28, 88, '', { fontFamily: font, fontSize: '14px', color: '#e8a13a' });
    this.nadeText = this.add.text(28, 110, '', { fontFamily: font, fontSize: '14px', color: '#cfe0a0' });
    this.objText = this.add.text(this.scale.width / 2, 18, '', { fontFamily: font, fontSize: '14px', color: '#8090a4' }).setOrigin(0.5, 0);
    this.bossText = this.add.text(this.scale.width / 2, 44, '', { fontFamily: font, fontSize: '14px', color: '#ff6a5a' }).setOrigin(0.5, 0);
    this.escapeText = this.add.text(this.scale.width - 28, 60, '', { fontFamily: font, fontSize: '20px', color: '#ffd23a', fontStyle: 'bold' }).setOrigin(1, 0);
    this.msgText = this.add.text(this.scale.width / 2, this.scale.height * 0.32, '', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '30px', color: '#e8e0c0', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 2, '#000', 6);
  }

  update() {
    const h = this.gs?.hud;
    if (!h) return;
    const g = this.g;
    g.clear();

    // hearts (whole units)
    for (let i = 0; i < this.hearts.length; i++)
      this.hearts[i].setTexture(h.hp >= i + 1 ? 'heart_full' : 'heart_empty');

    this.weaponText.setText(`${h.weapon}  ${h.ammo}`);
    this.modeText.setText(`[${h.mode}]  Shift toggles`);
    this.nadeText.setText(`GRENADES x${h.grenades}   (G)`);
    this.objText.setText(h.objective);

    // boss bar
    if (h.bossActive) {
      const bw = 420, bh = 14, bx = this.scale.width / 2 - bw / 2, by = 66;
      g.fillStyle(0x10151f, 0.85).fillRect(bx - 3, by - 3, bw + 6, bh + 6);
      g.fillStyle(0x3a2330, 1).fillRect(bx, by, bw, bh);
      g.fillStyle(0xc0392b, 1).fillRect(bx, by, bw * Phaser.Math.Clamp(h.bossHp / h.bossMax, 0, 1), bh);
      this.bossText.setText(h.bossName);
    } else this.bossText.setText('');

    // escape countdown
    if (h.escapeLeft >= 0) {
      const danger = h.escapeLeft <= 15;
      this.escapeText.setText(`ESCAPE  ${h.escapeLeft}s`)
        .setColor(danger ? '#ff4030' : '#ffd23a')
        .setScale(danger ? 1.25 + 0.12 * Math.sin(this.time.now * 0.02) : 1);
    } else this.escapeText.setText('');

    // danger vignette — pulses red on ALARM, throbs like a heartbeat at 1 heart
    const now = this.time.now, W = this.scale.width, H = this.scale.height;
    let edge = 0;
    if (h.alarm) edge = 0.16 + 0.10 * Math.sin(now * 0.011);
    if (h.hp <= 1) edge = Math.max(edge, 0.30 + 0.22 * Math.abs(Math.sin(now * 0.006)));
    if (edge > 0) {
      const t = 80;
      g.fillStyle(0xd01818, edge);
      g.fillRect(0, 0, W, t); g.fillRect(0, H - t, W, t); g.fillRect(0, 0, t, H); g.fillRect(W - t, 0, t, H);
    }

    this.msgText.setText(h.message || '');
  }
}
