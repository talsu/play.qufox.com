game.PlayField = me.Container.extend({
  init: function(x, y) {

    var blockSize = 20;
    var rowCount = 20;
    var colCount = 10;
    this._super(me.Container, "init", [x, y,
      game.PlayField.COL_COUNT * game.PlayField.BLOCK_SIZE,
      game.PlayField.ROW_COUNT * game.PlayField.BLOCK_SIZE
    ]);
    this.activeBlock = null;
    this.deactiveBlocks = [];
    this.deactiveDots = [];
    this.spawnBlock();
  },

  draw: function(renderer) {
    var color = renderer.getColor();
    renderer.setColor('white');
    renderer.fillRect(this.left, this.top, this.width, this.height);
    renderer.setColor(color);

    this._super(me.Container, "draw", [renderer]);
  },

  spawnBlock: function() {
    let blockType = game.Block.TYPES[Math.floor(Math.random()*game.Block.TYPES.length)];
    this.activeBlock = me.pool.pull("block", blockType);
    this.addChild(this.activeBlock);
  },

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
    return this.deactiveBlocks.map(block => block.getDots()).reduce((a, b) => a.concat(b),[]);
  },
  onInput: function(direction, state) {
    console.log({time:new Date().getTime(), direction:direction, state:state});

    if (!this.activeBlock) return;

    if (state == "press" || state == "hold") {
      switch (direction) {
        case "left": this.activeBlock.moveLeft(this.deactiveDots); break;
        case "right": this.activeBlock.moveRight(this.deactiveDots); break;
        case "softDrop": this.activeBlock.moveDown(this.deactiveDots); break;
      }
    }

    if (state == "press") {
      switch (direction) {
        case "clockwise": this.activeBlock.rotate(true, this.deactiveDots); break;
        case "anticlockwise": this.activeBlock.rotate(false, this.deactiveDots); break;
        case "hardDrop": this.activeBlock.hardDrop(this.deactiveDots); this.onDrop(); break;
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
    if (!this.activeBlock) return;

    this.activeBlock.deactive();
    this.deactiveBlocks.push(this.activeBlock);
    this.deactiveDots = this.getDeactiveDots();

    // [TODO] clear line

    this.spawnBlock();
  },

  onActivateEvent : function() {
    this._super(me.Container, "onActivateEvent",[]);
    var _this = this;
    this.dropTimer = me.timer.setInterval(() => {
      if (this.activeBlock && !this.activeBlock.moveDown(this.deactiveDots)) {
        this.onDrop();
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
game.PlayField.DAS_INIT_MS = 183;
game.PlayField.DAS_REPEAT_MS = 83;
