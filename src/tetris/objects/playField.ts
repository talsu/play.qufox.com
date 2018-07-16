
export class PlayField extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, x?: number, y?: number, children?: Phaser.GameObjects.GameObject[]) {
        super(scene, x, y, children);
        let bg = new Phaser.GameObjects.Graphics(
            scene, {
                x: 1, y: 1
            }
        );
        this.width = 200;
        this.height = 200;
        bg.fillStyle(0xEEEEEE, 1.0);
        bg.fillRect(10, 10, 100, 100);
        this.add(bg);
    }

    
}