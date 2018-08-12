
/**
 * Object base class.
 */
export abstract class ObjectBase extends Phaser.Events.EventEmitter {
    protected scene: Phaser.Scene;
    constructor(scene: Phaser.Scene) {
        super();
        this.scene = scene;
    }
}