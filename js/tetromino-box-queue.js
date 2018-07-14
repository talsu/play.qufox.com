game.TetrominoBoxQueue = me.Container.extend({
  init: function(x, y, queueSize) {
    let size = game.PlayField.BLOCK_SIZE;
    let width = 6 * size;
    let height = 4 * size * queueSize;

    this._super(me.Container, "init", [width/2 + x, height/2 + y, width, height]);
    this.boxs = [];

    for (let i = 0; i < queueSize; ++i) {
      let box = me.pool.pull("holdTetrominoBox", size, size + (4*size*i + size*i), 6 * size, 4 * size);
      this.boxs.push(box);
      this.addChild(box);
    }

    this.boxs.forEach(item => item.hold('I'));
    this.typeQueue = [];
    this.randomBag = [];
  },

  /*
    https://tetris.wiki/Random_Generator
  */
  randomTypeGenerator: function() {
    while (this.typeQueue.length < (this.boxs.length + 1)) {
      if (!this.randomBag.length) this.randomBag = game.Tetromino.TYPES.slice();
      let type = this.randomBag.splice(Math.floor(Math.random()*this.randomBag.length), 1)[0];
      this.typeQueue.push(type);
    }

    let gotType = this.typeQueue.shift();

    this.boxs.forEach((box, index) => {
      box.hold(this.typeQueue[index]);
    });

    return gotType;
  },

  clear: function() { this.typeQueue = []; }
});
