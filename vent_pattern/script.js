(function(jQuery) {

  // App module
  var App = function() {

    var app = this;
    var vent = app.vent = _.clone(Backbone.Events); // shared event
    app.M = {};
    app.V = {};

    // Models / Collections

    app.M.Item = Backbone.Model.extend({
      initialize: function() {
        this.isRoot = false;
        this.convertItems();
        this.listenTo(this, 'change:items', this.convertItems);
      },
      convertItems: function() {
        var items = this.get('items');
        if(!items) {
          return;
        }
        this.itemCollection = new app.M.ItemCollection(items);
      }
    });

    app.M.ItemCollection = Backbone.Collection.extend({
      model: app.M.Item
    });

    app.M.TopItem = app.M.Item.extend({
      url: 'data/tree.json',
      initialize: function() {
        app.M.Item.prototype.initialize.apply(this, arguments);
        this.isRoot = true;
        this.listenTo(this, 'change:items', function() {
          vent.trigger('datasync', this);
        });
      }
    });

    // Views

    app.V.Item = Backbone.View.extend({
      tagName: 'li',
      className: 'list-group-item',
      events: {
        'click a': '_clickHandler'
      },
      render: function() {
        var m = this.model;
        var label = m.get('label');
        var url = m.get('url') || '#';
        this.$el.html('<a href="' + url + '">' + label + '</a>');
      },
      _clickHandler: function(e) {
        var href = $(e.currentTarget).attr('href');
        if(href !== '#') {
          return;
        }
        e.preventDefault();
        vent.trigger('currentitemchange', this.model);
      }
    });

    app.V.List = Backbone.View.extend({
      initialize: function() {
        _.bindAll(this, 'render');
        this._itemViews = [];
        vent.on('datasync', this.render);
        this.listenTo(vent, 'currentitemchange', this.render);
      },
      render: function(itemModel) {
        var self = this;
        self._removePreviousItems();
        self.$el.empty().html('<ul class="list-group"></ul>');
        var $ul = self.$('ul');
        itemModel.itemCollection.each(function(model) {
          var itemView = new app.V.Item({
            model: model
          });
          itemView.render();
          $ul.append(itemView.el);
          self._itemViews.push(itemView);
        });
      },
      _removePreviousItems: function() {
        if(!this._itemViews.length) {
          return;
        }
        _.each(this._itemViews, function(view) {
          view.remove();
        });
        this._itemViews.length = 0;
      }
    });

    app.V.BackTop = Backbone.View.extend({
      events: {
        'click a': '_clickHandler'
      },
      initialize: function() {
        this.hide();
        this.listenTo(vent, 'currentitemchange', this._handleItemChange);
      },
      show: function() {
        this.$el.show();
      },
      hide: function() {
        this.$el.hide();
      },
      _handleItemChange: function(itemModel) {
        if(itemModel.isRoot) {
          this.hide();
        } else {
          this.show();
        }
      },
      _clickHandler: function(e) {
        e.preventDefault();
        this.trigger('click');
      }
    });

    // setup

    app.setup = function() {
      var topItem = new app.M.TopItem;
      var list = new app.V.List({ el: '#list' });
      var backTop = new app.V.BackTop({ el: '#backTop' });
      topItem.fetch();
      backTop.on('click', function() {
        vent.trigger('currentitemchange', topItem);
      });
    };

    app.setup();
    
  };

  $(function() {
    var app = new App;
  });

})($);

