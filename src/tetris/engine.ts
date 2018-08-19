import {PlayField} from "./objects/playField";
import {TetrominoBox} from "./objects/tetrominoBox";
import {TetrominoBoxQueue} from "./objects/tetrominoBoxQueue";
import {LevelIndicator} from "./objects/levelIndicator";
import {InputState, TetrominoType, RotateType, CONST} from "./const/const";

/**
 * Tetris game engine.
 */
export class Engine {
    private playField: PlayField;
    private holdBox: TetrominoBox;
    private queue: TetrominoBoxQueue;
    private levelIndicator: LevelIndicator;
    private isBackToBackChain: boolean = false;

    private level: number;
    private score: number;
    private clearedLines: number;
    private nextLevelRequireClearedLines: number;

    private comboCount: number = -1;

    constructor(playField: PlayField, holdBox: TetrominoBox, queue: TetrominoBoxQueue, levelIndicator: LevelIndicator) {
        this.playField = playField;
        this.holdBox = holdBox;
        this.queue = queue;
        this.levelIndicator = levelIndicator;
        this.playField.on('start', this.start.bind(this));
        this.playField.on('gameOver', this.gameOver.bind(this));
        this.playField.on('generateRandomType', this.onPlayFieldGenerateType.bind(this));
        this.playField.on('hold', this.onPlayFieldHold.bind(this));
        this.playField.on('lock', this.onLock.bind(this));
        this.clear();
    }

    /**
     * Clear - reset stats
     */
    clear() {
        this.level = 1;
        this.nextLevelRequireClearedLines = this.level * 5;
        this.score = 0;
        this.clearedLines = 0;
    }

    /**
     * Start game.
     */
    start() {
        // Clear stats.
        this.clear();
        // Clear tetromino hold box.
        this.holdBox.clear();
        // Clear next tetromino queue.
        this.queue.clear();
        // Clear Play field.
        this.playField.clear();
        // Clear level indicator.
        this.levelIndicator.clear();

        // Set level indicator.
        this.levelIndicator.setLevel(this.level);
        this.levelIndicator.setScore(this.score);

        // Spawn tetromino.
        this.playField.spawnTetromino();
    }

    /**
     * Generate tetromino type request from play field.
     * get type from queue, and pass type to play field.
     * @param typeReceiver Generated tetromino type receive callback.
     */
    onPlayFieldGenerateType(typeReceiver: (type: TetrominoType) => void) {
        if (typeReceiver) typeReceiver(this.queue.randomTypeGenerator());
    }

    /**
     * Hold tetromino type request from play field.
     * insert type to hold box and get released type, and pass released type to play field.
     * @param type Tetromino type to hold.
     * @param typeReceiver Released type receive callback.
     */
    onPlayFieldHold(type: TetrominoType, typeReceiver: (type: TetrominoType) => void) {
        if (typeReceiver) typeReceiver(this.holdBox.hold(type));
    }

    /**
     * Update stats when line cleared.
     * @param {number} clearedLineCount - Cleared line count.
     * @param {TetrominoType} tetrominoType - Tetromino type.
     * @param {RotateType} droppedRotateType - Rotate type when dropped.
     * @param {RotateType} lockedRotateType - Rotate type when locked.
     * @param {string} movement - Last movement.
     * @param {number} kickDataIndex - Kick data index. (how many kick occurred.)
     * @param {{ softDrop: number, hardDrop: number, autoDrop: number }} dropCounter - Drop count data.
     * @param {{ pointSide: number, flatSide: number }} tSpinCornerOccupiedCount - T tetromino corner occupied count.
     */
    onLock(
        clearedLineCount: number,
        tetrominoType: TetrominoType,
        droppedRotateType: RotateType,
        lockedRotateType: RotateType,
        movement: string,
        kickDataIndex: number,
        dropCounter: { softDrop: number, hardDrop: number, autoDrop: number },
        tSpinCornerOccupiedCount: { pointSide: number, flatSide: number }
    ) {
        // Is T-Spin
        let isTSpin =
            tetrominoType == TetrominoType.T &&
            droppedRotateType != lockedRotateType &&
            movement == 'rotate' &&
            tSpinCornerOccupiedCount.pointSide + tSpinCornerOccupiedCount.flatSide > 2;

        // Is T-Spin mini
        let isTSpinMini =
            isTSpin &&
            tSpinCornerOccupiedCount.pointSide < 2 &&
            kickDataIndex < 3;

        // Is Back to Back
        let isBackToBack = false;
        if (isTSpin || clearedLineCount) {
            let backToBackChain = isTSpin || clearedLineCount == 4;
            isBackToBack = this.isBackToBackChain && backToBackChain;
            this.isBackToBackChain = backToBackChain;
        }

        // Combine action segment.
        let actionNameArray = [];
        if (isTSpin) actionNameArray.push('T-Spin');
        if (isTSpinMini) actionNameArray.push('Mini');
        if (clearedLineCount) actionNameArray.push(['Single', 'Double', 'Triple', 'Tetris'][clearedLineCount - 1]);

        // Create action name and get base score.
        let actionName = null;
        let scoreBase = 0;
        if (actionNameArray.length) {
            actionName = actionNameArray.join(' ');
            scoreBase = CONST.SCORE[actionName] || 0;
            if (!scoreBase) console.error(`Unexpected action - ${actionName}`);
        }

        // Add action score.
        if (scoreBase) {
            let score = scoreBase * (isBackToBack ? 1.5 : 1) * this.level;
            this.score += score;
            const actionFullName = `${isBackToBack ? 'Back to Back ' : ''}${actionName}`;
            this.levelIndicator.setAction(actionFullName);
            console.log(`${actionFullName} - ${score} (${scoreBase}${isBackToBack ? ' x 1.5' : ''} x ${this.level})`);
        }

        // Add combo score.
        if (clearedLineCount) this.comboCount++;
        else this.comboCount = -1;

        this.levelIndicator.setCombo(this.comboCount);

        if (this.comboCount > 0) {
            const comboScore = 50 * this.comboCount * this.level;
            this.score += comboScore;
            console.log(`Combo ${this.comboCount} - ${comboScore} (50 x ${this.comboCount} x ${this.level})`);
        }

        // Add drop score.
        this.score += dropCounter.softDrop; // Soft drop is 1 point per cell.
        this.score += dropCounter.hardDrop * 2; // Hard drop is 2 point per cell.

        // Calculate level.
        if (actionName) {
            let lineCount = CONST.LINE_COUNT[actionName];
            if (isBackToBack) lineCount = Math.ceil(lineCount * 1.5);
            this.addLineCount(lineCount);
        }

        // Update indicator.
        this.levelIndicator.setLevel(this.level);
        this.levelIndicator.setScore(this.score);
    }

    /**
     * Add cleared line count and level up.
     * @param {number} count - Cleared line count.
     */
    addLineCount(count: number) {
        this.clearedLines += count;
        if (this.clearedLines >= this.nextLevelRequireClearedLines) {
            let oldLevel = this.level;
            while (true) {
                this.level++;
                this.nextLevelRequireClearedLines += this.level * 5;
                if (this.clearedLines < this.nextLevelRequireClearedLines) break;
            }
            console.log(`level up ${oldLevel} -> ${this.level}`);
            this.levelIndicator.setLevel(this.level);
        }
    }

    /**
     * Game over. emit from play field, when can not create tetromino anymore.
     */
    gameOver() {
        console.log('Game Over');

        // TODO: Show game over screen and score.
        this.start();
    }

    /**
     * on input
     * @param direction direction
     * @param state key state - press, hold, release
     */
    onInput(direction: string, state: InputState) {
        this.playField.onInput(direction, state);
    }
}