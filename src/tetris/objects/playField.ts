import {CONST, TetrominoType, ColRow, InputState, RotateType} from "../const/const";
import {ObjectBase} from './objectBase';
import {Tetromino} from "./tetromino";

/**
 * Play field
 */
export class PlayField extends ObjectBase {
    private inactiveTetrominos: Tetromino[] = [];
    private activeTetromino: Tetromino = null;
    private canHold: boolean;
    private container: Phaser.GameObjects.Container;
    private autoDropTimer: Phaser.Time.TimerEvent;
    private droppedRotateType: RotateType;
    public autoDropDelay: number = 1000;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
        super(scene);

        // Create container and set size.
        this.container = scene.add.container(x, y);
        this.container.width = width;
        this.container.height = height;

        // Create background.
        let background = scene.add.graphics();
        // Set background color.
        background.fillStyle(0x000000, 0.4);
        background.fillRect(0, 0, this.container.width, this.container.height);
        // Set background border
        background.lineStyle(1, 0xEEEEEE, 1.0);
        background.strokeRect(0, 0, this.container.width, this.container.height);
        // Add background graphic to container.
        this.container.add(background);
    }

    /**
     * Clear all tetromino
     */
    clear() {
        // Destroy active tetromino.
        if (this.activeTetromino) {
            this.container.remove(this.activeTetromino.container);
            this.activeTetromino.destroy();
        }
        // Destroy all inactive tetrominos.
        this.inactiveTetrominos.forEach(tetromino => {
            this.container.remove(tetromino.container);
            tetromino.destroy();
        });

        // Clear active tetromino.
        this.activeTetromino = null;
        // Clear inactive tetrominos.
        this.inactiveTetrominos = [];
    }

    /**
     * Spawn new tetromino.
     * @param {TetrominoType} type - Tetromino type.
     */
    spawnTetromino(type?: TetrominoType): void {
        // Get tetrominoType from param or generate random type from queue.
        let tetrominoType = type;
        if (!tetrominoType) this.emit('generateRandomType', (genType: TetrominoType) => tetrominoType = genType);
        // Create new tetromino.
        let tetromino = new Tetromino(this.scene, tetrominoType, this.getInactiveBlocks());
        // Check spawn is success
        if (tetromino.isSpawnSuccess) { // If spawn is success.
            // Set active tetromino with new tetromino.
            this.activeTetromino = tetromino;
            // Add tetromino ui to play field container.
            this.container.add(this.activeTetromino.container);
            // Check is lockable
            if (this.activeTetromino.isLockable()) {
                // If created is lockable (may be spawned top of play field.)
                // Start lock timer();
                this.startLockTimer();
            } else {
                // Normal state.
                // Move down one row immediately. - Tetris guide 2009 - 3.4
                this.activeTetromino.moveDown('autoDrop');
                if (this.activeTetromino.isLockable()) {
                    this.startLockTimer();
                }
            }
            // Start drop timer;
            this.restartAutoDropTimer();
        } else { // If spawn is fail, it means Block Out GAME OVER. - Tetris Guide 2009 Chapter 10.7
            // Destroy created tetromino.
            tetromino.destroy();
            // Emit game over event
            this.emit('gameOver', 'Block Out');
        }
        // Set can hold flag true.
        // You can only 1 time hold in 1 tetromino spawn.
        this.canHold = true;
    }

    /**
     * Get inactive block positions.
     */
    getInactiveBlocks(): ColRow[] {
        // Get all inactive tetromino blocks and aggregate.
        return this.inactiveTetrominos.map(tetromino => tetromino.getBlocks()).reduce((a, b) => a.concat(b), []);
    }

    /**
     * On input process.
     * @param {string} input - input value (ex. Z, X, C, UP, Down...)
     * @param {InputState} state - state (ex, PRESS -> HOLD -> HOLD -> RELEASE)
     */
    onInput(input: string, state: InputState) {
        // If active tetromino is not exists, ignore input.
        if (!this.activeTetromino) return;

        // PRESS or HOLD action.
        if (state == InputState.PRESS || state == InputState.HOLD) {
            switch (input) {
                case "left":
                    this.setLockTimer(this.activeTetromino.moveLeft(), true);
                    break;
                case "right":
                    this.setLockTimer(this.activeTetromino.moveRight(), true);
                    break;
                case "softDrop":
                    this.setLockTimer(this.activeTetromino.moveDown('softDrop'), true);
                    break;
            }
        }

        // Only PRESS action.
        if (state == InputState.PRESS) {
            switch (input) {
                case "clockwise":
                    this.setLockTimer(this.activeTetromino.rotate(true));
                    break;
                case "anticlockwise":
                    this.setLockTimer(this.activeTetromino.rotate(false));
                    break;
                case "hardDrop":
                    this.activeTetromino.hardDrop();
                    this.droppedRotateType = this.activeTetromino.rotateType;
                    this.lock();
                    // TODO: hard Drop effect animation
                    break;
                case "hold":
                    // If canHold flag is true and active tetromino is exists, do hold.
                    if (this.canHold && this.activeTetromino) {
                        const holdType = this.activeTetromino.type;
                        // Destroy active tetromino.
                        this.container.remove(this.activeTetromino.container);
                        this.activeTetromino.destroy();
                        this.activeTetromino = null;

                        // Do hold type and get released type.
                        this.emit('hold', holdType, (releasedType: TetrominoType) => {
                            // Spawn new tetromino with un held type.
                            this.spawnTetromino(releasedType);
                        });

                        // Set can hold flag false.
                        // You can only 1 time hold in 1 tetromino spawn.
                        this.canHold = false;
                    }
                    break;
            }
        }
    }

    /**
     * Clear line.
     * @param {Tetromino} lockedTetromino - locked tetromino.
     * @returns {number} Cleared line count.
     */
    clearLine(lockedTetromino: Tetromino) {
        // get rows for check clear line.
        let clearCheckRows = lockedTetromino.getBlocks()
            .map(colRow => colRow[1])
            .reduce((result, row) => {
                result[row] = 1;
                return result;
            }, {});

        let needClearRows = [];
        let inactiveBlocks = this.getInactiveBlocks();
        // get target of clear line rows.
        for (let key in clearCheckRows) {
            let row = Number(key);
            let numberOfRowBlocks = inactiveBlocks.filter(colRow => colRow[1] == row).length;
            if (numberOfRowBlocks >= CONST.PLAY_FIELD.COL_COUNT) needClearRows.push(row);
        }

        // call clear line method each tetromino.
        needClearRows.forEach(row => {
            let emptyTetrominos = this.inactiveTetrominos.filter(tetromino => tetromino.clearLine(row));
            // remove empty tetromino.
            emptyTetrominos.forEach(tetromino => {
                this.container.remove(tetromino.container);
                tetromino.destroy();
                this.inactiveTetrominos.splice(this.inactiveTetrominos.indexOf(tetromino), 1);
            });
        });

        return needClearRows.length;
    }

    /**
     * Lock tetromino.
     */
    lock() {
        // Stop lock timer.
        this.stopLockTimer();
        // If lockable active tetromino is not exist, stop function.
        if (!this.activeTetromino) return;
        if (!this.activeTetromino.isLockable()) return;
        // Stop auto drop timer.
        this.stopAutoDropTimer();
        // Inactive tetromino.
        let lockedTetromino = this.activeTetromino;
        lockedTetromino.inactive();
        this.inactiveTetrominos.push(lockedTetromino);
        this.activeTetromino = null;

        // Check locked Tetromino is inside buffer zone entire.
        // Row position is smaller then zero means buffer zone.
        if (lockedTetromino.getBlocks().every(colRow => colRow[1] < 0)) {
            // Lock Out Game Over.
            // Emit game over event
            this.emit('gameOver', 'Lock Out');
            return;
        }

        // clear line 
        // TODO: clear line delay and animation
        let clearedLineCount = this.clearLine(lockedTetromino);

        // Emit lock event.
        this.emit('lock',
            clearedLineCount,
            lockedTetromino.type,
            this.droppedRotateType,
            lockedTetromino.rotateType,
            lockedTetromino.lastMovement,
            lockedTetromino.lastKickDataIndex,
            lockedTetromino.dropCounter,
            lockedTetromino.getTSpinCornerOccupiedCount()
        );

        // ARE
        this.scene.time.delayedCall(CONST.PLAY_FIELD.ARE_MS, () => this.spawnTetromino(), [], this);
    }

    /**
     * Start auto drop timer.
     */
    startAutoDropTimer() {
        if (this.autoDropTimer) return;
        this.autoDropTimer = this.scene.time.addEvent({
            delay: this.autoDropDelay,
            callback: () => {
                // If active tetromino is lockable, start lock timer.
                if (this.activeTetromino &&
                    this.activeTetromino.moveDown('autoDrop') &&
                    this.activeTetromino.isLockable()
                ) {
                    // Set dropped rotate type.
                    this.droppedRotateType = this.activeTetromino.rotateType;
                    this.startLockTimer();
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    /**
     * Stop auto drop timer.
     */
    stopAutoDropTimer() {
        if (!this.autoDropTimer) return;
        this.autoDropTimer.destroy();
        this.autoDropTimer = null;
    }

    /**
     * Stop and start auto drop timer.
     */
    restartAutoDropTimer() {
        this.stopAutoDropTimer();
        this.startAutoDropTimer();
    }

    /**
     * Start lock timer.
     */
    startLockTimer() {
        if (this.activeTetromino) {
            // Lock tetromino after lock animation finished.
            this.activeTetromino.playLockAnimation(() => this.lock());
        }
    }

    /**
     * Stop lock timer.
     */
    stopLockTimer() {
        if (this.activeTetromino && this.activeTetromino.isPlayingLockAnimation()) {
            this.activeTetromino.stopLockAnimation();
        }
    }

    /**
     * setLockTimer
     * @param {boolean} moveSuccess Was successful move.
     * @param {boolean} setDroppedRotate Set dropped rotate.
     */
    setLockTimer(moveSuccess: boolean, setDroppedRotate?: boolean): void {
        // If tetromino move success.
        if (moveSuccess) {
            // If active tetromino is lockable.
            if (this.activeTetromino.isLockable()) {
                // Set dropped rotate type.
                if (setDroppedRotate) this.droppedRotateType = this.activeTetromino.rotateType;
                // Restart lock timer.
                this.stopLockTimer();
                this.startLockTimer();
            } else {
                // Stop lock timer.
                this.stopLockTimer();
            }
        }
    }
}