
var engine = require('engine'),
	View = require('../View'),
	Graphics = engine.Graphics,
	Point = engine.Point,
	Class = engine.Class;

// ShapeView Prototype - view that draws a polygon
function ShapeView(game, settings) {
	Graphics.call(this, game);
	View.call(this);

	this.settings = Class.mixin(settings, {
		fillAlpha: 0.0,
		color: 0x000000,
		borderAlpha: 0.0,
		borderColor: 0x000000,
		borderSize: 0.0,
		shape: [new Point(0, 0)],
		blendMode: engine.BlendMode.NORMAL,
	});
	
	this.fillAlpha = this.settings.fillAlpha;
	this.blendMode = this.settings.blendMode;
}

// multiple inheritence
ShapeView.prototype = Object.create(Graphics.prototype);
ShapeView.prototype.mixinPrototype(View.prototype);
ShapeView.prototype.constructor = ShapeView;

ShapeView.prototype.paint = function(top, left, bottom, right) {
	var settings = this.settings,
		offset = this.settings.offset ? this.settings.offset : { x: 0, y: 0 },
		points = this.settings.shape;
	
	this.clear();
	
	if(settings.borderSize > 0 && settings.borderAlpha > 0) {
		this.lineStyle(settings.borderSize, settings.borderColor, settings.borderAlpha);
	}
	if(settings.fillAlpha > 0) {
		this.moveTo.apply(this, points[0].clone().add(offset.x, offset.y).toArray());
		this.beginFill(settings.color, settings.fillAlpha);
	}
	if(settings.fillAlpha > 0 || (settings.borderSize > 0 && settings.borderAlpha > 0)) {
		for(var i = 1; i < points.length; i++)
			this.lineTo.apply(this, points[i].clone().add(offset.x, offset.y).toArray());
	}
	if(settings.fillAlpha > 0) {
		this.endFill();
	}
};

Point.prototype.toArray = function() {
	return [this.x, this.y];
};

module.exports = ShapeView;
