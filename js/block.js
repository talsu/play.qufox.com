game.Block = me.Entity.extend({
  init : function (x, y) {
    this._super(me.Entity, "init", [0, 0, { width: 60, height: 60 }]);


    this.dotArray = [{row:0, col:1}, {row:1, col:1}, {row:2, col:1}, {row:2, col:0}]; // J

    this.setPosition(0, 0);

    this.dropVelocity = 20;

    // this.renderable = new (me.Renderable.extend({
    //     init : function () {
    //         this._super(me.Renderable, "init", [0, 0, 60, 60]);
    //     },
    //     destroy : function () {},
    //     draw : function (renderer) {
    //         var color = renderer.getColor();
    //         renderer.setColor('#5EFF7E');
    //         renderer.drawShape(new me.Polygon(0, 0, [
    //           new me.Vector2d(20, 0),
    //           new me.Vector2d(40, 0),
    //           new me.Vector2d(40, 60),
    //           new me.Vector2d(0, 60),
    //           new me.Vector2d(0, 40),
    //           new me.Vector2d(20, 40)
    //         ]));
    //         renderer.setColor(color);
    //
    //     },
    //     update: function() {
    //       return false;
    //     }
    // }));
    // this.alwaysUpdate = true;


    this.velx = 450;
    this.maxX = me.game.viewport.width - this.width;

    this.keyLeftPressScala = 0;
    this.keyRightPressScala = 0;
  },
  draw : function (renderer) {
      var color = renderer.getColor();
      renderer.setColor('#5EFF7E');
      this.dotArray.forEach(dot => {
        renderer.fillRect(
          dot.col * game.PlayField.BLOCK_SIZE,
          dot.row * game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE);
      });
      // renderer.drawShape(new me.Polygon(0, 0, [
      //   new me.Vector2d(20, 0),
      //   new me.Vector2d(40, 0),
      //   new me.Vector2d(40, 60),
      //   new me.Vector2d(0, 60),
      //   new me.Vector2d(0, 40),
      //   new me.Vector2d(20, 40)
      // ]));
      renderer.setColor(color);

  },
  setPosition: function(row, col) {
    for (var i = 0;i < this.dotArray.length; ++i) {
      var newRow = row + this.dotArray[i].row;
      var newCol = col + this.dotArray[i].col;
      if (newRow < 0 || game.PlayField.ROW_COUNT <= newRow) return; // cannot setPosition
      if (newCol < 0 || game.PlayField.COL_COUNT <= newCol) return; // cannot setPosition
    }

    this.row = Math.min(Math.max(0, row), game.PlayField.ROW_COUNT);
    this.col = Math.min(Math.max(0, col), game.PlayField.COL_COUNT);

    this.pos.x = this.col * game.PlayField.BLOCK_SIZE;
    this.pos.y = this.row * game.PlayField.BLOCK_SIZE;
  },
  update : function (time) {
    if (me.input.isKeyPressed("left")) {
      if (!this.keyLeftPressScala) this.setPosition(this.row, this.col - 1);
      this.keyLeftPressScala += time;
    }

    if (me.input.isKeyPressed("right")) {
      if (!this.keyRightPressScala) this.setPosition(this.row, this.col + 1);
      this.keyRightPressScala += time;
    }

    if (this.keyLeftPressScala > 140 || !me.input.keyStatus('left')) this.keyLeftPressScala = 0;
    if (this.keyRightPressScala > 140 || !me.input.keyStatus('right')) this.keyRightPressScala = 0;

    return true;
  },

  onActivateEvent : function() {
    var _this = this;
    this.dropTimer = me.timer.setInterval(() => {
      this.setPosition(this.row + 1, this.col);

    }, 1000);
  },

  onDeactivateEvent : function() {
    me.timer.clearInterval(this.timer);
  }
});
