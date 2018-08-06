import { CONST, TetrominoType, ColRow } from "../const/const";
import { Tetromino } from "./tetromino";
import { TetrominoBox } from "../objects/tetrominoBox";
import { TetrominoBoxQueue } from "../objects/tetrominoBoxQueue";

export class PlayField {
    private scene: Phaser.Scene;
    private holdBox: TetrominoBox;
    private queue: TetrominoBoxQueue;
    private deactiveTetrominos: Tetromino[];
    private activeTetromino: Tetromino;
    private canHold: boolean;

    public container: Phaser.GameObjects.Container;
    autoDropTimer: Phaser.Time.TimerEvent;
    
    constructor(scene: Phaser.Scene, holdBox: TetrominoBox, queue: TetrominoBoxQueue,  x: number, y: number, width:number, height:number) {
        this.scene = scene;
        this.holdBox = holdBox;
        this.queue = queue;
        this.container = scene.add.container(x, y);
        this.container.width = width;
        this.container.height = height;

        let background = scene.add.graphics();
        background.fillStyle(0x000000, 0.6);
        background.fillRect(0, 0, this.container.width, this.container.height);

        background.lineStyle(1, 0xEEEEEE, 1.0);
        background.strokeRect(0, 0, this.container.width, this.container.height);
        this.container.add(background);

        this.start();
    }

    start() {
        this.activeTetromino = null;
        this.deactiveTetrominos = [];
        this.holdBox.clear();
        this.queue.clear();
        this.spawnTetromino();
        this.startAutoDropTimer();
    }

    spawnTetromino(type?:TetrominoType): void {
        let tetrominotype = type || this.queue.randomTypeGenerator();
        let tetromino = new Tetromino(this.scene, tetrominotype, this.getDeactiveDots());
        if (tetromino.isSpwanSuccess) {
            this.activeTetromino = tetromino;
            this.container.add(this.activeTetromino.container);
        } else {
            tetromino.destroy();
            console.log('Game Over');
            if (this.activeTetromino){
                this.container.remove(this.activeTetromino.container);
                this.activeTetromino.destroy();
            }
            this.deactiveTetrominos.forEach(tetromino => {
                this.container.remove(tetromino.container);
                tetromino.destroy();
            });
            this.start();
        }
        this.canHold = true;
    }

    getDeactiveDots(): ColRow[] {
        return this.deactiveTetrominos.map(tetromino => tetromino.getDots()).reduce((a, b) => a.concat(b),[]);
    }

    onInput(direction: string, state: string) {
        if (!this.activeTetromino) return;
    
        if (state == "press" || state == "hold") {
            switch (direction) {
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
    
        if (state == "press") {
            switch (direction) {
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
                if (this.canHold && this.activeTetromino) {
                    console.log("hold");
                    let unholded = this.holdBox.hold(this.activeTetromino.type);
        
                    this.container.remove(this.activeTetromino.container);
                    this.activeTetromino.destroy();
                    this.activeTetromino = null;
                    this.spawnTetromino(unholded);
                    this.restartAutoDropTimer();
        
                    this.canHold = false;
                }
                break;
            }
        }
     }

    clearLine(droppedTetromino:Tetromino) {
        // get rows for check clear line.
        let clearCheckRows = droppedTetromino.getDots()
            .map(colRow => colRow[1])
            .reduce((result, row) => {result[row] = 1; return result;}, {});

        let needClearRows = [];
        let deactiveDots = this.getDeactiveDots();
        // get target of clear line rows.
        for (let key in clearCheckRows) {
            let row = Number(key);
            let numberOfRowDots = deactiveDots.filter(colRow => colRow[1] == row).length;
            if (numberOfRowDots >= CONST.PLAY_FIELD.COL_COUNT) needClearRows.push(row);
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

    lock() {
        this.stopLockTimer();
        if (!this.activeTetromino) return;
        if (!this.activeTetromino.isLockable()) return;
        this.stopAutoDropTimer();
        let droppedTetromino = this.activeTetromino;
        droppedTetromino.deactive();
        this.deactiveTetrominos.push(droppedTetromino);
        this.activeTetromino = null;

        // clear line [TODO] clear line dealay and animation
        this.clearLine(droppedTetromino);

        // ARE
        this.scene.time.delayedCall(CONST.PLAY_FIELD.ARE_MS, () => {
            this.spawnTetromino();
            this.startAutoDropTimer();
        }, [], this);
    }

    startAutoDropTimer(interval?: number) {
        if (this.autoDropTimer) return;
        this.autoDropTimer = this.scene.time.addEvent({
            delay: interval || CONST.PLAY_FIELD.GRAVITY_MS,
            callback: () => {
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
    
    stopAutoDropTimer() {
        if (!this.autoDropTimer) return;
        this.scene.time.addEvent
        this.autoDropTimer.destroy();
        this.autoDropTimer = null;
    }
    
    restartAutoDropTimer(interval?: number) {
        this.stopAutoDropTimer();
        this.startAutoDropTimer(interval);
    }
    
    startLockTimer() {
        if (this.activeTetromino) {
            this.activeTetromino.playLockAnimation(() => this.lock());
        }
    }
    
    stopLockTimer() {
        if (this.activeTetromino && this.activeTetromino.isPlayingLockAnimation()) {
            this.activeTetromino.stopLockAnimation();
        }
    }

    setLockTimer(moveSuccess: boolean): void {
        if (moveSuccess) {
            if (this.activeTetromino.isLockable()){
                this.stopLockTimer();
                this.startLockTimer();
            } else { 
                this.stopLockTimer();
            }
        }
    }
}