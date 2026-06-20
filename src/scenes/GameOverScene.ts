import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOverScene'); }

  create(data: { win: boolean; level: string }) {
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor(data.win ? '#07120e' : '#120707');
    this.input.setDefaultCursor('default');

    const title = data.win ? 'LEVEL CLEARED' : 'YOU DIED';
    const color = data.win ? '#6fe3c0' : '#c0392b';
    this.add.text(w / 2, h * 0.34, title, {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '64px', color, fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#000', 18);

    const sub = data.win
      ? `${data.level} complete. The descent continues… (Level 2 in development)`
      : `${data.level} — the labs claimed another.`;
    this.add.text(w / 2, h * 0.34 + 60, sub, {
      fontFamily: 'Consolas, monospace', fontSize: '16px', color: '#9fb0c4',
    }).setOrigin(0.5);

    const retry = this.add.text(w / 2, h * 0.62, data.win ? '▶  REPLAY LEVEL' : '▶  RETRY', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '24px', color: '#e8a13a',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const menu = this.add.text(w / 2, h * 0.62 + 44, 'MAIN MENU', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '18px', color: '#8090a4',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    this.tweens.add({ targets: retry, alpha: 0.4, duration: 800, yoyo: true, repeat: -1 });

    const restart = () => { this.scene.start('GameScene', { level: 'level1' }); this.scene.launch('HUDScene'); };
    retry.on('pointerdown', restart);
    this.input.keyboard!.once('keydown-ENTER', restart);
    menu.on('pointerdown', () => this.scene.start('MainMenuScene'));
  }
}
