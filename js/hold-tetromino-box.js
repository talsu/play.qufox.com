game.HoldTetrominoBox = me.Container.extend({
  init: function(x, y, width, height) {
    this._super(me.Container, "init", [width/2 + x, height/2 + y, width, height]);
  },

  hold: function(tetrominoType) {
    let unholded = this.tetromino ? this.unhold() : null;

    let position = {
      I:[1, 0.5],
      J:[1.5,1],
      L:[1.5,1],
      T:[1.5,1],
      O:[1,1],
      Z:[1.5,1],
      S:[1.5,1]
    }[tetrominoType];

    this.tetromino = me.pool.pull("tetromino", tetrominoType, [], position[0], position[1]);
    this.tetromino.deactive();
    this.addChild(this.tetromino);

    return unholded;
  },

  unhold: function() {
    if (!this.tetromino) return null;
    let type = this.tetromino.type;
    this.removeChild(this.tetromino);
    this.tetromino = null;
    return type;
  },

  draw: function(renderer) {
    let color = renderer.getColor();
    renderer.setColor('#000000');
    renderer.fillRect(this.left, this.top, this.width, this.height);
    renderer.setColor(color);

    this._super(me.Container, "draw", [renderer]);
  },

});
