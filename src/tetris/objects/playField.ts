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
    private dasFlags: any;
    private autoDropTimer: number;
    private lockTimer: number;

    public container: Phaser.GameObjects.Container;
    
    constructor(scene: Phaser.Scene, holdBox: TetrominoBox, queue: TetrominoBoxQueue,  x: number, y: number, width:number, height:number) {
        this.scene = scene;
        this.holdBox = holdBox;
        this.queue = queue;
        this.container = scene.add.container(x, y);
        this.container.width = width;
        this.container.height = height;
        console.log(height);

        let border = scene.add.graphics();
        border.lineStyle(1, 0xEEEEEE, 1.0);
        border.strokeRect(0, 0, this.container.width, this.container.height);
        this.container.add(border);

        this.start();
    }

    start() {
        this.activeTetromino = null;
        this.deactiveTetrominos = [];
        this.queue.clear();
        this.spawnTetromino();
        this.startAutoDropTimer();
    }

    update() :void {
        // this.draw();
        if (this.activeTetromino) this.activeTetromino.update();
    }
    
    spawnTetromino(type?:TetrominoType): void {
        let tetrominotype = type || this.queue.randomTypeGenerator();
        let tetromino = new Tetromino(this.scene, tetrominotype, this.getDeactiveDots());
        if (tetromino.isSpwanSuccess) {
            this.activeTetromino = tetromino;
            this.container.add(this.activeTetromino.container);
        } else {
            console.log('Game Over');
            if (this.activeTetromino) this.container.remove(this.activeTetromino.container);
            this.deactiveTetrominos.forEach(tetromino => this.container.remove(tetromino.container));
            this.start();
        }
        this.canHold = true;
    }

    getDeactiveDots(): ColRow[] {
        return this.deactiveTetrominos.map(tetromino => tetromino.getDots()).reduce((a, b) => a.concat(b),[]);
    }
    
    /*
        https://tetris.wiki/DAS
    */
    chargeDAS(direction:string, isPressed:boolean, time:number, init?:number, repeat?:number) {
        if (!this.dasFlags) this.dasFlags = {};
        if (!this.dasFlags[direction]) this.dasFlags[direction] = 0;
        let oldValue = this.dasFlags[direction];
        if (isPressed) this.dasFlags[direction] += time;
        else this.dasFlags[direction] = 0;
        let newValue = this.dasFlags[direction];

        if (oldValue == 0 && newValue) this.onInput(direction, "press");
        if (oldValue && newValue == 0) this.onInput(direction, "release");

        if (newValue == 0) return;

        let initDelay = init || CONST.PLAY_FIELD.DAS_MS;
        let repeatDelay = repeat || CONST.PLAY_FIELD.AR_MS;
        let rOld = Math.floor((oldValue - initDelay) / repeatDelay);
        let rNew = Math.floor((newValue - initDelay) / repeatDelay);

        if (rNew >= 0 && rOld < rNew) {
            if (rOld < 0) rOld = -1;
            for (let i = 0; i < (rNew - rOld); ++i) {
                this.onInput(direction, "hold");
            }
        }
    }

    onInput(direction: string, state: string) {
        if (!this.activeTetromino) return;
    
        if (state == "press" || state == "hold") {
            switch (direction) {
                case "left":
                if (this.activeTetromino.moveLeft() && this.activeTetromino.isLocking()) {
                    this.restartLockTimer();
                }
                break;
                case "right":
                if (this.activeTetromino.moveRight() && this.activeTetromino.isLocking()) {
                    this.restartLockTimer();
                }
                break;
                case "softDrop":
                if (this.activeTetromino.moveDown()) {
                    this.restartAutoDropTimer();
                    if (this.activeTetromino.isLocking()) {
                    this.startLockTimer();
                    }
                }
                break;
            }
        }
    
        if (state == "press") {
            switch (direction) {
                case "clockwise":
                if (this.activeTetromino.rotate(true) && this.activeTetromino.isLocking()) {
                    this.restartLockTimer();
                }
                break;
                case "anticlockwise":
                if (this.activeTetromino.rotate(false) && this.activeTetromino.isLocking()) {
                    this.restartLockTimer();
                }
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
            emptyTetrominos.forEach(tetromino => this.container.remove(tetromino.container));
            emptyTetrominos.forEach(tetromino => this.deactiveTetrominos.splice(this.deactiveTetrominos.indexOf(tetromino), 1));
        });

    }

    lock() {
        this.stopLockTimer();
        if (!this.activeTetromino) return;
        if (!this.activeTetromino.isLocking()) return;
        this.stopAutoDropTimer();
        let droppedTetromino = this.activeTetromino;
        droppedTetromino.deactive();
        this.deactiveTetrominos.push(droppedTetromino);
        this.activeTetromino = null;

        // clear line [TODO] clear line dealay and animation
        this.clearLine(droppedTetromino);

        // ARE
        setTimeout(() => {
            this.spawnTetromino();
            this.startAutoDropTimer();
        }, CONST.PLAY_FIELD.ARE_MS);
    }

    startAutoDropTimer(interval?: number) {
        if (this.autoDropTimer) return;
        this.autoDropTimer = setInterval(() => {
            if (this.activeTetromino) {
                this.activeTetromino.moveDown();
                if (this.activeTetromino.isLocking()) this.startLockTimer();
            }
        }, interval || CONST.PLAY_FIELD.GRAVITY_MS);
    }
    
    stopAutoDropTimer() {
        if (!this.autoDropTimer) return;
        clearInterval(this.autoDropTimer);
        this.autoDropTimer = null;
    }
    
    restartAutoDropTimer(interval?: number) {
        this.stopAutoDropTimer();
        this.startAutoDropTimer(interval);
    }
    
    startLockTimer() {
        if (this.lockTimer) return;
        this.lockTimer = setTimeout(() => this.lock(), CONST.PLAY_FIELD.LOCK_DELAY_MS);
    }
    
    stopLockTimer() {
        if (!this.lockTimer) return;
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
    }
    
    restartLockTimer() {
        this.stopLockTimer();
        this.startLockTimer();
    }
}