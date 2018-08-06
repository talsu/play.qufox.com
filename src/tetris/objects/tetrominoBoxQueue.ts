import { CONST, TetrominoType } from "../const/const";
import { TetrominoBox } from "./tetrominoBox";

export class TetrominoBoxQueue {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private boxs: TetrominoBox[];
    private randomBag: TetrominoType[];
    private typeQueue: TetrominoType[];

    constructor(scene: Phaser.Scene, x: number, y: number, queueSize:number) {
        this.scene = scene;

        let size = CONST.PLAY_FIELD.BLOCK_SIZE;
        let width = 6 * size;
        let height = 4 * size * queueSize;
    
        this.container = scene.add.container(x, y);

        // this._super(me.Container, "init", [width/2 + x, height/2 + y, width, height]);
        this.boxs = [];
    
        for (let i = 0; i < queueSize; ++i) {
          let box = new TetrominoBox(this.scene, size, size + (4*size*i + size*i), 6 * size, 4 * size);
          this.boxs.push(box);
          this.container.add(box.container);
        }
    
        this.boxs.forEach(item => item.hold('I'));
        this.typeQueue = [];
        this.randomBag = [];
    }

    /*
        https://tetris.wiki/Random_Generator
    */
    randomTypeGenerator(): TetrominoType {
        while (this.typeQueue.length < (this.boxs.length + 1)) {
            if (!this.randomBag.length) this.randomBag = CONST.TETROMINO.TYPES.slice();
                let type = this.randomBag.splice(Math.floor(Math.random()*this.randomBag.length), 1)[0];
                this.typeQueue.push(type);
            }

            let gotType = this.typeQueue.shift();

            this.boxs.forEach((box, index) => {
            box.hold(this.typeQueue[index]);
        });

        return gotType;
    }

    clear() { this.typeQueue = []; }

}