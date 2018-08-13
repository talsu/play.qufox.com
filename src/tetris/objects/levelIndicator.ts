import { ObjectBase } from "./objectBase";

export class LevelIndicator extends ObjectBase {
    private text: Phaser.GameObjects.Text;
    private level: number;
    private score: number;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene);

        this.text = scene.add.text(x, y, "Level\n1\nScore\n0", { fontFamily: "Arial Black", fontSize: 24, color: "#ffffff" });
        this.text.setStroke('#03396c', 5);

        //  Apply the shadow to the Stroke only
        this.text.setShadow(2, 2, '#03396c', 0, true, false);
    }

    setLevel(level:number) {
        this.level = level;
        this.setText();
    }

    setScore(score:number) {
        this.score = score;
        this.setText();
    }

    setText() {
        this.text.setText(`Level\n${this.level}\nScore\n${this.score}`);
    }

    clear() {
        this.setLevel(1);
        this.setScore(0);
    }
}