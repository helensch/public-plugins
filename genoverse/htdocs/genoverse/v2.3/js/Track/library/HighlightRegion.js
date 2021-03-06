Genoverse.Track.HighlightRegion = Genoverse.Track.extend({
  id            : 'highlights',
  unsortable    : true,
  repeatLabels  : true,
  resizable     : false,
  border        : false,
  height        : 15,
  featureHeight : 2,
  order         : -1,
  orderReverse  : 9e99,
  controls      : 'off',
  colors        : [ '#777777', '#F08080', '#3CB371', '#6495ED', '#FFA500', '#9370DB' ],
  labels        : 'separate',
  depth         : 1,
  featureMargin : { top: 13, right: 0, bottom: 0, left: 0 },
  margin        : 0,

  constructor: function () {
    this.colorIndex = 0;
    return this.base.apply(this, arguments);
  },

  addHighlights: function (highlights) {
    for (var i = 0; i < highlights.length; i++) {
      this.model.insertFeature($.extend({ label: (highlights[i].start + '-' + highlights[i].end) }, highlights[i]));
    }

    this.reset();
  },

  removeHighlights: function (highlights) {
    var features     = this.prop('features');
    var featuresById = this.prop('featuresById');
    var bounds, h;

    highlights = highlights || $.map(featuresById, function (f) { return f; });

    for (var i = 0; i < highlights.length; i++) {
      if (highlights[i].removable === false) {
        continue;
      }

      bounds = { x: highlights[i].start, y: 0, w: highlights[i].end - highlights[i].start + 1, h: 1 };

      // RTree.remove only works if the second argument (the object to be removed) === the object found in the tree.
      // Here, while highlight is effectively the same object as the one in the tree, it does has been cloned, so the === check fails.
      // To fix this, search for the feature to remove in the location of highlight.
      h = $.grep(features.search(bounds), function (item) { return item.id === highlights[i].id; });

      if (h.length) {
        features.remove(bounds, h[0]);
      }

      delete featuresById[highlights[i].id];
    }

    if (this.prop('strand') === 1) {
      this.prop('reverseTrack').track.removeHighlights(highlights);
    }

    this.reset();
  },

  controller: Genoverse.Track.Controller.Stranded.extend({
    setDefaults: function () {
      if (this.prop('strand') === -1) {
        this.prop('labels', false);
        this.prop('border', false);
        this.prop('height', 2);
        this.prop('featureMargin').top = 0;
      }

      this.base();
    },

    setName: function (name) {
      if (this.prop('strand') === -1) {
        this.base('');
        this.minLabelHeight = 0;
        this.label.height(0);
      } else {
        this.base(name);
      }
    },

    makeImage: function (params) {
      if (this.prop('strand') === 1) {
        params.background = 'gv-full-height';
      }

      var rtn = this.base(params);
      params.container.addClass(params.background);
      return rtn;
    },

    render: function (features, img) {
      this.base(features, img);
      img.siblings('.gv-labels').css('top', this.prop('featureHeight') - this.prop('featureMargin').top);
    },

    renderBackground: function (f, img) {
      this.base(f, img);
      img.height(this.browser.wrapper.outerHeight(true));
    },

    populateMenu: function (feature) {
      var location = feature.start + '-' + feature.end;
      var menu = {
        title: feature.label ? feature.label[0] : location,
        start: false
      };

      menu[menu.title === location ? 'title' : 'Location'] = this.browser.chr + ':' + location;

      if (feature.removable !== false) {
        menu['<a class="gv-remove-highlight"  href="#">Remove this highlight</a>'] = '';
        menu['<a class="gv-remove-highlights" href="#">Remove all highlights</a>'] = '';
      }

      return menu;
    },

    click: function () {
      if (this.prop('strand') !== 1) {
        return;
      }

      var menuEl = this.base.apply(this, arguments);

      if (menuEl && !menuEl.data('highlightEvents')) {
        var track = this.track;

        menuEl.find('.gv-remove-highlight').on('click', function () {
          track.removeHighlights([ menuEl.data('feature') ]);
          return false;
        });

        menuEl.find('.gv-remove-highlights').on('click', function () {
          track.removeHighlights();
          return false;
        });

        menuEl.data('highlightEvents', true);
      }
    }
  }),

  model: Genoverse.Track.Model.Stranded.extend({
    url: false,

    insertFeature: function (feature) {
      feature.id   = feature.start + '-' + feature.end;
      feature.sort = feature.start;

      if (!feature.color) {
        var colors = this.prop('colors');
        var i      = this.prop('colorIndex');

        feature.color = colors[i++];

        this.prop('colorIndex', colors[i] ? i : 0);
      }

      if (!this.featuresById[feature.id]) {
        this.base(feature);
      }
    },

    findFeatures: function () {
      return Genoverse.Track.Model.prototype.findFeatures.apply(this, arguments);
    }
  }),

  view: Genoverse.Track.View.extend({
    draw: function (features, featureContext, labelContext, scale) {
      if (this.prop('strand') === 1) {
        featureContext.fillStyle = '#FFF';
        featureContext.fillRect(0, 0, featureContext.canvas.width, featureContext.canvas.height);
      }

      this.base(features, featureContext, labelContext, scale);
    },

    drawBackground: function (features, context, params) {
      if (this.prop('strand') === -1) {
        return;
      }

      for (var i = 0; i < features.length; i++) {
        context.fillStyle = features[i].color;

        this.drawFeature($.extend(true, {}, features[i], {
          x           : features[i].position[params.scale].X,
          y           : 0,
          width       : features[i].position[params.scale].width,
          height      : context.canvas.height,
          color       : this.shadeColor(context.fillStyle, 0.8),
          border      : features[i].color,
          label       : false,
          decorations : true
        }), context, false, params.scale);
      }
    },

    decorateFeature: function (feature, context, scale) {
      var x1   = feature.x + 0.5;
      var x2   = x1 + feature.width;
      var draw = false;

      context.strokeStyle = feature.border;
      context.lineWidth   = 2;
      context.beginPath();

      if (x1 >= 0 && x1 <= this.width) {
        context.moveTo(x1, feature.y);
        context.lineTo(x1, feature.y + feature.height);
        draw = true;
      }

      if (x2 >= 0 && x2 <= this.width) {
        context.moveTo(x2, feature.y);
        context.lineTo(x2, feature.y + feature.height);
        draw = true;
      }

      if (draw) {
        context.stroke();
      }

      context.lineWidth = 1;
    }
  })
});