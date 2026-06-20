import Phaser from 'phaser';
import { TUNING } from './config/tuning';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'game',
  backgroundColor: '#05070c',
  pixelArt: false,
  render: { antialias: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: TUNING.world.gravity }, debug: false },
  },
  scene: [BootScene, MainMenuScene, GameScene, HUDScene, GameOverScene],
};

const game = new Phaser.Game(config);
const el = document.getElementById('loading');
if (el) el.style.display = 'none';
(window as any).__SUBTERRA = game;
