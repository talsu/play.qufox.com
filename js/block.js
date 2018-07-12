game.Block = me.Entity.extend({
  init : function (blockType, col, row) {
    this._super(me.Entity, "init", [0, 0, { width: 60, height: 60 }]);

    this.blockType = blockType;
    this.rotateType = '0';
    // default position col:3, row:0
    let initCol = col === undefined ? 3 : col;
    let initRow = row || 0;

    this.move(initCol, initRow);
  },

  getDotOffsets(rotateType) {
    return game.Block.DOTS[this.blockType][rotateType || this.rotateType];
  },

  getDots(rotateType, col, row) {
    let colBase = (col === undefined) ? this.col : col;
    let rowBase = (row === undefined) ? this.row : row;
    return this.getDotOffsets(rotateType).map(colRow => {
      return [colBase + colRow[0], rowBase + colRow[1]];
    });
  },

  rotate(isClockwise, dots) {
    let index = game.Block.ROTATE_SEQ.indexOf(this.rotateType);
    index += isClockwise ? 1 : -1;
    index = (game.Block.ROTATE_SEQ.length + index) % game.Block.ROTATE_SEQ.length;
    let newRotateType = game.Block.ROTATE_SEQ[index];

    let offsets = null;
    switch (this.blockType) {
      case "O": offsets = []; break;
      case "I": offsets = game.Block.I_KICK_DATA[this.rotateType + '>' + newRotateType]; break;
      default: offsets = game.Block.JLSTZ_KICK_DATA[this.rotateType + '>' + newRotateType]; break;
    }

    return offsets.some(colRow => {
      let newCol = this.col + colRow[0];
      let newRow = this.row - colRow[1]; // kickData Y is opposite Row.
      if (this.isValidPosition(newRotateType, newCol, newRow, dots)) {
        this.rotateType = newRotateType;
        this.move(newCol, newRow);
        return true;
      }
    });
  },

  draw : function (renderer) {
      renderer.globalAlpha(0.5);
      let color = renderer.getColor();
      renderer.setColor(this.isDeactive?"grey":game.Block.COLOR[this.blockType]);
      this.getDotOffsets().forEach(function(colRow) {
        renderer.fillRect(
          colRow[0] * game.PlayField.BLOCK_SIZE,
          colRow[1] * game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE);
      });
      renderer.setColor(color);

  },

  isValidPosition: function(rotateType, col, row, blockedDots) {

    return this.getDots(rotateType, col, row).every(colRow => {
      let newCol = colRow[0];
      let newRow = colRow[1];
      if (blockedDots && blockedDots.some(dot => dot[0] === newCol && dot[1] === newRow)) return false;
      if (newCol < 0 || game.PlayField.COL_COUNT <= newCol) return false;
      if (newRow < 0 || game.PlayField.ROW_COUNT <= newRow) return false;
      return true;
    });

    // return this.getDotOffsets(rotateType).every(colRow => {
    //   let newCol = col + colRow[0];
    //   let newRow = row + colRow[1];
    //   if (blockedDots && blockedDots.some(dot => dot[0] === newCol && dot[1] === newRow)) return false;
    //   if (newCol < 0 || game.PlayField.COL_COUNT <= newCol) return false;
    //   if (newRow < 0 || game.PlayField.ROW_COUNT <= newRow) return false;
    //   return true;
    // });
  },

  move: function(col, row, dots) {
    if (!this.isValidPosition(this.rotateType, col, row, dots)) return false;

    this.row = row;
    this.col = col;

    this.pos.x = this.col * game.PlayField.BLOCK_SIZE;
    this.pos.y = this.row * game.PlayField.BLOCK_SIZE;

    return true;
  },

  moveLeft: function(dots) { return this.move(this.col - 1, this.row, dots); },
  moveRight: function(dots) { return this.move(this.col + 1, this.row, dots); },
  moveUp: function(dots) { return this.move(this.col, this.row - 1, dots); },
  moveDown: function(dots) { return this.move(this.col, this.row + 1, dots); },

  hardDrop: function(dots) { while (this.moveDown(dots)) {} },

  deactive: function() {
    this.isDeactive = true;
  },

});

game.Block.TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
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

game.Block.ROTATE_SEQ = ['0', 'R', '2', 'L'];

game.Block.COLOR = {
  I:"#1cd6ff",
  J:"#126fc4",
  L:"#df9a00",
  T:"#9826c7",
  O:"#ede40b",
  Z:"#c92323",
  S:"#26a723"
};

game.Block.I_KICK_DATA = {
  "0>R": [[0,0], [-2,0], [+1,0], [-2,-1], [+1,+2]],
  "R>0": [[0,0], [+2,0], [-1,0], [+2,+1], [-1,-2]],
  "R>2": [[0,0], [-1,0], [+2,0], [-1,+2], [+2,-1]],
  "2>R": [[0,0], [+1,0], [-2,0], [+1,-2], [-2,+1]],
  "2>L": [[0,0], [+2,0], [-1,0], [+2,+1], [-1,-2]],
  "L>2": [[0,0], [-2,0], [+1,0], [-2,-1], [+1,+2]],
  "L>0": [[0,0], [+1,0], [-2,0], [+1,-2], [-2,+1]],
  "0>L": [[0,0], [-1,0], [+2,0], [-1,+2], [+2,-1]]
};

game.Block.JLSTZ_KICK_DATA = {
  "0>R": [[ 0, 0], [-1, 0], [-1,+1], [ 0,-2], [-1,-2]],
  "R>0": [[ 0, 0], [+1, 0], [+1,-1], [ 0,+2], [+1,+2]],
  "R>2": [[ 0, 0], [+1, 0], [+1,-1], [ 0,+2], [+1,+2]],
  "2>R": [[ 0, 0], [-1, 0], [-1,+1], [ 0,-2], [-1,-2]],
  "2>L": [[ 0, 0], [+1, 0], [+1,+1], [ 0,-2], [+1,-2]],
  "L>2": [[ 0, 0], [-1, 0], [-1,-1], [ 0,+2], [-1,+2]],
  "L>0": [[ 0, 0], [-1, 0], [-1,-1], [ 0,+2], [-1,+2]],
  "0>L": [[ 0, 0], [+1, 0], [+1,+1], [ 0,-2], [+1,-2]]
};
