game.PlayField = me.Container.extend({
  init: function(x, y) {
    this._super(me.Container, "init", [x, y,
      game.PlayField.COL_COUNT * game.PlayField.BLOCK_SIZE,
      game.PlayField.ROW_COUNT * game.PlayField.BLOCK_SIZE
    ]);

    this.start();
  },

  start: function() {
    this.activeTetromino = null;
    this.deactiveTetrominos = [];
    this.randomBag = [];
    this.spawnTetromino();
  },

  draw: function(renderer) {
    let color = renderer.getColor();
    renderer.setColor('#4e4e4e');
    renderer.fillRect(this.left, this.top, this.width, this.height);
    renderer.setColor(color);

    this._super(me.Container, "draw", [renderer]);
  },

  /*
    https://tetris.wiki/Random_Generator
  */
  randomTypeGenerator: function() {
    if (!this.randomBag) this.randomBag = [];
    if (!this.randomBag.length) this.randomBag = game.Tetromino.TYPES.slice();
    return this.randomBag.splice(Math.floor(Math.random()*this.randomBag.length), 1)[0]
  },

  spawnTetromino: function() {
    let tetrominotype = this.randomTypeGenerator();
    let tetromino = me.pool.pull("tetromino", tetrominotype, this.getDeactiveDots());
    if (tetromino.isSpwanSuccess) {
      this.activeTetromino = tetromino;
      this.addChild(this.activeTetromino);
    } else {
      console.log('Game Over');
      this.forEach(child => this.removeChild(child));
      this.start();
    }
  },

  /*
    https://tetris.wiki/DAS
  */
  chargeDAS: function(direction, isPressed, time) {
    if (!this.dasFlags) this.dasFlags = {};
    if (!this.dasFlags[direction]) this.dasFlags[direction] = 0;
    let oldValue = this.dasFlags[direction];
    if (isPressed) this.dasFlags[direction] += time;
    else this.dasFlags[direction] = 0;
    let newValue = this.dasFlags[direction];

    if (oldValue == 0 && newValue) this.onInput(direction, "press");
    if (oldValue && newValue == 0) this.onInput(direction, "release");

    if (newValue == 0) return;

    let rOld = Math.floor((oldValue - game.PlayField.DAS_INIT_MS) / game.PlayField.DAS_REPEAT_MS);
    let rNew = Math.floor((newValue - game.PlayField.DAS_INIT_MS) / game.PlayField.DAS_REPEAT_MS);

    if (rNew >= 0 && rOld < rNew) {
      if (rOld < 0) rOld = -1;
      for (let i = 0; i < (rNew - rOld); ++i) {
        this.onInput(direction, "hold");
      }
    }
  },

  getDeactiveDots: function() {
    return this.deactiveTetrominos.map(tetromino => tetromino.getDots()).reduce((a, b) => a.concat(b),[]);
  },

  onInput: function(direction, state) {
    if (!this.activeTetromino) return;

    if (state == "press" || state == "hold") {
      switch (direction) {
        case "left": this.activeTetromino.moveLeft(); break;
        case "right": this.activeTetromino.moveRight(); break;
        case "softDrop":
          if (this.activeTetromino.moveDown()) {
            this.restartAutoDropTimer();
          }
        break;
      }
    }

    if (state == "press") {
      switch (direction) {
        case "clockwise": this.activeTetromino.rotate(true); break;
        case "anticlockwise": this.activeTetromino.rotate(false); break;
        case "hardDrop": this.activeTetromino.hardDrop(); this.onDrop(); break;
      }
    }
  },

  update: function (time) {
    this._super(me.Container, "update", [time]);

    this.chargeDAS("left", me.input.isKeyPressed("left"), time);
    this.chargeDAS("right", me.input.isKeyPressed("right"), time);
    this.chargeDAS("softDrop", me.input.isKeyPressed("softDrop"), time);
    this.chargeDAS("hardDrop", me.input.isKeyPressed("hardDrop"), time);
    this.chargeDAS("clockwise", me.input.isKeyPressed("clockwise"), time);
    this.chargeDAS("anticlockwise", me.input.isKeyPressed("anticlockwise"), time);

    return true;
  },

  onDrop: function() {
    if (!this.activeTetromino) return;

    this.activeTetromino.deactive();
    this.deactiveTetrominos.push(this.activeTetromino);
    this.activeTetromino = null;

    // [TODO] clear line

    // ARE

    this.spawnTetromino();
  },

  startAutoDropTimer: function(interval) {
    if (this.autoDropTimer) return;
    this.autoDropTimer = me.timer.setInterval(() => {
      if (this.activeTetromino && !this.activeTetromino.moveDown()) {
        this.onDrop();
      }
    }, interval || 1000);
  },

  stopAutoDropTimer: function() {
    if (!this.autoDropTimer) return;
    me.timer.clearInterval(this.autoDropTimer);
    this.autoDropTimer = null;
  },

  restartAutoDropTimer: function(interval) {
    this.stopAutoDropTimer();
    this.startAutoDropTimer(interval);
  },

  onActivateEvent : function() {
    this._super(me.Container, "onActivateEvent",[]);
    this.startAutoDropTimer();
  },

  onDeactivateEvent : function() {
    this._super(me.Container, "onDeactivateEvent",[]);
    this.stopAutoDropTimer();
  }
});

game.PlayField.BLOCK_SIZE = 20;
game.PlayField.ROW_COUNT = 20;
game.PlayField.COL_COUNT = 10;
game.PlayField.DAS_INIT_MS = 183;
game.PlayField.DAS_REPEAT_MS = 83;
