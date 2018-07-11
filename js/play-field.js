game.PlayField = me.Container.extend({
  init: function(x, y) {

    var blockSize = 20;
    var rowCount = 20;
    var colCount = 10;
    this._super(me.Container, "init", [x, y,
      game.PlayField.COL_COUNT * game.PlayField.BLOCK_SIZE,
      game.PlayField.ROW_COUNT * game.PlayField.BLOCK_SIZE
    ]);
    this.activeBlock = me.pool.pull("block", 0, 0);
    this.addChild(this.activeBlock);

    // this.addChild(new (me.Renderable.extend({
    //         init : function () {
    //             this._super(me.Renderable, "init", [0, 0, 1100, 100]);
    //         },
    //         destroy : function () {},
    //         draw : function (renderer) {
    //             var color = renderer.getColor();
    //             renderer.setColor('#5EFF7E');
    //             renderer.fillRect(0, 0, this.width, this.height);
    //             renderer.setColor(color);
    //         }
    //     })));


    this.keyPressScala = {
      left:0,right:0,drop:0,down:0,anticlockwise:0,clockwise:0
    };
  },

  draw: function(renderer) {
    var color = renderer.getColor();
    renderer.setColor('grey');
    renderer.fillRect(this.left, this.top, this.width, this.height);
    renderer.setColor(color);

    this._super(me.Container, "draw", [renderer]);
  },

  update: function (time) {
    this._super(me.Container, "update", [time]);

    if (me.input.isKeyPressed("left")) {
      if (!this.keyPressScala.left) this.activeBlock.moveLeft();
      this.keyPressScala.left += time;
    }

    if (me.input.isKeyPressed("right")) {
      if (!this.keyPressScala.right) this.activeBlock.moveRight();
      this.keyPressScala.right += time;
    }

    if (me.input.isKeyPressed("down")) {
      if (!this.keyPressScala.down) this.activeBlock.moveDown();
      this.keyPressScala.down += time;
    }

    if (me.input.isKeyPressed("drop")) {
      if (!this.keyPressScala.drop) this.activeBlock.moveUp();
      this.keyPressScala.drop += time;
    }

    if (me.input.isKeyPressed("clockwise")) {
      if (!this.keyPressScala.clockwise) this.activeBlock.rotate(true);
      this.keyPressScala.clockwise += time;
    }

    if (me.input.isKeyPressed("anticlockwise")) {
      if (!this.keyPressScala.anticlockwise) this.activeBlock.rotate(false);
      this.keyPressScala.anticlockwise += time;
    }

    if (this.keyPressScala.left > 140 || !me.input.keyStatus('left')) this.keyPressScala.left = 0;
    if (this.keyPressScala.right > 140 || !me.input.keyStatus('right')) this.keyPressScala.right = 0;
    if (this.keyPressScala.down > 140 || !me.input.keyStatus('down')) this.keyPressScala.down = 0;
    if (this.keyPressScala.drop > 140 || !me.input.keyStatus('drop')) this.keyPressScala.drop = 0;

    if (this.keyPressScala.clockwise > 200 || !me.input.keyStatus('clockwise')) this.keyPressScala.clockwise = 0;
    if (this.keyPressScala.anticlockwise > 200 || !me.input.keyStatus('anticlockwise')) this.keyPressScala.anticlockwise = 0;

    return true;
  },

  onActivateEvent : function() {
    this._super(me.Container, "onActivateEvent",[]);
    var _this = this;
    this.dropTimer = me.timer.setInterval(function() {
      if (!_this.activeBlock.moveDown()) {
        // [TODO] 비활성화 블럭 전환 대기 타이머 동작
      }

    }, 1000);
  },

  onDeactivateEvent : function() {
    this._super(me.Container, "onDeactivateEvent",[]);
    me.timer.clearInterval(this.timer);
  }
});

game.PlayField.BLOCK_SIZE = 20;
game.PlayField.ROW_COUNT = 20;
game.PlayField.COL_COUNT = 10;
