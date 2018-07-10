game.PlayField = me.Container.extend({
  init: function(x, y) {

    var blockSize = 20;
    var rowCount = 20;
    var colCount = 10;
    this._super(me.Container, "init", [x, y, colCount * blockSize, rowCount * blockSize]);

    this.addChild(me.pool.pull("block", 0, 0));

    // this.addChild(new (me.Renderable.extend({
    //         init : function () {
    //             this._super(me.Renderable, "init", [0, 0, 1100, 100]);
    //         },
    //         destroy : function () {},
    //         draw : function (renderer) {
    //             var color = renderer.getColor();
    //             renderer.setColor('#5EFF7E');
    //             renderer.fillRect(0, 0, this.width, this.height);
    //             renderer.setColor(color);
    //         }
    //     })));


  },

  draw: function(renderer) {
    var color = renderer.getColor();
    renderer.setColor('grey');
    renderer.fillRect(this.left, this.top, this.width, this.height);
    renderer.setColor(color);

    this._super(me.Container, "draw", [renderer]);
  }
});
