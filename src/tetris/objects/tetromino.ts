import {CONST, getBlockSize, TetrominoType, RotateType, ColRow} from '../const/const';
import {ObjectBase} from './objectBase';
import Container = Phaser.GameObjects.Container;
const BLOCK_SIZE = getBlockSize();

/**
 * Tetromino
 */
export class Tetromino extends ObjectBase {
    public col: number;
    public row: number;
    private inactiveBlocks: ColRow[] = null;
    private blockedPositions: ColRow[];
    private lockAnimationTween: Phaser.Tweens.Tween;
    private readonly ghostBlockGraphics: Phaser.GameObjects.Graphics;
    private readonly blockImages: Phaser.GameObjects.Container;
    private readonly ghostBlockImages: Phaser.GameObjects.Container;

    public rotateType: RotateType = RotateType.UP;
    public isSpawnSuccess: boolean;
    public container: Phaser.GameObjects.Container;
    public type: TetrominoType;
    public lastMovement: string;
    public lastKickDataIndex: number;
    public dropCounter: { softDrop: number, hardDrop: number, autoDrop: number } = {
        softDrop: 0,
        hardDrop: 0,
        autoDrop: 0
    };

    constructor(scene: Phaser.Scene, type: TetrominoType, blockedPositions?: ColRow[], col?: number, row?: number) {
        super(scene);
        // Create main container.
        this.container = scene.add.container(0, 0);

        // Set Container size.
        let tetrominoSize = CONST.TETROMINO.SIZE[type];
        this.container.width = BLOCK_SIZE * tetrominoSize[0];
        this.container.height = BLOCK_SIZE * tetrominoSize[1];

        // Set type
        this.type = type;
        // Set blocked position array.
        this.blockedPositions = blockedPositions || [];

        // Create ghost block graphics.
        this.ghostBlockImages = this.scene.add.container(0, 0);
        this.container.add(this.ghostBlockImages);
        this.ghostBlockGraphics = this.scene.add.graphics();
        this.container.add(this.ghostBlockGraphics);

        // Create block image container.
        this.blockImages = this.scene.add.container(0, 0);
        this.container.add(this.blockImages);

        // Create block images.
        CONST.TETROMINO.BLOCKS[this.type][this.rotateType].forEach(colRow => {
            let imageOffset = BLOCK_SIZE / 2;
            let blockImage = this.scene.add.image(
                    colRow[0] * BLOCK_SIZE + imageOffset,
                    colRow[1] * BLOCK_SIZE + imageOffset,
                    'blockSheet', CONST.TETROMINO.SPRITE_IMAGE_FRAME[this.type]);
            if (BLOCK_SIZE != CONST.SCREEN.BLOCK_IMAGE_SIZE) blockImage.setScale(BLOCK_SIZE / CONST.SCREEN.BLOCK_IMAGE_SIZE);

            // Add images to image container.
            this.blockImages.add(blockImage);

            let ghostImage = this.scene.add.image(
                colRow[0] * BLOCK_SIZE + imageOffset,
                colRow[1] * BLOCK_SIZE + imageOffset,
                'blockSheet', 8);
            if (BLOCK_SIZE != CONST.SCREEN.BLOCK_IMAGE_SIZE) ghostImage.setScale(BLOCK_SIZE / CONST.SCREEN.BLOCK_IMAGE_SIZE);

            // Add images to image container.
            this.ghostBlockImages.add(ghostImage);
        });
        // Move block image in block image container.
        this.moveBlockImages();

        // Initial position
        let initCol = col === undefined ? 3 : col;
        let initRow = row || -2;

        // Move to initial position and set spawn state.
        this.isSpawnSuccess = this.move(initCol, initRow, 'spwan');
    }

    /**
     * Move tetromino.
     * @param {number} col - Col position.
     * @param {number} row - Row position.
     * @param {string} movement - Action name for save last movement.
     * @returns {boolean} - Is move success.
     */
    private move(col: number, row: number, movement: string): boolean {
        // Check new position is valid and if it's invalid return false.
        if (!this.isValidPosition(this.rotateType, col, row)) return false;

        // Set col, row positions.
        this.col = col;
        this.row = row;

        // Set container x, y.
        this.container.x = this.col * BLOCK_SIZE;
        this.container.y = this.row * BLOCK_SIZE;

        // Move block images.
        this.moveBlockImages();
        // Draw ghost block.
        this.drawGhostBlocks();

        // Save last movement.
        this.lastMovement = movement;

        // Return true - move success.
        return true;
    }

    /**
     * Move tetromino left.
     */
    moveLeft(): boolean {
        return this.move(this.col - 1, this.row, 'left');
    }

    /**
     * Move tetromino right.
     */
    moveRight(): boolean {
        return this.move(this.col + 1, this.row, 'right');
    }

    /**
     * Move tetromino up.
     */
    moveUp(): boolean {
        return this.move(this.col, this.row - 1, 'up');
    }

    /**
     * Move tetromino down.
     * @param {string} dropType - Check drop type for scoring. (soft, hard, auto)
     */
    moveDown(dropType: string): boolean {
        const isSuccess = this.move(this.col, this.row + 1, 'down');
        if (isSuccess) this.dropCounter[dropType]++; // Increase drop count when move success.
        return isSuccess
    }

    /**
     * Move tetromino to end of down position.
     */
    hardDrop() {
        while (this.moveDown('hardDrop')) {
        }
        this.lastMovement = 'hardDrop';
    }

    /**
     * Rotate tetromino.
     * @link https://tetris.wiki/SRS
     * @param {boolean} isClockwise - Rotate direction.
     */
    rotate(isClockwise: boolean): boolean {
        // Get current rotate position index.
        let index = CONST.TETROMINO.ROTATE_SEQ.indexOf(this.rotateType);
        // Move rotate position index
        index += isClockwise ? 1 : -1;
        index = (CONST.TETROMINO.ROTATE_SEQ.length + index) % CONST.TETROMINO.ROTATE_SEQ.length;
        // Get new rotate type.
        let newRotateType = CONST.TETROMINO.ROTATE_SEQ[index];

        // Get kick data.
        let kickData = null;
        switch (this.type) {
            case "O":
                kickData = [];
                break; // 'O' block can not be kick and move.
            case "I":
                kickData = CONST.TETROMINO.I_KICK_DATA[this.rotateType + '>' + newRotateType];
                break;
            default:
                kickData = CONST.TETROMINO.JLSTZ_KICK_DATA[this.rotateType + '>' + newRotateType];
                break;
        }

        // Get first available position from kick data and move.
        return !kickData.length || kickData.some((colRow, index) => {
            let newCol = this.col + colRow[0];
            let newRow = this.row - colRow[1]; // kickData Y is opposite Row.
            if (this.isValidPosition(newRotateType, newCol, newRow)) { // if valid position.
                // Set new rotate type.
                this.rotateType = newRotateType;
                // Move
                this.move(newCol, newRow, 'rotate');
                // Set last kick data index;
                this.lastKickDataIndex = index;
                // return function.
                return true;
            }
        });
    }

    /**
     * Is lockable on next position.
     * - Check next down position is invalid.
     */
    isLockable(): boolean {
        return !this.isValidPosition(this.rotateType, this.col, this.row + 1);
    }

    /**
     * Clear line and pull down upper blocks.
     * @param {number} row - Row to clear.
     */
    clearLine(row: number): boolean {
        // remove row blocks..
        this.inactiveBlocks
            .filter(colRow => row == (this.row + colRow[1]))
            .forEach((colRow) => this.inactiveBlocks.splice(this.inactiveBlocks.indexOf(colRow), 1));
        // pull down upper blocks.
        this.inactiveBlocks
            .filter(colRow => row > (this.row + colRow[1]))
            .forEach(colRow => colRow[1] = colRow[1] + 1);

        // draw inactive blocks
        this.moveBlockImages();

        // if Tetromino is empty return true;
        return !this.inactiveBlocks.length;
    }

    /**
     * Move block images.
     */
    moveBlockImages(blockImages?: Container, rowOffset?: number) {
        // Calculate image position offset.
        const imageOffset = BLOCK_SIZE / 2;
        let index = 0;
        // Get block positions.
        let blockOffsets = this.getBlockOffsets();
        (blockImages || this.blockImages).each((blockImage) => {
            let colRow = blockOffsets[index];
            if (colRow) { // if block position exists, set position.
                blockImage.x = colRow[0] * BLOCK_SIZE + imageOffset;
                blockImage.y = (colRow[1] + (rowOffset||0)) * BLOCK_SIZE + imageOffset;
                blockImage.visible = true;
            } else {
                // if block is not exists, hide block image.
                blockImage.visible = false;
            }
            index++;
        });
    }

    /**
     * Draw ghost blocks.
     */
    drawGhostBlocks() {
        // Get ghost row position offset.
        let ghostRowOffset = this.getGhostRowOffset();
        // Clear old ghost graphic.
        this.ghostBlockGraphics.clear();
        this.ghostBlockImages.visible = false;

        // If block is inactive or show ghost option is off or ghost row offset is not exist, stop draw.
        if (this.inactiveBlocks || !CONST.TETROMINO.SHOW_GHOST || !ghostRowOffset) return;

        // Set color and alpha.
        this.ghostBlockGraphics.fillStyle(CONST.TETROMINO.COLOR[this.type]);
        this.ghostBlockGraphics.alpha = 0.3;
        this.ghostBlockImages.visible = true;
        // Draw rect each position.
        this.getBlockOffsets().forEach(colRow => {
            this.ghostBlockGraphics.fillRect(
                colRow[0] * BLOCK_SIZE,
                (colRow[1] + ghostRowOffset) * BLOCK_SIZE,
                BLOCK_SIZE,
                BLOCK_SIZE);
        });

        this.moveBlockImages(this.ghostBlockImages, ghostRowOffset);
    }

    /**
     * Inactive tetromino.
     */
    inactive() {
        // Destroy ghost graphics.
        this.ghostBlockGraphics.destroy();
        this.ghostBlockImages.each(block => block.destroy());
        this.ghostBlockImages.destroy();
        // Copy current block position offsets to inactive positions.
        this.inactiveBlocks = this.getBlockOffsets().map(colRow => [colRow[0], colRow[1]]);
    }

    /**
     * Get block position offsets.
     * @param {RotateType} rotateType - Rotate type.
     * @returns {ColRow[]} - Position offsets.
     */
    getBlockOffsets(rotateType?: RotateType): ColRow[] {
        return this.inactiveBlocks || CONST.TETROMINO.BLOCKS[this.type][rotateType || this.rotateType];
    }

    /**
     * Get block positions.
     * @param {RotateType} rotateType - Rotate type.
     * @param {number} col - Col position.
     * @param {number} row - Row position.
     * @returns {ColRow[]} - Block positions.
     */
    getBlocks(rotateType?: RotateType, col?: number, row?: number): ColRow[] {
        let colBase = (col === undefined) ? this.col : col;
        let rowBase = (row === undefined) ? this.row : row;
        // Add position offsets and return.
        return this.getBlockOffsets(rotateType).map(colRow => {
            return [colBase + colRow[0], rowBase + colRow[1]];
        });
    }

    /**
     * Get ghost row offset.
     * @returns {number} - Ghost row offset.
     */
    getGhostRowOffset(): number {
        let row = this.row;
        // Increase row value while position is valid. (like hard drop)
        while (this.isValidPosition(this.rotateType, this.col, row)) {
            row++;
        }
        // Calculate offset and return;
        return row - this.row - 1;
    }

    /**
     * Check is valid tetromino position.
     * @param {RotateType} rotateType - Rotate type.
     * @param {number} col - Col position.
     * @param {number} row - Row position.
     * @returns {boolean} - Is valid.
     */
    isValidPosition(rotateType: RotateType, col: number, row: number): boolean {
        // Check all block is not duplicate with blocked positions. 
        return this.getBlocks(rotateType, col, row).every(colRow => this.isValidBlockPosition(colRow[0], colRow[1]));
    }

    /**
     * Check is valid one block position.
     * @param {number} col - Col value.
     * @param {number} row - Row value.
     * @returns {boolean} - Is valid.
     */
    isValidBlockPosition(col: number, row: number): boolean {
        // If any block is duplicate, return false. (invalid)
        if (this.blockedPositions.some(colRow => colRow[0] === col && colRow[1] === row)) return false;
        // If position is out of range, return false. (invalid)
        return !(
            (col < 0 || CONST.PLAY_FIELD.COL_COUNT <= col) ||
            (row < (-CONST.PLAY_FIELD.ROW_COUNT) || CONST.PLAY_FIELD.ROW_COUNT <= row)
        );
    }

    /**
     * Get T tetromino corner occupied count.
     * @returns {{pointSide:number, flatSide:number}} pointSide occupied count and flat side occupied count.
     */
    getTSpinCornerOccupiedCount(): { pointSide: number, flatSide: number } {
        let result = {pointSide: 0, flatSide: 0};
        // If tetromino is not T type, return default value.
        if (this.type != TetrominoType.T) return result;
        // Get each corner is occupied.
        let cornerOccupiedArray = CONST.TETROMINO.T_SPIN_CORNER
            .map(colRow => [this.col + colRow[0], this.row + colRow[1]])
            .map(colRow => !this.isValidBlockPosition(colRow[0], colRow[1]));

        // Get current rotate index.
        let rotateIndex = CONST.TETROMINO.ROTATE_SEQ.indexOf(this.rotateType);

        // Get rotated corner.
        for (let offset = 0; offset < 4; ++offset) {
            let index = (CONST.TETROMINO.ROTATE_SEQ.length + rotateIndex + offset) % CONST.TETROMINO.ROTATE_SEQ.length;
            let isOccupied = cornerOccupiedArray[index];
            if (isOccupied) {
                if (offset < 2) result.pointSide++; // index 0, 1 is point side.
                else result.flatSide++; // index 2, 3 is flat side.
            }
        }

        return result;
    }

    /**
     * Destroy tetromino.
     */
    destroy() {
        // Destroy block images.
        this.blockImages.each(blockImage => blockImage.destroy());
        this.blockImages.destroy();

        // Destroy ghost graphics.
        this.ghostBlockGraphics.clear();
        this.ghostBlockGraphics.destroy();

        // Remove objects from container.
        this.container.remove(this.blockImages);
        this.container.remove(this.ghostBlockGraphics);

        // Destroy container.
        this.container.destroy();
    }

    /**
     * Play lock animation.
     * @param {Function} callback - Callback function on complete.
     */
    playLockAnimation(callback?: Function) {
        // If animation is exists, stop animation.
        if (this.lockAnimationTween) this.stopLockAnimation();
        // Create animation.
        this.lockAnimationTween = this.scene.add.tween({
            targets: this.blockImages,
            ease: 'Sine.easeInOut',
            duration: CONST.PLAY_FIELD.LOCK_DELAY_MS,
            delay: 0,
            alpha: { // Alpha to 0.
                getStart: () => 1.0,
                getEnd: () => 0.0
            },
            onComplete: () => { // When complete.
                // Set alpha to 1.0
                this.blockImages.alpha = 1.0;
                // Remove animation.
                this.lockAnimationTween = null;
                // Call callback function.
                if (callback) callback();
            }
        });
    }

    /**
     * Is lock animation is Playing.
     */
    isPlayingLockAnimation(): boolean {
        return Boolean(this.lockAnimationTween);
    }

    /**
     * Stop lock animation.
     */
    stopLockAnimation() {
        if (this.lockAnimationTween) {
            this.lockAnimationTween.pause();
            this.lockAnimationTween.stop();
            this.lockAnimationTween = null;
            this.blockImages.alpha = 1.0;
        }
    }
}