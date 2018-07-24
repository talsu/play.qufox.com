import { CONST, TetrominoType, RotateType, ColRow } from '../const/const';

export class Tetromino {
    private scene: Phaser.Scene;
    // private graphics: Phaser.GameObjects.Graphics;
    private col: number;
    private row: number;
    private deactiveDots: ColRow[];
    private blockedPositions: ColRow[];
    private ghostRowOffset: number;
    private rotateType: RotateType;

    public isSpwanSuccess: boolean;
    public container: Phaser.GameObjects.Container;
    public sprite: Phaser.GameObjects.Sprite;
    public type: TetrominoType;
    
    constructor(scene: Phaser.Scene, type: TetrominoType, blockedPositions?: ColRow[], col?:number, row?:number) {
        this.scene = scene;
        this.container = scene.add.container(0, 0);

        let tetrominoSize = CONST.TETROMINO.SIZE[type];
        this.container.width = CONST.PLAY_FIELD.BLOCK_SIZE * tetrominoSize[0];
        this.container.height = CONST.PLAY_FIELD.BLOCK_SIZE * tetrominoSize[1];

        // this.container.add(this.graphics);

        // Phaser.Actions.SetOrigin([this.container], 1, 1);

        this.type = type;
        this.rotateType = RotateType.UP;

        let initCol = col === undefined ? 3 : col;
        let initRow = row || 0;

        this.ghostRowOffset = 0;
        this.blockedPositions = blockedPositions || [];
        this.isSpwanSuccess = this.move(initCol, initRow);
        this.deactiveDots = null;

        this.sprite = this.scene.add.sprite(this.container.width / 2, this.container.height / 2, 'tetromino_' + this.type);
        this.container.add(this.sprite);
    }

    move(col:number, row:number):boolean {
        if (!this.isValidPosition(this.rotateType, col, row)) return false;
        
        this.row = row;
        this.col = col;
        this.container.x = this.col * CONST.PLAY_FIELD.BLOCK_SIZE;
        this.container.y = this.row * CONST.PLAY_FIELD.BLOCK_SIZE;
    
        this.ghostRowOffset = this.getGhostRowOffset();
    
        return true;
    }

    moveLeft():boolean { return this.move(this.col - 1, this.row); }
    
    moveRight():boolean { return this.move(this.col + 1, this.row); }

    moveUp():boolean { return this.move(this.col, this.row - 1); }

    moveDown():boolean { return this.move(this.col, this.row + 1); }

    hardDrop() { while (this.moveDown()) {} }

    isLocking():boolean {
        return !this.isValidPosition(this.rotateType, this.col, this.row + 1);
    }

    clearLine(row):boolean {
        // remove sprite
        this.container.removeAll();
        
        // remove row dots.
        this.deactiveDots
            .filter(colRow => row == (this.row + colRow[1]))
            .forEach((colRow) => this.deactiveDots.splice(this.deactiveDots.indexOf(colRow), 1));
        // pull down upper dots.
        this.deactiveDots
            .filter(colRow => row > (this.row + colRow[1]))
            .forEach(colRow => colRow[1] = colRow[1] + 1);


        // draw deactive dots
        let graphics = this.scene.add.graphics();
        graphics.fillStyle(CONST.TETROMINO.COLOR[this.type]);
        // graphics.fillStyle(CONST.TETROMINO.COLOR[type]);

        this.getDotOffsets().forEach(colRow => {
            graphics.fillRect(
                colRow[0] * CONST.PLAY_FIELD.BLOCK_SIZE,
                colRow[1] * CONST.PLAY_FIELD.BLOCK_SIZE,
                CONST.PLAY_FIELD.BLOCK_SIZE,
                CONST.PLAY_FIELD.BLOCK_SIZE);
        });
        this.container.add(graphics);
        // graphics.destroy();


        // if Tetromino is empty return true;
        return !this.deactiveDots.length;
    }

    deactive() {
        this.deactiveDots = this.getDotOffsets().map(colRow => [colRow[0], colRow[1]]);
    }

    /*
        https://tetris.wiki/SRS
    */
    rotate(isClockwise:boolean):boolean {
        let index = CONST.TETROMINO.ROTATE_SEQ.indexOf(this.rotateType);
        index += isClockwise ? 1 : -1;
        index = (CONST.TETROMINO.ROTATE_SEQ.length + index) % CONST.TETROMINO.ROTATE_SEQ.length;
        let newRotateType = CONST.TETROMINO.ROTATE_SEQ[index];

        let offsets = null;
        switch (this.type) {
            case "O": offsets = []; break;
            case "I": offsets = CONST.TETROMINO.I_KICK_DATA[this.rotateType + '>' + newRotateType]; break;
            default: offsets = CONST.TETROMINO.JLSTZ_KICK_DATA[this.rotateType + '>' + newRotateType]; break;
        }

        return !offsets.length || offsets.some(colRow => {
            let newCol = this.col + colRow[0];
            let newRow = this.row - colRow[1]; // kickData Y is opposite Row.
            if (this.isValidPosition(newRotateType, newCol, newRow)) {
                this.rotateType = newRotateType;
                this.move(newCol, newRow);
                
                switch (this.rotateType) {
                    case RotateType.UP: this.sprite.angle = 0; break;
                    case RotateType.RIGHT: this.sprite.angle = 90; break;
                    case RotateType.DOWN: this.sprite.angle = 180; break;
                    case RotateType.LEFT: this.sprite.angle = 270; break;
                }
                
                return true;
            }
        });
    }

    getDotOffsets (rotateType?:RotateType): ColRow[] {
        return this.deactiveDots || CONST.TETROMINO.DOTS[this.type][rotateType || this.rotateType];
    }
    
    getDots (rotateType?:RotateType, col?:number, row?:number): ColRow[] {
        let colBase = (col === undefined) ? this.col : col;
        let rowBase = (row === undefined) ? this.row : row;
        return this.getDotOffsets(rotateType).map(colRow => {
          return [colBase + colRow[0], rowBase + colRow[1]];
        });
    }

    getGhostRowOffset(): number {
        let row = this.row;
        while (this.isValidPosition(this.rotateType, this.col, row)) { row++; }
        let offset = row - this.row - 1;
        let minOffset = null;
        if (this.rotateType == RotateType.RIGHT || this.rotateType == RotateType.LEFT){
          minOffset = 3;
          if (this.type == TetrominoType.I) minOffset = 4;
        } else {
          minOffset = 2;
          if (this.type == TetrominoType.I) minOffset = 1;
        }
        return offset < minOffset ? 0 : offset;
    }

    isValidPosition (rotateType:RotateType, col:number, row:number): boolean {
        return this.getDots(rotateType, col, row).every(colRow => {
            let newCol = colRow[0];
            let newRow = colRow[1];
            if (this.blockedPositions.some(colRow => colRow[0] === newCol && colRow[1] === newRow)) return false;
            if (newCol < 0 || CONST.PLAY_FIELD.COL_COUNT <= newCol) return false;
            if (newRow < 0 || CONST.PLAY_FIELD.ROW_COUNT <= newRow) return false;
            return true;
        });
    }

    update() {
        // this. ();
        // this.container.angle += 1;
    }
}