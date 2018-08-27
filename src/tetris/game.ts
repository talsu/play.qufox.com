/**
 * @author       talsu  <talsu84@gmail.com>
 * @copyright    2018 talsu.net
 * @license      MIT
 */

/// <reference path="../phaser.d.ts"/>

import "phaser";
import {MainScene} from "./scenes/mainScene";
import {CONST, getBlockSize} from "./const/const";

// main game configuration
const config: GameConfig = {
    width: getBlockSize() * CONST.SCREEN.COL_COUNT,
    height: getBlockSize() * CONST.SCREEN.ROW_COUNT,
    type: Phaser.AUTO,
    parent: "game",
    scene: MainScene,
    physics: {
        default: "arcade",
        arcade: {
            gravity: {y: 200}
        }
    }
};

// game class
export class Game extends Phaser.Game {
    constructor(config: GameConfig) {
        super(config);
    }
}

// when the page is loaded, create our game instance
window.onload = () => {
    new Game(config);
};
