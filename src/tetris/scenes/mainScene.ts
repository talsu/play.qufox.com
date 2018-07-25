/**
 * @author       Digitsensitive <digit.sensitivee@gmail.com>
 * @copyright    2018 Digitsensitive
 * @license      Digitsensitive
 */

import { PlayField } from '../objects/playField';
import { CONST, TetrominoType, RotateType } from "../const/const";
import { TetrominoBox } from "../objects/tetrominoBox";
import { TetrominoBoxQueue } from "../objects/tetrominoBoxQueue";


export class MainScene extends Phaser.Scene {
  private keys: { LEFT: Phaser.Input.Keyboard.Key; RIGHT: Phaser.Input.Keyboard.Key; CTRL: Phaser.Input.Keyboard.Key; UP: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key; DOWN: Phaser.Input.Keyboard.Key; Z: Phaser.Input.Keyboard.Key; X: Phaser.Input.Keyboard.Key; C: Phaser.Input.Keyboard.Key; };
  private holdBox: TetrominoBox;
  private playField: PlayField;
  private tetrominoQueue: TetrominoBoxQueue;
  private lastUpdateTime: number;

  constructor() {
    super({
      key: "MainScene"
    });

    this.lastUpdateTime = null;
  }

  preload(): void {
    this.load.image('background', 'assets/image/bongtalk-background-default.jpg');
  }

  create(): void {
    this.add.image(0, 300, 'background');
    CONST.TETROMINO.TYPES.forEach(type => this.addTexture(type));
    
    let size = CONST.PLAY_FIELD.BLOCK_SIZE;

    this.holdBox = new TetrominoBox(this, size, size, size*6, size*4);
    
    let playFieldWidth = CONST.PLAY_FIELD.BLOCK_SIZE * CONST.PLAY_FIELD.COL_COUNT;
    let playFieldHeight = CONST.PLAY_FIELD.BLOCK_SIZE * CONST.PLAY_FIELD.ROW_COUNT;

    this.tetrominoQueue = new TetrominoBoxQueue(this, this.holdBox.container.width + playFieldWidth + (2*size), 0, 4);
    
    this.playField = new PlayField(this, this.holdBox, this.tetrominoQueue, this.holdBox.container.width + (2*size), CONST.PLAY_FIELD.BLOCK_SIZE, playFieldWidth, playFieldHeight);

    this.keys = {
      LEFT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      RIGHT: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      CTRL: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.CTRL),
      UP: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
      SPACE: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
      DOWN: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      Z: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      X: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      C: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C)
    };
  }

  update(): void {
    let oldTime: number = this.lastUpdateTime === null ?  new Date().getTime() : this.lastUpdateTime;
    let newTime = new Date().getTime();
    let diffTime = newTime - oldTime;
    this.lastUpdateTime = newTime;

    this.playField.chargeDAS("left", Phaser.Input.Keyboard.DownDuration(this.keys.LEFT), diffTime);
    this.playField.chargeDAS("right", Phaser.Input.Keyboard.DownDuration(this.keys.RIGHT), diffTime);
    this.playField.chargeDAS("softDrop", Phaser.Input.Keyboard.DownDuration(this.keys.DOWN), diffTime, CONST.PLAY_FIELD.SOFTDROP_REPEAT_MS, CONST.PLAY_FIELD.SOFTDROP_REPEAT_MS);
    this.playField.chargeDAS("hardDrop", Phaser.Input.Keyboard.DownDuration(this.keys.SPACE), diffTime);
    this.playField.chargeDAS("anticlockwise", Phaser.Input.Keyboard.DownDuration(this.keys.Z) || Phaser.Input.Keyboard.DownDuration(this.keys.CTRL), diffTime);
    this.playField.chargeDAS("clockwise", Phaser.Input.Keyboard.DownDuration(this.keys.X) || Phaser.Input.Keyboard.DownDuration(this.keys.UP), diffTime);
    this.playField.chargeDAS("hold", Phaser.Input.Keyboard.DownDuration(this.keys.C), diffTime);

    this.playField.update();
  }

  addTexture(type:TetrominoType): void {
    let graphics = this.add.graphics();
      // graphics.fillStyle(this.deactiveDots ? 0xEEEEEE: CONST.TETROMINO.COLOR[this.type]);
    graphics.fillStyle(CONST.TETROMINO.COLOR[type]);

    CONST.TETROMINO.DOTS[type][RotateType.UP].forEach(colRow => {
        graphics.fillRect(
            colRow[0] * CONST.PLAY_FIELD.BLOCK_SIZE,
            colRow[1] * CONST.PLAY_FIELD.BLOCK_SIZE,
            CONST.PLAY_FIELD.BLOCK_SIZE,
            CONST.PLAY_FIELD.BLOCK_SIZE);
    });

    let key:string = 'tetromino_' + type;

    let tetrominoSize = CONST.TETROMINO.SIZE[type];
    let width = CONST.PLAY_FIELD.BLOCK_SIZE * tetrominoSize[0];
    let height = CONST.PLAY_FIELD.BLOCK_SIZE * tetrominoSize[1];
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
