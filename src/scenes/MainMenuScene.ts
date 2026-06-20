import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create() {
    const { width: w, height: h } = this.scale;
    this.cameras.main.setBackgroundColor('#05070c');

    this.add.text(w / 2, h * 0.26, 'SUBTERRA', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '72px', color: '#6fe3c0', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 0, '#0d3b33', 24, true, true);

    this.add.text(w / 2, h * 0.26 + 56, 'ALIEN DUNGEON SHOOTER', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '18px', color: '#4a5a70', letterSpacing: '6px' as any,
    }).setOrigin(0.5);

    const controls = [
      '←  →   move        ↑ climb / mantle / ladder        ↓ crouch / descend',
      'SHIFT  toggle WALK / RUN          SPACE  jump          C  hide in shadow',
      'MOUSE  aim        L-CLICK  fire        R-CLICK / F  melee        G  grenade',
      '1 2 3 / wheel  switch weapon          E  interact          ESC  pause',
    ];
    this.add.text(w / 2, h * 0.56, controls.join('\n'), {
      fontFamily: 'Consolas, monospace', fontSize: '15px', color: '#9fb0c4', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    const start = this.add.text(w / 2, h * 0.84, '▶  CLICK or PRESS ENTER to descend', {
      fontFamily: 'Segoe UI, sans-serif', fontSize: '22px', color: '#e8a13a',
    }).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    const go = () => { this.scene.start('GameScene', { level: 'level1' }); this.scene.launch('HUDScene'); };
    this.input.once('pointerdown', go);
    this.input.keyboard!.once('keydown-ENTER', go);
  }
}
