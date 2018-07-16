/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 Digitsensitive
 * @license      Digitsensitive
 */

import {PlayField} from '../objects/playField';

export class MainScene extends Phaser.Scene {
  // private phaserSprite: Phaser.GameObjects.Sprite;
  private playField: PlayField;

  constructor() {
    super({
      key: "MainScene"
    });
  }

  preload(): void {
    // this.load.image("logo", "./assets/boilerplate/phaser.png");
  }

  create(): void {
    this.playField = new PlayField(this, 10, 10);
    // this.playField.setActive(true);
    // this.phaserSprite = this.add.sprite(400, 300, "logo");
    //let container: Phaser.GameObjects.Container = this.add.container(20, 20);
    let graphics = new Phaser.GameObjects.Graphics(this, {x:10, y:10});
    graphics.lineStyle(5, 0xFF00FF, 1.0);
    graphics.fillStyle(0xFFFFFF, 1.0);
    graphics.fillRect(50, 50, 400, 200);
    graphics.strokeRect(50, 50, 400, 200)
  }
}
