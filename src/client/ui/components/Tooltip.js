
var engine = require('engine'),
	Panel = require('../Panel'),
	Label = require('./Label'),
	Layout = require('../Layout'),
	BorderLayout = require('../layouts/BorderLayout'),
	RasterLayout = require('../layouts/RasterLayout'),
	BackgroundView = require('../views/BackgroundView'),
	ShapeView = require('../views/ShapeView'),
	Point = engine.Point,
	Class = engine.Class;

/* Tooltip Prototype - creates a Tooltip */
function Tooltip(game, string, component, settings) {
	Panel.call(this, game, new BorderLayout());

	// default styles
	this.settings = Class.mixin(settings, {
		padding: [0],
		border: [0],
		message: {
			padding: [9],
			border: [0],
			bg: {
				fillAlpha: 1.0,
				color: 0x000000,
				borderAlpha: 1.0,
				borderColor: 0x3868B8,
				borderSize: 2.0,
				blendMode: engine.BlendMode.NORMAL,
				radius: 0.0
			},
			text: {
				fontName: 'medium',
				tint: 0xCCCCCC
			}
		}
	});
	
	this.setPadding.apply(this, this.settings.padding);
	this.setBorder.apply(this, this.settings.border);
	
	this.component = component;
	this.visible = false;
	
	// build label and arrow
	this.message = new Label(game, string, this.settings.message);
	this.arrowPanel = new ArrowPanel(game, {bg: this.settings.message.bg});
	
	// build tooltip
	this.addPanel(Layout.CENTER, this.message);
	this.addPanel(Layout.CENTER, this.arrowPanel);
	
	// wait to attach
	game.load.on('loadcomplete', this.attach, this);
}

Tooltip.prototype = Object.create(Panel.prototype);
Tooltip.prototype.constructor = Tooltip;

Tooltip.prototype._inputOver = function() {
	this.visible = true;
	this.invalidate();
};

Tooltip.prototype._inputOut = function() {
	this.visible = false;
	this.invalidate();
};

// adds tooltip to component
Tooltip.prototype.attach = function() {
	var root = this.component;
	
	while(root.parent instanceof Panel)
		root = root.parent;
	
	this.raster = new Panel(this.game, new RasterLayout());
	
	// event handling
	if(!this.component.bg.inputEnabled) {
		this.component.bg.inputEnabled = true;
		this.component.bg.input.priorityID = 2;
		this.component.bg.alpha = 0.75;
	}
	
	this.component.bg.on('inputOver', this._inputOver, this);
	this.component.bg.on('inputOut', this._inputOut, this);
	
	this.component.tooltip = this;
	this.component.repaint = function() {
		Panel.prototype.repaint.call(this);
		this.tooltip.update();
	};
	
	// add panels and place tooltip
	this.raster.addPanel(Layout.NONE, this);
	root.addPanel(Layout.NONE, this.raster);
}

// updates the position and direction of tooltip
Tooltip.prototype.update = function() {
	var direction = this.determineDirection(),
		loc = Point.parse(this.component.getAbsoluteLocation()),
		pos;
	if(direction !== this.settings.direction) {
		this.settings.direction = direction;
		this.arrowPanel.readjust(direction);
	}
	pos = this.calcLocation(direction);
	loc.add(pos.x, pos.y);
	this.setLocation(loc.x, loc.y);
};

// determines where the Tooltip should be located based on direction
Tooltip.prototype.calcLocation = function(direction) {
	var toolPS = this.getPreferredSize(),
		compPS = this.component.getPreferredSize();
	switch(direction) {
		case Tooltip.UP:
			return {x: (compPS.width - toolPS.width)/2, y: compPS.height};
		case Tooltip.LEFT:
			return {x: compPS.width, y: (compPS.height - toolPS.height)/2};
		case Tooltip.DOWN:
			return {x: (compPS.width - toolPS.width)/2, y: -toolPS.height};
		case Tooltip.RIGHT:
			return {x: -toolPS.width, y: (compPS.height - toolPS.height)/2};
		default:
			throw new Error("Invalid Direction");
	}
};

// determines the correct size for the raster panel to fit inside its parent
Tooltip.prototype.calcPreferredSize = function() {
	var compPS = this.component.getPreferredSize(),
		compPD = this.component.padding;
	return {
		width: compPS.width - compPD.left - compPD.right,
		height: compPS.height - compPD.top - compPD.bottom
	};
};

// calculates which direction the Tooltip should face based on available space
Tooltip.prototype.determineDirection = function() {
	var windowDim = {
			width: window.innerWidth || document.documentElement.clientWidth ||
				document.body.clientWidth,
			height: window.innerHeight || document.documentElement.clientHeight ||
				document.body.clientHeight
		},
		absLocation = this.component.getAbsoluteLocation(),
		spaceUp = absLocation.y,
		spaceDown = windowDim.height - (spaceUp + this.component.width),
		spaceLeft = absLocation.x,
		spaceRight = windowDim.width - (spaceLeft + this.component.height),
		direction;
	
	if(global.Math.max(spaceUp, spaceDown) >= global.Math.max(spaceLeft, spaceRight)) {
		if(spaceUp >= spaceDown)
			direction = Tooltip.DOWN;
		else
			direction = Tooltip.UP;
	}
	else {
		if(spaceLeft >= spaceRight)
			direction = Tooltip.RIGHT;
		else
			direction = Tooltip.LEFT;
	}
	return direction;
};

// directional constants to place Tooltip (relative to parent)
Tooltip.UP = 1;
Tooltip.LEFT = 2;
Tooltip.DOWN = 3;
Tooltip.RIGHT = 4;

/* ArrowPanel - uses two panels to draw an arrow with a border*/
function ArrowPanel(game, settings) {
	Panel.call(this, game);
	
	this.settings = Class.mixin(settings, {
		padding: [0],
		border: [0],
		size: 5.0,
		bg: {
			fillAlpha: 0.0,
			color: 0x000000,
			borderAlpha: 0.0,
			borderColor: 0x000000,
			borderSize: 0.0,
		}
	});
	
	this.setPadding.apply(this, this.settings.padding);
	this.setBorder.apply(this, this.settings.border);
	
	this.settings.arrowbg = {
		size: this.settings.size + this.settings.bg.borderSize,
		offset: global.Math.round(this.settings.bg.borderSize/2),
		shapeOffset: 0,
		sh: {
			fillAlpha: this.settings.bg.borderAlpha,
			color: this.settings.bg.borderColor,
		}
	};
	this.settings.arrowfg = {
		size: this.settings.size,
		offset: global.Math.round(this.settings.bg.borderSize/2),
		shapeOffset: this.settings.bg.borderSize,
		sh: {
			fillAlpha: this.settings.bg.fillAlpha,
			color: this.settings.bg.color,
		}
	};
	
	this.arrowbg = new Arrow(game, this.settings.arrowbg);
	this.arrowfg = new Arrow(game, this.settings.arrowfg);
	
	// build arrows
	this.addPanel(Layout.USE_PS_SIZE, this.arrowbg);
	this.addPanel(Layout.USE_PS_SIZE, this.arrowfg);
}

ArrowPanel.prototype = Object.create(Panel.prototype);
ArrowPanel.prototype.constructor = ArrowPanel;

// redirects and repositions arrows
ArrowPanel.prototype.readjust = function(direction) {
	this.constraint = this.getLayoutConstraint(direction);
	this.arrowbg.readjust(direction);
	this.arrowfg.readjust(direction);
};

// returns the correct layout constraint based on the direction
ArrowPanel.prototype.getLayoutConstraint = function(direction) {
	switch(direction) {
		case Tooltip.UP:
			return Layout.TOP;
		case Tooltip.LEFT:
			return Layout.LEFT;
		case Tooltip.DOWN:
			return Layout.BOTTOM;
		case Tooltip.RIGHT:
			return Layout.RIGHT;
		default:
			throw new Error("Invalid Direction");
	}
};

/* Arrow Prototype - draws and arrow as a triangle using a ShapeView */
function Arrow(game, settings) {
	Panel.call(this, game);
	
	this.settings = Class.mixin(settings, {
		padding: [0],
		border: [0],
		offset: 0,
		shapeOffset: 0,
		size: 0.0,
		sh: {
			fillAlpha: 0.0,
			color: 0x000000,
			borderAlpha: 0.0,
			borderColor: 0x000000,
			borderSize: 0.0,
		}
	});
	
	this.setPadding.apply(this, this.settings.padding);
	this.setBorder.apply(this, this.settings.border);
	
	this.sh = new ShapeView(game, this.settings.sh);
	
	// build arrow
	this.addView(this.sh);
}

Arrow.prototype = Object.create(Panel.prototype);
Arrow.prototype.constructor = Arrow;

// repositions and redirects arrow according to the new direction
Arrow.prototype.readjust = function(direction) {
	var ps = this.calcPreferredSize(direction);
	this.setPreferredSize(ps.width, ps.height);
	this.sh.settings.shape = this.makeShape(direction);
	this.sh.settings.offset = this.calcOffset(direction);
	this.repaint();
};

// sets the minimum size required for the arrow
// size is readjusted for the shift of the arrows toward the center message label
Arrow.prototype.calcPreferredSize = function(direction) {
	var	size = this.settings.size,
		offset = this.settings.offset,
		shapeOffset = this.settings.shapeOffset;
	switch(direction) {
		case Tooltip.UP:
		case Tooltip.DOWN:
			return {width: size*2, height: size+shapeOffset-offset};
		case Tooltip.LEFT:
		case Tooltip.RIGHT:
			return {width: size+shapeOffset-offset, height: size*2};
		default:
			throw new Error("Invalid Direction");
	}
};

// calculates the offset needed to align the arrows
Arrow.prototype.calcOffset = function(direction) {
	var offset = this.settings.offset;
	switch(direction) {
		case Tooltip.UP:
			return new Point(0, offset);
		case Tooltip.LEFT:
			return new Point(offset, 0);
		case Tooltip.DOWN:
			return new Point(0, -offset);
		case Tooltip.RIGHT:
			return new Point(-offset, 0);
		default:
			throw new Error("Invalid Direction");
	}
};

// creates arrow shapes and aligns them relative to the Label at the center
Arrow.prototype.makeShape = function(direction) {
	var size = this.settings.size,
		ps = this.getPreferredSize();
	switch(direction) {
		case Tooltip.UP:
			return [
				new Point(0, ps.height),
				new Point(ps.width/2, ps.height-size),
				new Point(ps.width, ps.height)
			];
		case Tooltip.LEFT:
			return [
				new Point(ps.width, 0),
				new Point(ps.width-size, ps.height/2),
				new Point(ps.width, ps.height)
			];
		case Tooltip.DOWN:
			return [
				new Point(0, 0),
				new Point(ps.width/2, size),
				new Point(ps.width, 0)
			];
		case Tooltip.RIGHT:
			return [
				new Point(0, 0),
				new Point(size, ps.height/2),
				new Point(0, ps.height)
			];
		default:
			throw new Error("Invalid Direction");
	}
};

module.exports = Tooltip;
