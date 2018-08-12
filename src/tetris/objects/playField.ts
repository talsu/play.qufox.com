import { CONST, TetrominoType, ColRow, InputState } from "../const/const";
import { ObjectBase } from './objectBase';
import { Tetromino } from "./tetromino";
import { TetrominoBox } from "./tetrominoBox";
import { TetrominoBoxQueue } from "./tetrominoBoxQueue";

/**
 * Play field
 */
export class PlayField extends ObjectBase {
    private deactiveTetrominos: Tetromino[];
    private activeTetromino: Tetromino;
    private canHold: boolean;
    private container: Phaser.GameObjects.Container;
    private autoDropTimer: Phaser.Time.TimerEvent;
    
    constructor(scene: Phaser.Scene, x: number, y: number, width:number, height:number) {
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
     * Start game.
     */
    start() {
        // Clear active tetromino.
        this.activeTetromino = null;
        // Clear deactive tetrominos.
        this.deactiveTetrominos = [];
        // Emit start event.
        this.emit('start');
        // Spawn Tetromino.
        this.spawnTetromino();
    }

    /**
     * Spawn new tetromino.
     * @param {TetrominoType} type - Tetromino type.
     */
    spawnTetromino(type?:TetrominoType): void {
        // Get tetrominoType from param or generate random type from queue.
        let tetrominotype = type;
        if (!tetrominotype) this.emit('generateRandomType', (genType:TetrominoType) => {tetrominotype = genType});
        // Create new tetromino.
        let tetromino = new Tetromino(this.scene, tetrominotype, this.getDeactiveBlocks());
        // Check spwan is success
        if (tetromino.isSpawnSuccess) { // If swpan is success.
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
                // Restart auto drop timer.
                this.restartAutoDropTimer();
            }
        } else { // If swpan is fail, it means GAME OVER.
            this.emit('gameOver');
            console.log('Game Over');
            // Destroy created tetromino.
            tetromino.destroy();
            // Destroy active tetromino.
            if (this.activeTetromino){
                this.container.remove(this.activeTetromino.container);
                this.activeTetromino.destroy();
            }
            // Destory all deactive tetrominos.
            this.deactiveTetrominos.forEach(tetromino => {
                this.container.remove(tetromino.container);
                tetromino.destroy();
            });
            // [TODO] Show game over screen and score.
            // Start new game.
            this.start();
        }
        // Set can hold flag true.
        // You can only 1 time hold in 1 tetromino spwan.
        this.canHold = true;
    }

    /**
     * Get deactive block positions.
     */
    getDeactiveBlocks(): ColRow[] {
        // Get all deactive tetromino blocks and aggregate.
        return this.deactiveTetrominos.map(tetromino => tetromino.getBlocks()).reduce((a, b) => a.concat(b),[]);
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
                this.setLockTimer(this.activeTetromino.moveLeft());
                break;
                case "right":
                this.setLockTimer(this.activeTetromino.moveRight());
                break;
                case "softDrop":
                this.setLockTimer(this.activeTetromino.moveDown());
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
                this.lock();
                // [TODO] hard Drop effect animation
                break;
                case "hold":
                // If canHold flag is true and active tetromino is exists, do hold.
                if (this.canHold && this.activeTetromino) {
                    const holdType = this.activeTetromino.type;
                    // Destroy active tetromino.
                    this.container.remove(this.activeTetromino.container);
                    this.activeTetromino.destroy();
                    this.activeTetromino = null;
                    
                    // Do hold type and get unholded type.
                    this.emit('hold', holdType, (unholdedType: TetrominoType) => {
                        // Spwan new tetromino with un holded type.
                        this.spawnTetromino(unholdedType);
                    });
        
                    // Set can hold flag false.
                    // You can only 1 time hold in 1 tetromino spwan.
                    this.canHold = false;
                }
                break;
            }
        }
     }

    /**
     * Clear line.
     * @param {Tetromino} lockedTetromino - locked tetromino.
     */
    clearLine(lockedTetromino:Tetromino) {
        // get rows for check clear line.
        let clearCheckRows = lockedTetromino.getBlocks()
            .map(colRow => colRow[1])
            .reduce((result, row) => {result[row] = 1; return result;}, {});

        let needClearRows = [];
        let deactiveBlocks = this.getDeactiveBlocks();
        // get target of clear line rows.
        for (let key in clearCheckRows) {
            let row = Number(key);
            let numberOfRowBlocks = deactiveBlocks.filter(colRow => colRow[1] == row).length;
            if (numberOfRowBlocks >= CONST.PLAY_FIELD.COL_COUNT) needClearRows.push(row);
        }

        // call clear line method each tetromino.
        needClearRows.forEach(row => {
            let emptyTetrominos = this.deactiveTetrominos.filter(tetromino => tetromino.clearLine(row));
            // remove empty tetromino.
            emptyTetrominos.forEach(tetromino => {
                this.container.remove(tetromino.container);
                tetromino.destroy();
                this.deactiveTetrominos.splice(this.deactiveTetrominos.indexOf(tetromino), 1);
            });
        });

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
        // Deactive tetromino.
        let lockedTetromino = this.activeTetromino;
        lockedTetromino.deactive();
        this.deactiveTetrominos.push(lockedTetromino);
        this.activeTetromino = null;

        // clear line 
        // [TODO] clear line dealay and animation
        this.clearLine(lockedTetromino);

        // ARE
        this.scene.time.delayedCall(CONST.PLAY_FIELD.ARE_MS, () => this.spawnTetromino(), [], this);
    }

    /**
     * Start auto drop timer.
     * @param {number} interval - Auto drop interval. (ms)
     */
    startAutoDropTimer(interval?: number) {
        if (this.autoDropTimer) return;
        this.autoDropTimer = this.scene.time.addEvent({
            delay: interval || CONST.PLAY_FIELD.GRAVITY_MS,
            callback: () => {
                // If active tetromino is lockable, start lock timer.
                if (this.activeTetromino && 
                    this.activeTetromino.moveDown() &&
                    this.activeTetromino.isLockable()
                ) {
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
        this.scene.time.addEvent
        this.autoDropTimer.destroy();
        this.autoDropTimer = null;
    }
    
    /**
     * Stop and start auto drop timer.
     * @param {number} interval - Auto drop interval. (ms)
     */
    restartAutoDropTimer(interval?: number) {
        this.stopAutoDropTimer();
        this.startAutoDropTimer(interval);
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
     * @param {boolean} moveSuccess 
     */
    setLockTimer(moveSuccess: boolean): void {
        // If tetromino move success.
        if (moveSuccess) {
            // If active teromino is lockable.
            if (this.activeTetromino.isLockable()){
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