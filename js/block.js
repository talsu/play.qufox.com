game.Block = me.Entity.extend({
  init : function (x, y) {
    this._super(me.Entity, "init", [0, 0, { width: 60, height: 60 }]);

    this.blockType = 'Z';
    this.rotateType = '0';

    this.move(0, 0);
  },
  getDotArray() {
    return game.Block.DOTS[this.blockType][this.rotateType];
  },
  rotate(isClockwise) {
    var types = ['0', 'R', '2', 'L'];
    var index = types.indexOf(this.rotateType);
    index += isClockwise ? 1 : -1;
    index = (types.length + index) % types.length;
    var newRotateType = types[index];

    var kickData = null;
    if (this.blockType == "O") return true;
    else if (this.blockType == "I") kickData = game.Block.I_KICK_DATA[this.rotateType + '>' + newRotateType];
    else kickData = game.Block.JLSTZ_KICK_DATA[this.rotateType + '>' + newRotateType];

    var rotateSuccess = false;
    for (var i = 0; i < kickData.length; ++i) {
      // console.log(i);
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
      renderer.setColor(game.Block.COLOR[this.blockType]);
      this.getDotArray().forEach(function(colRow) {
        renderer.fillRect(
          colRow[0] * game.PlayField.BLOCK_SIZE,
          colRow[1] * game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE);
      });
      renderer.setColor(color);

  },
  isValidPosition: function(type, row, col) {
    var dotArray = game.Block.DOTS[this.blockType][type];
    for (var i = 0;i < dotArray.length; ++i) {
      var newRow = row + dotArray[i][1];
      var newCol = col + dotArray[i][0];
      if (newRow < 0 || game.PlayField.ROW_COUNT <= newRow) return false; // cannot setPosition
      if (newCol < 0 || game.PlayField.COL_COUNT <= newCol) return false; // cannot setPosition
    }

    return true;
  },
  move: function(row, col) {
    if (!this.isValidPosition(this.rotateType, row, col)) return false;

    this.row = row;
    this.col = col;

    this.pos.x = this.col * game.PlayField.BLOCK_SIZE;
    this.pos.y = this.row * game.PlayField.BLOCK_SIZE;

    return true;
  },

  moveLeft: function() { return this.move(this.row, this.col - 1); },
  moveRight: function() { return this.move(this.row, this.col + 1); },
  moveUp: function() { return this.move(this.row - 1, this.col); },
  moveDown: function() { return this.move(this.row + 1, this.col); },

});

game.Block.DOTS = {
  I: {
    0:[[0,1],[1,1],[2,1],[3,1]],
    R:[[2,0],[2,1],[2,2],[2,3]],
    2:[[0,2],[1,2],[2,2],[3,2]],
    L:[[1,0],[1,1],[1,2],[1,3]]
  },
  J: {
    0:[[0,0],[0,1],[1,1],[2,1]],
    R:[[1,0],[2,0],[1,1],[1,2]],
    2:[[0,1],[1,1],[2,1],[2,2]],
    L:[[1,0],[1,1],[0,2],[1,2]]
  },
  L: {
    0:[[2,0],[0,1],[1,1],[2,1]],
    R:[[1,0],[2,2],[1,1],[1,2]],
    2:[[0,1],[1,1],[2,1],[0,2]],
    L:[[1,0],[1,1],[0,0],[1,2]]
  },
  O: {
    0:[[1,0],[2,0],[1,1],[2,1]],
    R:[[1,0],[2,0],[1,1],[2,1]],
    2:[[1,0],[2,0],[1,1],[2,1]],
    L:[[1,0],[2,0],[1,1],[2,1]]
  },
  S: {
    0:[[1,0],[2,0],[0,1],[1,1]],
    R:[[1,0],[1,1],[2,1],[2,2]],
    2:[[1,1],[2,1],[0,2],[1,2]],
    L:[[0,0],[0,1],[1,1],[1,2]]
  },
  T: {
    0:[[1,0],[0,1],[1,1],[2,1]],
    R:[[1,0],[1,1],[2,1],[1,2]],
    2:[[0,1],[1,1],[2,1],[1,2]],
    L:[[1,0],[0,1],[1,1],[1,2]]
  },
  Z: {
    0:[[0,0],[1,0],[1,1],[2,1]],
    R:[[2,0],[1,1],[2,1],[1,2]],
    2:[[0,1],[1,1],[2,2],[1,2]],
    L:[[1,0],[0,1],[1,1],[0,2]]
  }
};

game.Block.COLOR = {
  I:"cyan",
  J:"blue",
  L:"orange",
  T:"purple",
  O:"yellow",
  Z:"red",
  S:"green"
};

game.Block.I_KICK_DATA = {
  "0>R":  [[0,0],	[-2,0],	[+1,0],	[-2,-1],	[+1,+2]],
  "R>0":	[[0,0],	[+2,0],	[-1,0],	[+2,+1],	[-1,-2]],
  "R>2":	[[0,0],	[-1,0],	[+2,0],	[-1,+2],	[+2,-1]],
  "2>R":	[[0,0],	[+1,0],	[-2,0],	[+1,-2],	[-2,+1]],
  "2>L":	[[0,0],	[+2,0],	[-1,0],	[+2,+1],	[-1,-2]],
  "L>2":	[[0,0],	[-2,0],	[+1,0],	[-2,-1],	[+1,+2]],
  "L>0":	[[0,0],	[+1,0],	[-2,0],	[+1,-2],	[-2,+1]],
  "0>L":	[[0,0],	[-1,0],	[+2,0],	[-1,+2],	[+2,-1]]
};

game.Block.JLSTZ_KICK_DATA = {
  "0>R":	[[ 0, 0],	[-1, 0],	[-1,+1],	[ 0,-2],	[-1,-2]],
  "R>0":	[[ 0, 0],	[+1, 0],	[+1,-1],	[ 0,+2],	[+1,+2]],
  "R>2":	[[ 0, 0],	[+1, 0],	[+1,-1],	[ 0,+2],	[+1,+2]],
  "2>R":	[[ 0, 0],	[-1, 0],	[-1,+1],	[ 0,-2],	[-1,-2]],
  "2>L":	[[ 0, 0],	[+1, 0],	[+1,+1],	[ 0,-2],	[+1,-2]],
  "L>2":	[[ 0, 0],	[-1, 0],	[-1,-1],	[ 0,+2],	[-1,+2]],
  "L>0":	[[ 0, 0],	[-1, 0],	[-1,-1],	[ 0,+2],	[-1,+2]],
  "0>L":	[[ 0, 0],	[+1, 0],	[+1,+1],	[ 0,-2],	[+1,-2]]
};
