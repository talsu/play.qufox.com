import { PlayField } from "./objects/playField";
import { TetrominoBox } from "./objects/tetrominoBox";
import { TetrominoBoxQueue } from "./objects/tetrominoBoxQueue";
import { LevelIndicator } from "./objects/levelIndicator";
import { InputState, TetrominoType } from "./const/const";

export class Engine {
    private playField: PlayField;
    private holdBox: TetrominoBox;
    private queue: TetrominoBoxQueue;
    private levelIndicator: LevelIndicator;

    constructor(playField: PlayField, holdBox: TetrominoBox, queue: TetrominoBoxQueue, levelIndicator: LevelIndicator) {
        this.playField = playField;
        this.holdBox = holdBox;
        this.queue = queue;
        this.levelIndicator = levelIndicator;  
        this.playField.on('start', this.onPlayFieldStart.bind(this));
        this.playField.on('generateRandomType', this.onPlayFieldGenerateType.bind(this));
        this.playField.on('hold', this.onPlayFieldHold.bind(this));
    }

    onPlayFieldStart() {
        // Clear tetromino hold box.
        this.holdBox.clear();
        // Clear next tetromino queue.
        this.queue.clear();
    }

    onPlayFieldGenerateType(typeReceiver:(type: TetrominoType) => void) {
        if (typeReceiver) typeReceiver(this.queue.randomTypeGenerator());
    }

    onPlayFieldHold(type: TetrominoType, typeReceiver:(type: TetrominoType) => void) {
        if (typeReceiver) typeReceiver(this.holdBox.hold(type));
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