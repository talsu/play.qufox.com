
game.Tetromino = me.Entity.extend({
  init : function (type, blockedPositions, col, row) {
    this._super(me.Entity, "init", [0, 0, { width: game.PlayField.BLOCK_SIZE * 4, height: game.PlayField.BLOCK_SIZE * 4 }]);

    this.type = type;
    this.rotateType = '0';

    let initCol = col === undefined ? 3 : col;
    let initRow = row || 0;

    this.ghostRowOffset = 0;

    this.blockedPositions = []; // draw without blocked position first
    this.blockedPositions = blockedPositions;

    this.move(initCol, initRow);
    if (!this.isValidPosition(this.rotateType, initCol, initRow)) {
      // Game over
      console.log("Game Over");
    }
  },

  draw: function (renderer) {
      // this.currentTransform.rotate(0.025);
      // renderer.globalAlpha(0.5);
      let color = renderer.getColor();
      renderer.setColor(this.isDeactive?"grey":game.Tetromino.COLOR[this.type]);
      this.getDotOffsets().forEach(colRow => {
        renderer.fillRect(
          colRow[0] * game.PlayField.BLOCK_SIZE,
          colRow[1] * game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE,
          game.PlayField.BLOCK_SIZE);
      });

      // Draw ghost tetromino
      if (!this.isDeactive && game.Tetromino.SHOW_GHOST && this.ghostRowOffset) {
        renderer.setGlobalAlpha(0.3);
        this.getDotOffsets().forEach(colRow => {
          renderer.fillRect(
            colRow[0] * game.PlayField.BLOCK_SIZE,
            (colRow[1] + this.ghostRowOffset) * game.PlayField.BLOCK_SIZE,
            game.PlayField.BLOCK_SIZE,
            game.PlayField.BLOCK_SIZE);
        });
      }

      renderer.setColor(color);

      this._super(me.Entity, "draw", [renderer]);
  },

  getDotOffsets: function (rotateType) {
    return game.Tetromino.DOTS[this.type][rotateType || this.rotateType];
  },

  getDots: function (rotateType, col, row) {
    let colBase = (col === undefined) ? this.col : col;
    let rowBase = (row === undefined) ? this.row : row;
    return this.getDotOffsets(rotateType).map(colRow => {
      return [colBase + colRow[0], rowBase + colRow[1]];
    });
  },

  getGhostRowOffset: function() {
    let row = this.row;
    while (this.isValidPosition(this.rotateType, this.col, row)) { row++; }
    let offset = row - this.row - 1;
    let minOffset = null;
    if (this.rotateType == 'R' || this.rotateType == 'L'){
      minOffset = 3;
      if (this.type == 'I') minOffset = 4;
    } else {
      minOffset = 2;
      if (this.type == 'I') minOffset = 1;
    }
    return offset < minOffset ? 0 : offset;
  },

  isValidPosition: function(rotateType, col, row) {
    return this.getDots(rotateType, col, row).every(colRow => {
      let newCol = colRow[0];
      let newRow = colRow[1];
      if (this.blockedPositions.some(colRow => colRow[0] === newCol && colRow[1] === newRow)) return false;
      if (newCol < 0 || game.PlayField.COL_COUNT <= newCol) return false;
      if (newRow < 0 || game.PlayField.ROW_COUNT <= newRow) return false;
      return true;
    });
  },

  /*
    https://tetris.wiki/SRS
  */
  rotate: function (isClockwise) {
    let index = game.Tetromino.ROTATE_SEQ.indexOf(this.rotateType);
    index += isClockwise ? 1 : -1;
    index = (game.Tetromino.ROTATE_SEQ.length + index) % game.Tetromino.ROTATE_SEQ.length;
    let newRotateType = game.Tetromino.ROTATE_SEQ[index];

    let offsets = null;
    switch (this.type) {
      case "O": offsets = []; break;
      case "I": offsets = game.Tetromino.I_KICK_DATA[this.rotateType + '>' + newRotateType]; break;
      default: offsets = game.Tetromino.JLSTZ_KICK_DATA[this.rotateType + '>' + newRotateType]; break;
    }

    return offsets.some(colRow => {
      let newCol = this.col + colRow[0];
      let newRow = this.row - colRow[1]; // kickData Y is opposite Row.
      if (this.isValidPosition(newRotateType, newCol, newRow)) {
        this.rotateType = newRotateType;
        this.move(newCol, newRow);
        return true;
      }
    });
  },

  move: function(col, row) {
    if (!this.isValidPosition(this.rotateType, col, row)) return false;

    this.row = row;
    this.col = col;
    this.pos.x = this.col * game.PlayField.BLOCK_SIZE;
    this.pos.y = this.row * game.PlayField.BLOCK_SIZE;

    this.ghostRowOffset = this.getGhostRowOffset();

    return true;
  },

  moveLeft: function() { return this.move(this.col - 1, this.row); },

  moveRight: function() { return this.move(this.col + 1, this.row); },

  moveUp: function() { return this.move(this.col, this.row - 1); },

  moveDown: function() { return this.move(this.col, this.row + 1); },

  hardDrop: function() { while (this.moveDown()) {} },

  deactive: function() {
    this.isDeactive = true;
  },

});

game.Tetromino.SHOW_GHOST = true;

game.Tetromino.TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

game.Tetromino.DOTS = {
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

game.Tetromino.ROTATE_SEQ = ['0', 'R', '2', 'L'];

game.Tetromino.COLOR = {
  I:"#1cd6ff",
  J:"#126fc4",
  L:"#df9a00",
  T:"#9826c7",
  O:"#ede40b",
  Z:"#c92323",
  S:"#26a723"
};

game.Tetromino.I_KICK_DATA = {
  "0>R": [[0,0], [-2,0], [+1,0], [-2,-1], [+1,+2]],
  "R>0": [[0,0], [+2,0], [-1,0], [+2,+1], [-1,-2]],
  "R>2": [[0,0], [-1,0], [+2,0], [-1,+2], [+2,-1]],
  "2>R": [[0,0], [+1,0], [-2,0], [+1,-2], [-2,+1]],
  "2>L": [[0,0], [+2,0], [-1,0], [+2,+1], [-1,-2]],
  "L>2": [[0,0], [-2,0], [+1,0], [-2,-1], [+1,+2]],
  "L>0": [[0,0], [+1,0], [-2,0], [+1,-2], [-2,+1]],
  "0>L": [[0,0], [-1,0], [+2,0], [-1,+2], [+2,-1]]
};

game.Tetromino.JLSTZ_KICK_DATA = {
  "0>R": [[ 0, 0], [-1, 0], [-1,+1], [ 0,-2], [-1,-2]],
  "R>0": [[ 0, 0], [+1, 0], [+1,-1], [ 0,+2], [+1,+2]],
  "R>2": [[ 0, 0], [+1, 0], [+1,-1], [ 0,+2], [+1,+2]],
  "2>R": [[ 0, 0], [-1, 0], [-1,+1], [ 0,-2], [-1,-2]],
  "2>L": [[ 0, 0], [+1, 0], [+1,+1], [ 0,-2], [+1,-2]],
  "L>2": [[ 0, 0], [-1, 0], [-1,-1], [ 0,+2], [-1,+2]],
  "L>0": [[ 0, 0], [-1, 0], [-1,-1], [ 0,+2], [-1,+2]],
  "0>L": [[ 0, 0], [+1, 0], [+1,+1], [ 0,-2], [+1,-2]]
};

game.Tetromino.I_ARIKA_KICK_DATA = {
  "0->R":[[ 0, 0], [-2, 0], [+1, 0], [+1,+2], [-2,-1]],
  "0->L":[[ 0, 0], [+2, 0], [-1, 0], [-1,+2], [+2,-1]],
  "2->R":[[ 0, 0], [-2, 0], [+1, 0], [-2,+1], [+1,-1]],
  "2->L":[[ 0, 0], [+2, 0], [-1, 0], [+2,+1], [-1,-1]],
  "R->0":[[ 0, 0], [+2, 0], [-1, 0], [+2,+1], [-1,-2]],
  "L->0":[[ 0, 0], [-2, 0], [+1, 0], [-2,+1], [+1,-2]],
  "R->2":[[ 0, 0], [-1, 0], [+2, 0], [-1,+2], [+2,-1]],
  "L->2":[[ 0, 0], [+1, 0], [-2, 0], [+1,+2], [-2,-1]]
}
