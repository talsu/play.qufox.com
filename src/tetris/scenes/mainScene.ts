/**
 * @author       talsu  <talsu84@gmail.com>
 * @copyright    2018 talsu.net
 * @license      MIT
 */

import { PlayField } from '../objects/playField';
import { CONST, TetrominoType, RotateType } from "../const/const";
import { TetrominoBox } from "../objects/tetrominoBox";
import { TetrominoBoxQueue } from "../objects/tetrominoBoxQueue";

/**
 * MainSecene
 */
export class MainScene extends Phaser.Scene {
  private keys: { LEFT: Phaser.Input.Keyboard.Key; RIGHT: Phaser.Input.Keyboard.Key; CTRL: Phaser.Input.Keyboard.Key; UP: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key; DOWN: Phaser.Input.Keyboard.Key; Z: Phaser.Input.Keyboard.Key; X: Phaser.Input.Keyboard.Key; C: Phaser.Input.Keyboard.Key; };
  private holdBox: TetrominoBox;
  private playField: PlayField;
  private tetrominoQueue: TetrominoBoxQueue;
  private lastUpdateTime: number = null;
  private dasFlags: any = {};

  constructor() {
    super({ key: "MainScene" });
  }

  /**
   * preload - call after constructor.
   */
  preload(): void {
    // Load background image.
    this.load.image('background', 'assets/image/bongtalk-background-default.jpg');
    // Load tetromino block images.
    this.load.image(CONST.TETROMINO.IMAGES.Z, 'assets/image/red-dot.png');
    this.load.image(CONST.TETROMINO.IMAGES.L, 'assets/image/orange-dot.png');
    this.load.image(CONST.TETROMINO.IMAGES.O, 'assets/image/yellow-dot.png');
    this.load.image(CONST.TETROMINO.IMAGES.S, 'assets/image/green-dot.png');
    this.load.image(CONST.TETROMINO.IMAGES.I, 'assets/image/cyan-dot.png');
    this.load.image(CONST.TETROMINO.IMAGES.J, 'assets/image/blue-dot.png');
    this.load.image(CONST.TETROMINO.IMAGES.T, 'assets/image/purple-dot.png');
  }

  /**
   * create - call after preload.
   */
  create(): void {
    // Add background Image.
    // [TODO] fit background image to game screen size.
    this.add.image(0, 300, 'background');
    
    // Copy block size for reuse.
    const size = CONST.PLAY_FIELD.BLOCK_SIZE;

    // Create tetromino hold box.
    this.holdBox = new TetrominoBox(this, size, size, size*6, size*4);
    
    // Calculate play field size.
    let playFieldWidth = size * CONST.PLAY_FIELD.COL_COUNT;
    let playFieldHeight = size * CONST.PLAY_FIELD.ROW_COUNT;

    // Create tetromino queue. length = 4
    this.tetrominoQueue = new TetrominoBoxQueue(this, this.holdBox.container.width + playFieldWidth + (2*size), 0, 4);
    
    // Create play field.
    this.playField = new PlayField(this, this.holdBox, this.tetrominoQueue, this.holdBox.container.width + (2*size), size, playFieldWidth, playFieldHeight);

    // Create input key bindings.
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

  /**
   * update - call when every tick.
   */
  update(): void {
    // last updated time
    let oldTime: number = this.lastUpdateTime === null ?  new Date().getTime() : this.lastUpdateTime;
    // current
    let newTime = new Date().getTime();
    // Gap between last updated and current.
    let diffTime = newTime - oldTime;
    // set last updated time for new time.
    this.lastUpdateTime = newTime;

    // Charge DAS with key pressed state.
    this.chargeDAS("left", Phaser.Input.Keyboard.DownDuration(this.keys.LEFT), diffTime);
    this.chargeDAS("right", Phaser.Input.Keyboard.DownDuration(this.keys.RIGHT), diffTime);
    this.chargeDAS("softDrop", Phaser.Input.Keyboard.DownDuration(this.keys.DOWN), diffTime, CONST.PLAY_FIELD.SOFTDROP_REPEAT_MS, CONST.PLAY_FIELD.SOFTDROP_REPEAT_MS);
    this.chargeDAS("hardDrop", Phaser.Input.Keyboard.DownDuration(this.keys.SPACE), diffTime);
    this.chargeDAS("anticlockwise", Phaser.Input.Keyboard.DownDuration(this.keys.Z) || Phaser.Input.Keyboard.DownDuration(this.keys.CTRL), diffTime);
    this.chargeDAS("clockwise", Phaser.Input.Keyboard.DownDuration(this.keys.X) || Phaser.Input.Keyboard.DownDuration(this.keys.UP), diffTime);
    this.chargeDAS("hold", Phaser.Input.Keyboard.DownDuration(this.keys.C), diffTime);
  }

  /*
      https://tetris.wiki/DAS
  */
  chargeDAS(direction:string, isPressed:boolean, time:number, init?:number, repeat?:number) {
    if (!this.dasFlags[direction]) this.dasFlags[direction] = 0;
    let oldValue = this.dasFlags[direction];
    if (isPressed) this.dasFlags[direction] += time;
    else this.dasFlags[direction] = 0;
    let newValue = this.dasFlags[direction];

    if (oldValue == 0 && newValue) this.onInput(direction, "press");
    if (oldValue && newValue == 0) this.onInput(direction, "release");

    if (newValue == 0) return;

    let initDelay = init || CONST.PLAY_FIELD.DAS_MS;
    let repeatDelay = repeat || CONST.PLAY_FIELD.AR_MS;
    let rOld = Math.floor((oldValue - initDelay) / repeatDelay);
    let rNew = Math.floor((newValue - initDelay) / repeatDelay);

    if (rNew >= 0 && rOld < rNew) {
      if (rOld < 0) rOld = -1;
      for (let i = 0; i < (rNew - rOld); ++i) {
        this.onInput(direction, "hold");
      }
    }
  }

  /**
   * on input
   * @param direction direction
   * @param state key state - press, hold, release
   */
  onInput(direction: string, state: string) {
    this.playField.onInput(direction, state);
  }
}
