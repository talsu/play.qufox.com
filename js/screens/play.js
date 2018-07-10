game.PlayScreen = me.ScreenObject.extend({
  /**
   *  action to perform on state change
   */
  onResetEvent: function() {
    me.game.world.addChild(new me.ColorLayer("background", "#000000"), 0);

    // reset the score
    game.data.score = 0;

    // Add our HUD to the game world, add it last so that this is on top of the rest.
    // Can also be forced by specifying a "Infinity" z value to the addChild function.
    this.HUD = new game.HUD.Container();
    me.game.world.addChild(this.HUD);
    me.game.world.addChild(me.pool.pull("playField", 500, 250));
    // me.game.world.addChild(me.pool.pull("block", 0, 0));

    me.input.bindKey(me.input.KEY.LEFT, "left");
    me.input.bindKey(me.input.KEY.RIGHT, "right");
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
  },

  /**
   *  action to perform when leaving this screen (state change)
   */
  onDestroyEvent: function() {

    me.input.unbindKey(me.input.KEY.LEFT);
    me.input.unbindKey(me.input.KEY.RIGHT);
    me.input.unbindKey(me.input.KEY.A);
    me.input.unbindKey(me.input.KEY.D);

    // remove the HUD from the game world
    me.game.world.removeChild(this.HUD);
  }
});
