game.Block = me.Entity.extend({
  init : function (x, y) {
    this._super(me.Entity, "init", [x, y, { width: 20, height: 20 }]);

    this.dropVelocity = 20;

    this.renderable = new (me.Renderable.extend({
        init : function () {
            this._super(me.Renderable, "init", [0, 0, 20, 20]);
        },
        destroy : function () {},
        draw : function (renderer) {
            renderer.setColor('#5EFF7E');
            renderer.drawShape(new me.Polygon(0, 0, [
              new me.Vector2d(20, 0),
              new me.Vector2d(40, 0),
              new me.Vector2d(40, 60),
              new me.Vector2d(0, 60),
              new me.Vector2d(0, 40),
              new me.Vector2d(20, 40)
            ]));
        }
    }));
    // this.alwaysUpdate = true;


    this.velx = 450;
    this.maxX = me.game.viewport.width - this.width;
  },

  update : function (time) {
    if (me.input.isKeyPressed("left")) {
        this.pos.x -= this.velx * time / 1000;
    }

    if (me.input.isKeyPressed("right")) {
        this.pos.x += this.velx * time / 1000;
    }


    this.pos.x = this.pos.x.clamp(0, this.maxX);

    return true;
  },

  onActivateEvent : function() {
    var _this = this;
    this.dropTimer = me.timer.setInterval(function() {
      _this.pos.y += _this.dropVelocity;

    }, 1000);
  },

  onDeactivateEvent : function() {
    me.timer.clearInterval(this.timer);
  }
});
