game.PlayScreen = me.ScreenObject.extend({
  /**
   *  action to perform on state change
   */
  onResetEvent: function() {
    me.game.world.addChild(new me.ColorLayer("background", "#ffffff"), 0);

    // reset the score
    game.data.score = 0;

    // Add our HUD to the game world, add it last so that this is on top of the rest.
    // Can also be forced by specifying a "Infinity" z value to the addChild function.
    this.HUD = new game.HUD.Container();
    me.game.world.addChild(this.HUD);

    let size = game.PlayField.BLOCK_SIZE;

    let holdBox = me.pool.pull("holdTetrominoBox", size, size, 6 * size, 4 * size);
    me.game.world.addChild(holdBox);

    let playFieldWidth = game.PlayField.COL_COUNT * size;
    let playFieldHeight = game.PlayField.ROW_COUNT * size

    let tetrominoQueue = me.pool.pull("tetrominoBoxQueue", holdBox.width + playFieldWidth + (2*size), 0, 4);

    let playField = me.pool.pull("playField", holdBox.width + (2*size), size, playFieldWidth, playFieldHeight, holdBox, tetrominoQueue);

    me.game.world.addChild(playField);

    me.game.world.addChild(tetrominoQueue);

    me.input.bindKey(me.input.KEY.LEFT, "left");
    me.input.bindKey(me.input.KEY.RIGHT, "right");
    me.input.bindKey(me.input.KEY.CTRL, "anticlockwise");
    me.input.bindKey(me.input.KEY.UP, "clockwise");
    me.input.bindKey(me.input.KEY.SPACE, "hardDrop");
    me.input.bindKey(me.input.KEY.DOWN, "softDrop");
    me.input.bindKey(me.input.KEY.Z, "anticlockwise");
    me.input.bindKey(me.input.KEY.X, "clockwise");
    me.input.bindKey(me.input.KEY.C, "hold");
  },

  /**
   *  action to perform when leaving this screen (state change)
   */
  onDestroyEvent: function() {

    me.input.unbindKey(me.input.KEY.LEFT);
    me.input.unbindKey(me.input.KEY.RIGHT);
    me.input.unbindKey(me.input.KEY.CTRL);
    me.input.unbindKey(me.input.KEY.UP);
    me.input.unbindKey(me.input.KEY.SPACE);
    me.input.unbindKey(me.input.KEY.DOWN);
    me.input.unbindKey(me.input.KEY.Z);
    me.input.unbindKey(me.input.KEY.X);
    me.input.unbindKey(me.input.KEY.C);

    // remove the HUD from the game world
    me.game.world.removeChild(this.HUD);
  }
});
