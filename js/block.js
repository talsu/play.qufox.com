game.Block = me.Entity.extend({
  init : function (x, y) {
    this._super(me.Entity, "init", [0, 0, { width: 60, height: 60 }]);

    this.dots = {
      I: {
        0:[[0,1],[1,1],[2,1],[3,1]],
        R:[[2,0],[2,1],[2,2],[2,3]],
        2:[[0,2],[1,2],[2,2],[3,2]],
        L:[[1,0],[1,1],[1,2],[1,3]]
      }
    };
    this.I_KickData = {
      "0>R":  [[0,0],	[-2,0],	[+1,0],	[-2,-1],	[+1,+2]],
      "R>0":	[[0,0],	[+2,0],	[-1,0],	[+2,+1],	[-1,-2]],
      "R>2":	[[0,0],	[-1,0],	[+2,0],	[-1,+2],	[+2,-1]],
      "2>R":	[[0,0],	[+1,0],	[-2,0],	[+1,-2],	[-2,+1]],
      "2>L":	[[0,0],	[+2,0],	[-1,0],	[+2,+1],	[-1,-2]],
      "L>2":	[[0,0],	[-2,0],	[+1,0],	[-2,-1],	[+1,+2]],
      "L>0":	[[0,0],	[+1,0],	[-2,0],	[+1,-2],	[-2,+1]],
      "0>L":	[[0,0],	[-1,0],	[+2,0],	[-1,+2],	[+2,-1]],
    };
    this.blockType = 'I';
    this.rotateType = '0';
    //this.dotArray = [{row:0, col:1}, {row:1, col:1}, {row:2, col:1}, {row:2, col:0}]; // J

    this.move(0, 0);

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

    this.keyPressScala = {
      left:0,right:0,drop:0,down:0,anticlockwise:0,clockwise:0
    };
  },
  getDotArray(){
    return this.dots[this.blockType][this.rotateType];
  },
  rotate(isClockwise) {
    var types = ['0', 'R', '2', 'L'];
    var index = types.indexOf(this.rotateType);
    index += isClockwise ? 1 : -1;
    index = (types.length + index) % types.length;
    var newRotateType = types[index];
    
    var kickData = null;
    if (this.blockType == "I") kickData = this.I_KickData[this.rotateType + '>' + newRotateType];

    var rotateSuccess = false;
    for (var i = 0; i < kickData.length; ++i) {
      console.log(i);
      var newCol = this.col + kickData[i][0];
      var newRow = this.row + kickData[i][1];
      if (this.isValidPosition(newRotateType, newRow, newCol)) {
        this.rotateType = newRotateType;
        this.move(newRow, newCol);
        rotateSuccess = true;
        break;
      }
    }

    return rotateSuccess;
  },
  draw : function (renderer) {
      var color = renderer.getColor();
      renderer.setColor('#5EFF7E');
      this.getDotArray().forEach(function(colRow) {
        renderer.fillRect(
          colRow[0] * game.PlayField.BLOCK_SIZE,
          colRow[1] * game.PlayField.BLOCK_SIZE,
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
  isValidPosition: function(type, row, col) {
    var dotArray = this.dots[this.blockType][type];
    for (var i = 0;i < dotArray.length; ++i) {
      var newRow = row + dotArray[i][1];
      var newCol = col + dotArray[i][0];
      console.log({i:i,row:newRow,col:newCol});
      if (newRow < 0 || game.PlayField.ROW_COUNT <= newRow) return false; // cannot setPosition
      if (newCol < 0 || game.PlayField.COL_COUNT <= newCol) return false; // cannot setPosition
    }

    return true;
  },
  move: function(row, col) {
    if (!this.isValidPosition(this.rotateType, row, col)) return;

    this.row = row;
    this.col = col;

    this.pos.x = this.col * game.PlayField.BLOCK_SIZE;
    this.pos.y = this.row * game.PlayField.BLOCK_SIZE;
  },
  update : function (time) {
    if (me.input.isKeyPressed("left")) {
      if (!this.keyPressScala.left) this.move(this.row, this.col - 1);
      this.keyPressScala.left += time;
    }

    if (me.input.isKeyPressed("right")) {
      if (!this.keyPressScala.right) this.move(this.row, this.col + 1);
      this.keyPressScala.right += time;
    }

    if (me.input.isKeyPressed("down")) {
      if (!this.keyPressScala.down) this.move(this.row + 1, this.col);
      this.keyPressScala.down += time;
    }

    if (me.input.isKeyPressed("drop")) {
      if (!this.keyPressScala.drop) this.move(this.row - 1, this.col);
      this.keyPressScala.drop += time;
    }

    if (me.input.isKeyPressed("clockwise")) {
      if (!this.keyPressScala.clockwise) this.rotate(true);
      this.keyPressScala.clockwise += time;
    }

    if (me.input.isKeyPressed("anticlockwise")) {
      if (!this.keyPressScala.anticlockwise) this.rotate(false);
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
    // var _this = this;
    // this.dropTimer = me.timer.setInterval(function() {
    //   _this.move(_this.row + 1, _this.col);
    //
    // }, 1000);
  },

  onDeactivateEvent : function() {
    // me.timer.clearInterval(this.timer);
  }
});
