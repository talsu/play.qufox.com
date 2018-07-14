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
    this.startAutoDropTimer();
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
  chargeDAS: function(direction, isPressed, time, init, repeat) {
    if (!this.dasFlags) this.dasFlags = {};
    if (!this.dasFlags[direction]) this.dasFlags[direction] = 0;
    let oldValue = this.dasFlags[direction];
    if (isPressed) this.dasFlags[direction] += time;
    else this.dasFlags[direction] = 0;
    let newValue = this.dasFlags[direction];

    if (oldValue == 0 && newValue) this.onInput(direction, "press");
    if (oldValue && newValue == 0) this.onInput(direction, "release");

    if (newValue == 0) return;

    let initDelay = init || game.PlayField.DAS_INIT_MS;
    let repeatDelay = repeat || game.PlayField.DAS_REPEAT_MS;
    let rOld = Math.floor((oldValue - initDelay) / repeatDelay);
    let rNew = Math.floor((newValue - initDelay) / repeatDelay);

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
        case "left":
          if (this.activeTetromino.moveLeft() && this.activeTetromino.isLocking()) {
            this.restartLockTimer();
          }
          break;
        case "right":
          if (this.activeTetromino.moveRight() && this.activeTetromino.isLocking()) {
            this.restartLockTimer();
          }
          break;
        case "softDrop":
          if (this.activeTetromino.moveDown()) {
            this.restartAutoDropTimer();
            if (this.activeTetromino.isLocking()) {
              this.startLockTimer();
            }
          }
        break;
      }
    }

    if (state == "press") {
      switch (direction) {
        case "clockwise":
          if (this.activeTetromino.rotate(true) && this.activeTetromino.isLocking()) {
            this.restartLockTimer();
          }
          break;
        case "anticlockwise":
          if (this.activeTetromino.rotate(false) && this.activeTetromino.isLocking()) {
            this.restartLockTimer();
          }
          break;
        case "hardDrop":
          this.activeTetromino.hardDrop();
          this.lock();
          break;
      }
    }
  },

  update: function (time) {
    this._super(me.Container, "update", [time]);

    this.chargeDAS("left", me.input.isKeyPressed("left"), time);
    this.chargeDAS("right", me.input.isKeyPressed("right"), time);
    this.chargeDAS("softDrop", me.input.isKeyPressed("softDrop"), time, game.PlayField.SOFTDROP_REPEAT_MS, game.PlayField.SOFTDROP_REPEAT_MS);
    this.chargeDAS("hardDrop", me.input.isKeyPressed("hardDrop"), time);
    this.chargeDAS("clockwise", me.input.isKeyPressed("clockwise"), time);
    this.chargeDAS("anticlockwise", me.input.isKeyPressed("anticlockwise"), time);

    return true;
  },

  clearLine: function(droppedTetromino) {
    // get rows for check clear line.
    let clearCheckRows = droppedTetromino.getDots()
      .map(colRow => colRow[1])
      .reduce((result, row) => {result[row] = 1; return result;}, {});

    let needClearRows = [];
    let deactiveDots = this.getDeactiveDots();
    // get target of clear line rows.
    for (let key in clearCheckRows) {
      let row = Number(key);
      let numberOfRowDots = deactiveDots.filter(colRow => colRow[1] == row).length;
      if (numberOfRowDots >= game.PlayField.COL_COUNT) needClearRows.push(row);
    }

    // call clear line method each tetromino.
    needClearRows.forEach(row => {
      let emptyTetrominos = this.deactiveTetrominos.filter(tetromino => tetromino.clearLine(row));
      // remove empty tetromino.
      emptyTetrominos.forEach(tetromino => this.removeChild(tetromino));
      emptyTetrominos.forEach(tetromino => this.deactiveTetrominos.remove(tetromino));
    });

  },

  lock: function() {
    this.stopLockTimer();
    if (!this.activeTetromino) return;
    if (!this.activeTetromino.isLocking()) return;
    this.stopAutoDropTimer();
    let droppedTetromino = this.activeTetromino;
    droppedTetromino.deactive();
    this.deactiveTetrominos.push(droppedTetromino);
    this.activeTetromino = null;

    // clear line
    this.clearLine(droppedTetromino);

    // ARE
    me.timer.setTimeout(() => {
      this.spawnTetromino();
      this.startAutoDropTimer();
    }, game.PlayField.ARE_MS);
  },

  startAutoDropTimer: function(interval) {
    if (this.autoDropTimer) return;
    this.autoDropTimer = me.timer.setInterval(() => {
      if (this.activeTetromino) {
        this.activeTetromino.moveDown();
        if (this.activeTetromino.isLocking()) this.startLockTimer();
      }
    }, interval || game.PlayField.GRAVITY_MS);
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

  startLockTimer: function() {
    if (this.lockTimer) return;
    this.lockTimer = me.timer.setTimeout(() => this.lock(), game.PlayField.LOCK_DELAY_MS);
  },

  stopLockTimer: function() {
    if (!this.lockTimer) return;
    me.timer.clearTimeout(this.lockTimer);
    this.lockTimer = null;
  },

  restartLockTimer: function() {
    this.stopLockTimer();
    this.startLockTimer();
  },

  onActivateEvent : function() {
    this._super(me.Container, "onActivateEvent",[]);
    //this.startAutoDropTimer();
  },

  onDeactivateEvent : function() {
    this._super(me.Container, "onDeactivateEvent",[]);
    //this.stopAutoDropTimer();
  }
});

game.PlayField.BLOCK_SIZE = 20;
game.PlayField.ROW_COUNT = 20;
game.PlayField.COL_COUNT = 10;
game.PlayField.DAS_INIT_MS = 183;
game.PlayField.DAS_REPEAT_MS = 83;
game.PlayField.SOFTDROP_REPEAT_MS = 40;
game.PlayField.GRAVITY_MS = 200;
game.PlayField.LOCK_DELAY_MS = 500;
game.PlayField.ARE_MS = 417;
