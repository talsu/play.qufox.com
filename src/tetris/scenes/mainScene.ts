/**
 * @author       talsu  <talsu84@gmail.com>
 * @copyright    2018 talsu.net
 * @license      MIT
 */

import {PlayField} from '../objects/playField';
import {CONST, BLOCK_SIZE, InputState} from "../const/const";
import {TetrominoBox} from "../objects/tetrominoBox";
import {TetrominoBoxQueue} from "../objects/tetrominoBoxQueue";
import {LevelIndicator} from '../objects/levelIndicator';
import {Engine} from '../engine';

/**
 * Main scene
 */
export class MainScene extends Phaser.Scene {
    private keys: { LEFT: Phaser.Input.Keyboard.Key; RIGHT: Phaser.Input.Keyboard.Key; CTRL: Phaser.Input.Keyboard.Key; UP: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key; DOWN: Phaser.Input.Keyboard.Key; Z: Phaser.Input.Keyboard.Key; X: Phaser.Input.Keyboard.Key; C: Phaser.Input.Keyboard.Key; };
    // private holdBox: TetrominoBox;
    // private playField: PlayField;
    // private tetrominoQueue: TetrominoBoxQueue;
    private engine: Engine;
    private lastUpdateTime: number = null;
    private dasFlags: any = {};

    constructor() {
        super({key: "MainScene"});
    }

    /**
     * preload - call after constructor.
     */
    preload(): void {
        // Load background image.
        this.load.image('background', 'assets/image/bongtalk-background-default.jpg');
        // Load tetromino block images.
        this.load.image(CONST.TETROMINO.IMAGES.Z, 'assets/image/red-block.png');
        this.load.image(CONST.TETROMINO.IMAGES.L, 'assets/image/orange-block.png');
        this.load.image(CONST.TETROMINO.IMAGES.O, 'assets/image/yellow-block.png');
        this.load.image(CONST.TETROMINO.IMAGES.S, 'assets/image/green-block.png');
        this.load.image(CONST.TETROMINO.IMAGES.I, 'assets/image/cyan-block.png');
        this.load.image(CONST.TETROMINO.IMAGES.J, 'assets/image/blue-block.png');
        this.load.image(CONST.TETROMINO.IMAGES.T, 'assets/image/purple-block.png');
    }

    /**
     * create - call after preload.
     */
    create(): void {
        // Add background Image.
        // TODO: fit background image to game screen size.
        this.add.image(0, 300, 'background');

        // Create tetromino hold box.
        const holdBox = new TetrominoBox(this, BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE * 6, BLOCK_SIZE * 4);
        // Create level indicator.
        const levelIndicator = new LevelIndicator(this, BLOCK_SIZE, BLOCK_SIZE * 6);

        // Calculate play field size.
        const playFieldWidth = BLOCK_SIZE * CONST.PLAY_FIELD.COL_COUNT;
        const playFieldHeight = BLOCK_SIZE * CONST.PLAY_FIELD.ROW_COUNT;

        // Create tetromino queue. length = 4
        const tetrominoQueue = new TetrominoBoxQueue(this, holdBox.container.width + playFieldWidth + (2 * BLOCK_SIZE), 0, 4);

        // Create play field.
        const playField = new PlayField(this, holdBox.container.width + (2 * BLOCK_SIZE), BLOCK_SIZE, playFieldWidth, playFieldHeight);

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

        this.engine = new Engine(playField, holdBox, tetrominoQueue, levelIndicator);

        this.engine.start();
    }

    /**
     * update - call when every tick.
     */
    update(): void {
        // last updated time
        let oldTime: number = this.lastUpdateTime === null ? new Date().getTime() : this.lastUpdateTime;
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
    chargeDAS(input: string, isPressed: boolean, time: number, init?: number, repeat?: number) {
        // Set initial value to 0.
        if (!this.dasFlags[input]) this.dasFlags[input] = 0;
        // Copy old value.
        let oldValue = this.dasFlags[input];
        // If pressed increase value by time. (ms)
        if (isPressed) this.dasFlags[input] += time;
        // If not pressed reset value to 0.
        else this.dasFlags[input] = 0;
        // Copy new value.
        let newValue = this.dasFlags[input];

        // If old value is 0 and new value is positive, key is pressed.
        if (oldValue == 0 && newValue) this.onInput(input, InputState.PRESS);
        // If old value is positive but new value is 0, key is release.
        if (oldValue && newValue == 0) this.onInput(input, InputState.RELEASE);

        // If new value is 0, stop this function.
        if (newValue == 0) return;

        // Delay value between 'press' and first 'hold' state.
        let initDelay = init || CONST.PLAY_FIELD.DAS_MS;
        // Delay value between 'hold' and next 'hold' state.
        let repeatDelay = repeat || CONST.PLAY_FIELD.AR_MS;
        // Last 'hold' state called time.
        let rOld = Math.floor((oldValue - initDelay) / repeatDelay);
        // New 'hold' state time.
        let rNew = Math.floor((newValue - initDelay) / repeatDelay);

        // Call 'hold' state.
        if (rNew >= 0 && rOld < rNew) {
            if (rOld < 0) rOld = -1;
            for (let i = 0; i < (rNew - rOld); ++i) {
                this.onInput(input, InputState.HOLD);
            }
        }
    }

    /**
     * on input
     * @param direction direction
     * @param state key state - press, hold, release
     */
    onInput(direction: string, state: InputState) {
        this.engine.onInput(direction, state);
    }
}
