
/**
 * Object base class.
 */
export abstract class ObjectBase {
    protected scene: Phaser.Scene;
    constructor(scene: Phaser.Scene) { 
        this.scene = scene;
    }
}