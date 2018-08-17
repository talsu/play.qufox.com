import {CONST, BLOCK_SIZE, TetrominoType} from "../const/const";
import {ObjectBase} from './objectBase';
import {TetrominoBox} from "./tetrominoBox";

export class TetrominoBoxQueue extends ObjectBase {
    private container: Phaser.GameObjects.Container;
    private boxes: TetrominoBox[] = [];
    private randomBag: TetrominoType[] = [];
    private typeQueue: TetrominoType[] = [];

    constructor(scene: Phaser.Scene, x: number, y: number, queueSize: number) {
        super(scene);
        // Create container.
        this.container = scene.add.container(x, y);

        // Create tetromino boxes with queue size.
        for (let i = 0; i < queueSize; ++i) {
            let box = new TetrominoBox(this.scene, BLOCK_SIZE, BLOCK_SIZE + (4 * BLOCK_SIZE * i + BLOCK_SIZE * i), 6 * BLOCK_SIZE, 4 * BLOCK_SIZE);
            this.boxes.push(box);
            this.container.add(box.container);
        }
    }

    /**
     * Random tetromino type generator.
     * Push new type to Queue and return shifted item.
     * @link https://tetris.wiki/Random_Generator
     * @returns {TetrominoType} Generated tetromino type.
     */
    randomTypeGenerator(): TetrominoType {
        // Repeat until type queue is full.
        while (this.typeQueue.length < (this.boxes.length + 1)) {
            // If random bag is empty. copy tetromino types to random bag.
            if (!this.randomBag.length) this.randomBag = CONST.TETROMINO.TYPES.slice();
            // Get random item (type) from random bag.
            let type = this.randomBag.splice(Math.floor(Math.random() * this.randomBag.length), 1)[0];
            // Push random type to type queue.
            this.typeQueue.push(type);
        }

        // Shift type from type queue.
        let gotType = this.typeQueue.shift();

        // Update boxes for UI.
        this.boxes.forEach((box, index) => box.hold(this.typeQueue[index]));

        // Return shifted type.
        return gotType;
    }

    /**
     * Clear type queue and boxes.
     */
    clear() {
        this.typeQueue = [];
        this.boxes.forEach(box => box.hold());
    }
}