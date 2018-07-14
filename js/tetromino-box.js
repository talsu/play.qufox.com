game.TetrominoBox = me.Container.extend({
  init: function(x, y, width, height) {
    this._super(me.Container, "init", [width/2 + x, height/2 + y, width, height]);
  },

  hold: function(type) {
    let existType = null;
    if (this.tetromino) { // remove exsist tetromino.
      existType = this.tetromino.type;
      this.removeChild(this.tetromino);
      this.tetromino = null;
    }

    // if new type is invaild, do not create new tetromino.
    if (game.Tetromino.TYPES.indexOf(type) === -1) return existType;

    // create new tetromino.
    let position = {
      I:[1, 0.5],
      J:[1.5,1],
      L:[1.5,1],
      T:[1.5,1],
      O:[1,1],
      Z:[1.5,1],
      S:[1.5,1]
    }[type];
    this.tetromino = me.pool.pull("tetromino", type, [], position[0], position[1]);
    this.tetromino.deactive();
    this.addChild(this.tetromino);

    return existType;
  },
  draw: function(renderer) {
    let color = renderer.getColor();
    renderer.setColor('#000000');
    renderer.fillRect(this.left, this.top, this.width, this.height);
    renderer.setColor(color);

    this._super(me.Container, "draw", [renderer]);
  },

});
