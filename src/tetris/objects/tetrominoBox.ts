import { CONST, TetrominoType } from "../const/const";
import { Tetromino } from "./tetromino";

export class TetrominoBox {
    private scene: Phaser.Scene;
    private graphics: Phaser.GameObjects.Graphics;
    private tetromino: Tetromino;
    
    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        this.scene = scene;
        this.container = scene.add.container(x, y);
        this.container.width = width;
        this.container.height = height;

        let bg = scene.add.graphics();
        bg.lineStyle(1, 0xEEEEEE, 1.0);
        bg.strokeRect(0, 0, this.container.width, this.container.height);
        this.container.add(bg);

        this.graphics = scene.add.graphics();
        this.container.add(this.graphics);
    }

    hold(type): TetrominoType {
        let existType:TetrominoType = null;
        if (this.tetromino) { // remove exsist tetromino.
          existType = this.tetromino.type;
          this.container.remove(this.tetromino.container);
          this.tetromino = null;
        }
    
        // if new type is invaild, do not create new tetromino.
        if (CONST.TETROMINO.TYPES.indexOf(type) === -1) return existType;
    
        // create new tetromino.
        let position = {
            I:[1,0.5],
            J:[1.5,1],
            L:[1.5,1],
            T:[1.5,1],
            O:[1,1],
            Z:[1.5,1],
            S:[1.5,1]
        }[type];
        this.tetromino = new Tetromino(this.scene, type, [], position[0], position[1]);
        this.tetromino.deactive();
        this.container.add(this.tetromino.container);
        // this.tetromino.draw();

        return existType;
      }
}