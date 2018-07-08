game.Block = me.Entity.extend({
  init : function (x, y) {
    this._super(me.Entity, "init", [x, y, { width: 20, height: 20 }]);

    this.renderable = new (me.Renderable.extend({
        init : function () {
            this._super(me.Renderable, "init", [0, 0, 20, 20]);
        },
        destroy : function () {},
        draw : function (renderer) {
            renderer.setColor('#5EFF7E');
            renderer.drawShape(new me.Polygon(0, 0, [
              new me.Vector2d(0, 0),
              new me.Vector2d(0, 20),
              new me.Vector2d(40, 20),
              new me.Vector2d(40, 40),
              new me.Vector2d(60, 40),
              new me.Vector2d(60, 0)
            ]));
            // var color = renderer.getColor();
            // renderer.setColor('#5EFF7E');
            // renderer.fillRect(0, 0, this.width, this.height);
            // renderer.setColor(color);
        }
    }));
  }
});
