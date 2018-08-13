import { PlayField } from "./objects/playField";
import { TetrominoBox } from "./objects/tetrominoBox";
import { TetrominoBoxQueue } from "./objects/tetrominoBoxQueue";
import { LevelIndicator } from "./objects/levelIndicator";
import { InputState, TetrominoType } from "./const/const";

/**
 * Tetris game engine.
 */
export class Engine {
    private playField: PlayField;
    private holdBox: TetrominoBox;
    private queue: TetrominoBoxQueue;
    private levelIndicator: LevelIndicator;

    constructor(playField: PlayField, holdBox: TetrominoBox, queue: TetrominoBoxQueue, levelIndicator: LevelIndicator) {
        this.playField = playField;
        this.holdBox = holdBox;
        this.queue = queue;
        this.levelIndicator = levelIndicator;  
        this.playField.on('start', this.start.bind(this));
        this.playField.on('gameOver', this.gameOver.bind(this));
        this.playField.on('generateRandomType', this.onPlayFieldGenerateType.bind(this));
        this.playField.on('hold', this.onPlayFieldHold.bind(this));
    }

    /**
     * Start game.
     */
    start() {
        // Clear tetromino hold box.
        this.holdBox.clear();
        // Clear next tetromino queue.
        this.queue.clear();
        // Clear Play field.
        this.playField.clear();

        // Spawn tetromino.
        this.playField.spawnTetromino();
    }

    /**
     * Generate tetromino type request from play field.
     * get type from queue, and pass type to playfield.
     * @param typeReceiver Generated tetromino type receive callback.
     */
    onPlayFieldGenerateType(typeReceiver:(type: TetrominoType) => void) {
        if (typeReceiver) typeReceiver(this.queue.randomTypeGenerator());
    }

    /**
     * Hold tetromino type request from play field.
     * insert type to hold box and get unholded type, and pass unholded type to play field.
     * @param type Tetromino type to hold.
     * @param typeReceiver Unholed type receive callback.
     */
    onPlayFieldHold(type: TetrominoType, typeReceiver:(type: TetrominoType) => void) {
        if (typeReceiver) typeReceiver(this.holdBox.hold(type));
    }

    /**
     * Game over. emit from play field, when can not create tetromino anymore.
     */
    gameOver() {
        console.log('Game Over');

        // [TODO] Show game over screen and score.
        this.start();
    }

    /**
     * on input
     * @param direction direction
     * @param state key state - press, hold, release
     */
    onInput(direction: string, state: InputState) {
      this.playField.onInput(direction, state);
    }
}