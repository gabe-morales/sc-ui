
var engine = require('engine'),
    Panel = require('../Panel'),
    Pane = require('../components/Pane'),
    Label = require('../components/Label'),
    BorderLayout = require('../layouts/BorderLayout'),
    BackgroundView = require('../views/BackgroundView'),
    Class = engine.Class;

function BorderPane(game, settings) {
  // default styles
  this.settings = Class.mixin(settings, {
    padding: [0],
    border: [0],
    gap: [0, 0],
    bg: {
      fillAlpha: 0.0,
      borderSize: 0.0,
      radius: 0.0
    }
  });

  Panel.call(this, game, new BorderLayout(this.settings.gap[0], this.settings.gap[1]));

  if(this.settings.width || this.settings.height) {
    this.setPreferredSize(
      this.settings.width, this.settings.height);
  }
  
  this.setPadding.apply(this, this.settings.padding);
  this.setBorder.apply(this, this.settings.border);

  this.bg = new BackgroundView(game, this.settings.bg);

  this.addView(this.bg);
};

BorderPane.prototype = Object.create(Panel.prototype);
BorderPane.prototype.constructor = BorderPane;

module.exports = BorderPane;
