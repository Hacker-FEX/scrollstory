(function(factory) {
  if (typeof define === 'function' && define.amd) {
    define(['jquery', window, document, undefined], factory);
  } else {
    factory(jQuery, window, document, undefined);
  }
}(function($, window, document, undefined) {
  var pluginName = 'scrollStory';
  var defaults = {

    // jquery object, dom element, or array of values, or null (to use existing DOM)
    content: null,

    // Only used if content is a dom element or null. Should be a class selector
    contentSelector: '.story',

    // Enables keys to navigate menu
    keyboard: true,

    // Offset from top used in the programatic scrolling of an
    // item to the focus position. Useful in the case of thinks like
    // top nav that might obscure part of an item if it goes to 0.
    scrollOffset: 0,

    // Offset from top to trigger a change
    triggerOffset: 0,

    // // Activate the item closest to the offset, even if it's below the offset.
    // preOffsetActivation: false,

    // // Automatically activate the first item on page load, regardless of its position
    // // relative to the offset and the 'preOffsetActivation' setting.
    // // With 'preOffsetActivation:true', this is ignored.
    // autoActivateFirst: true,

    // // If 'autoActivateFirst:false' and 'preOffsetActivation:true', app logic would dictate the
    // // first item would activate after a 1px scroll. Usually, we want to delay that
    // // first activation until the first item is to the offset, but maintain the activation
    // // behavior of other items.
    // //
    // // By default, we delay the activation on first item. Set to false otherwise. No effect
    // // if 'autoActivateFirst' is true or 'preOffsetActivation' is false.
    // delayFirstActivationToOffset: true,

    // // Updated offsets on window resize? useful for responsive layouts
    // updateOffsetsOnResize: true,

    // // Automated scroll speed in ms. Set to 0 to remove animation.
    // speed: 800,

    // // Whether to keep track of which individual elements are in the viewport.
    // checkViewportVisibility: false,

    // // scroll-based events are either 'debounce' or 'throttle'
    throttleType: 'throttle',

    // frequency in milliseconds to perform scroll-based functions. Scrolling functions 
    // can be CPU intense, so higher number can help performance.
    scrollSensitivity: 100,

    // options to pass to underscore's throttle or debounce for scroll
    // see: http://underscorejs.org/#throttle && http://underscorejs.org/#debounce
    throttleTypeOptions: null,

    itembuild: function() {}
  };

  // static across all plugin instances
  // so we can uniquely ID elements
  var instanceCounter = 0;

  function Plugin(element, options) {
    this.el = element;
    this.$el = $(element);
    this.$win = $(window);
    this.options = $.extend({}, defaults, options);
    this._defaults = defaults;
    this._name = pluginName;
    this._instanceId = (function(){
      return 'scrollStory_'+instanceCounter;
    })();
    this.init();
  }

  Plugin.prototype = {
    init: function() {
      this.$el.addClass('scrollStoryContainer');

      /**
       * List of all items, and a quick lockup hash
       * Data populated via _prepItems* methods
       */
      this.items = [];
      this.itemsById = {};
      this.categories = [];
      this.tags = [];

      /**
       * Index of active item. Maintained by .focus
       * @type {Number}
       */
      this.activeIndex = 0;

      /**
       * Tracks if any items are yet
       * active. Events dispatched when
       * this changes.
       * @type {Boolean}
       */
      this.isActive = false;

      /**
       * Various viewport properties cached to this_.viewport
       */
      this.setViewport();

      /**
       * Convert data from outside of widget into
       * items and, if needed, categories of items
       */
      this.addItems(this.options.content);

      this.updateOffsets();

      /**
       * scroll is throttled and bound to plugin
       */
      var scrollThrottle = (this.options.throttleType === 'throttle') ? throttle : debounce;
      var boundScroll = scrollThrottle(this.onScroll.bind(this), this.options.scrollSensitivity, this.options.throttleTypeOptions);
      $(window, 'body').scroll(boundScroll);

      instanceCounter = instanceCounter + 1;
    },


    /**
     * Update viewport rectangle coordinates cache
     */
    setViewport: function() {
      var width = this.$win.width();
      var height = this.$win.height();
      var top = this.$win.scrollTop();
      var left = this.$win.scrollLeft();
      var bottom = height + top;
      var right = left + width;

      this._viewport = {
        width: width,
        height: height,
        top: top,
        left: left,
        bottom: bottom,
        right: right
      };
    },


    /**
     * Return viewport coordinates
     * 
     * @return {Object}
     */
    getViewport: function() {
      if (typeof this._viewport === 'undefined') {
        this.setViewport();
      }

      return this._viewport();
    },


    /**
     * Return array of all items
     * @return {Array}
     */
    getItems: function() {
      return this.items;
    },


    /**
     * Given an item id, return it.
     * 
     * @param  {string} id
     * @return {Object/Boolean}
     */
    getItemById: function(id) {
      var item = this.itemsById[id];
      if (item) {
        return this.items[item.index];
      } else {
        return false;
      }
    },


    /**
     * Given an item index, return it.
     * 
     * @param  {Integer} index
     * @return {Object/Boolean}
     */
    getItemByIndex: function(index) {
      if (index >= 0 && index < this.items.length) {
        return this.items[index];
      } else {
        return false;
      }
    },


    /**
    * Return an array of items that pass an abritrary truth test.
    *
    * Example: this.getItemsBy(function(item){return item.domData.slug=='josh_williams'})
    *
    * @param {Function} truthTest The function to check all items against
    * @return {Array} Array of item objects
    */
    getItemsBy: function(truthTest) {
      if (typeof truthTest !== 'function') {
        throw new Error('You must provide a truthTest function');
      }

      return this.getItems().filter(function(item){
        return truthTest(item);
      });
    },

    /**
     * Returns an array of items where all the properties
     * match an item's properties. Property tests can be
     * any combination of:
     *
     * 1. Values
     * this.getItemsWhere({index:2});
     * this.getItemsWhere({filtered:false});
     * this.getItemsWhere({category:'cats', width: 300});
     *
     * 2. Methods that return a value 
     * this.getItemsWhere({width: function(width){ return 216 + 300;}});
     * 
     * 3. Methods that return a boolean
     * this.getItemsWhere({index: function(index){ return index > 2; } });
     *
     * Mix and match:
     * this.getItemsWehre({filtered:false, index: function(index){ return index < 30;} })
     * 
     * @param  {Object} properties
     * @return {Array} Array of item objects
     */
    getItemsWhere: function(properties) {
      var keys,
          items =[]; // empty if properties obj not passed in

      if ($.isPlainObject(properties)) {
        keys = Object.keys(properties); // properties to check in each item
        items = this.getItemsBy(function(item){
          var isMatch = keys.every(function(key){
            var match;

            // type 3, method that runs a boolean
            if (typeof properties[key] === 'function') {
              match = properties[key](item[key]);

              // type 2, method that runs a value
              if (typeof match !== 'boolean') {
                match = item[key] === match;
              }

            } else {
              // type 1, value
              match = item[key] === properties[key];
            }
            return match;
          });

          if (isMatch) {
            return item;
          }
        });
      }

      return items;
    },

    /**
     * Get items that are atleast partially
     * visible in viewport
     * @return {[type]} [description]
     */
    getItemsInViewport: function() {

      // is widget keeping track on scroll?
      // if (!this.options.checkViewportVisibility) {
      //   this._checkViewportVisibility();
      // }

      // return _.filter(this.getItems(), function(item) {
      //   return item.inViewport;
      // });
    },


    getActiveItem: function() {

    },

    setActiveItem: function() {
      console.log('set', this._instanceId);
      

      // var triggerOffset = this.options.triggerOffset;
      // var activeItem;



      // only check items that aren't filtered
      this.getItemsBy(function(item){return !item.filtered;}).forEach(function(item){
        var rect = item.el[0].getBoundingClientRect();

        console.log(rect.top - item.topOffset);
      });
    },


    updateOffsets: function() {
      console.log('update offsets');
      var body = document.body;
      var docElem = document.documentElement;
      var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
      var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;
      var clientTop = docElem.clientTop || body.clientTop || 0;
      var clientLeft = docElem.clientLeft || body.clientLeft || 0;
      var items = this.getItems();
      var i = 0;
      var length = items.length;
      var item;
      var box;

      for (i = 0; i < length; i++) {
          item = items[i];
          box = item.el[0].getBoundingClientRect();
          item.width = box.width;
          item.height = box.height;
          item.topOffset = box.top +  scrollTop - clientTop;
          item.leftOffset = box.left + scrollLeft - clientLeft;
      }
    },

    /**
     * Iterate through items and update their top
     * offset. Useful if items have been added,  removed, 
     * repositioned externally, and after window resize
     */
    // updateOffsets: function() {
    //   var items = this.getItems(),
    //       i = 0,
    //       length = items.length,
    //       item;

    //   for (i = 0; i < length; i++) {
    //       item = items[i];
    //       item.el = $('#' + item.id);
    //       item.topOffset = item.el.offset().top;
    //       item.width = item.el.width();
    //       item.height = item.el.height();
    //   }

    //   this._trigger('offsetschange', null, {});

    //   // check viewport visibility of items
    //   if (this.options.checkViewportVisibility) {
    //       // this._checkViewportVisibility();
    //   }
    // },

    /**
     * Add items to the running list given any of the 
     * following inputs:
     *
     * 1. jQuery selection. Items will be generated
     * from the selection, and any data-* attributes
     * will be added to the item's domData object.
     * 
     * 2. A string selector to search for elements 
     * within our container. Items will be generated
     * from that selection, and any data-* attributes
     * will be added to the item's domData object.
     * 
     * 3. Array of objects. All needed markup will
     * be generated, and the data in each object will 
     * be added to the item's domData object.
     *
     * 4. If no 'items' param, we search for items
     * using the options.contentSelector string.
     *
     *
     * TODO: ensure existing items aren't re-added.
     * This is expecially important for the empty items
     * option
     *
     * @param {jQuery Object/String/Array} items
     */
    addItems: function(items) {

      // use an existing jQuery selection
      if (items instanceof jQuery) {
        this._prepItemsFromSelection(items);

        // a custom selector to use within our container
      } else if (typeof items === 'string') {
        this._prepItemsFromSelection(this.$el.find(items));

        // array objects, which will be used to create markup
      } else if ($.isArray(items)) {
        this._prepItemsFromData(items);

        // search for elements with the default selector
      } else {
        this._prepItemsFromSelection(this.$el.find(this.options.contentSelector));
      }
    },


    onScroll: function() {
      this.setActiveItem();
    },


    /**
     * Given a jQuery selection, add those elements
     * to the internal items array.
     *
     * @param  {Object} $jQuerySelection
     */
    _prepItemsFromSelection: function($selection) {
      var that = this;
      $selection.each(function() {
        that._addItem({}, $(this));
      });
    },

    /**
     * Given array of data, append markup and add
     * data to internal items array.
     * @param  {Array} items
     */
    _prepItemsFromData: function(items) {
      var that = this;

      // drop period from the default selector, so we can 
      // add it to the class attr in markup
      var selector = this.options.contentSelector.replace(/\./g, '');

      var $items = $();
      items.forEach(function(data) {
        var $item = $('<div class="' + selector + '"></div>');
        that._addItem(data, $item);
        $items = $items.add($item);
      });

      this.$el.append($items);
    },

    /**
     * Given item user data, and an aleady appended
     * jQuery object, create an item for internal items array.
     *
     * @param {Object} data
     * @param {jQuery Object} $el
     */
    _addItem: function(data, $el) {
      var offset = $el.offset();
      var item = {
        index: this.items.length,

        // id is from markup id attribute, domData or dynamically generated
        id: $el.attr('id') ? $el.attr('id') : (data.id) ? data.id : 'story' + instanceCounter + '-' + this.items.length,

        // item's domData is from client data or data-* attrs
        domData: $.extend({}, data, $el.data()),

        category: data.category, // optional category this item belongs to
        tags: data.tags || [], // optional tag or tags for this item. Can take an array of string, or a cvs string that'll be converted into array of strings.
        el: $el,
        width: $el.width(),
        height: $el.height(),

        // cached distance from top and left. 
        // Needs updating on DOM changes/repaints
        topOffset: offset.top,
        leftOffset: offset.left,

        // previousItem: previousItem,
        nextItem: false,

        // in-focus item
        active: false,

        // has item been filtered
        filtered: false,

        // on occassion, the scrollToItem() offset may need to be adjusted for a
        // particular item. this overrides this.options.scrollOffset set on instantiation
        scrollOffset: false,

        // on occassion we want to trigger an item at a non-standard offset.
        triggerOffset: false,

        // if any part is viewable in the viewport.
        // only updated if this.options.checkViewportVisibility is true
        inViewport: false

      };

      // ensure id exist in dom
      if (!$el.attr('id')) {
        $el.attr('id', item.id);
      }

      // global record
      this.items.push(item);

      // quick lookup
      this.itemsById[item.id] = {
        index: item.index,
        id: item.id
      };

      this._trigger('itembuild', null, {
        item: item
      });
    },


    /**
     * Manage callbacks and event dispatching.
     *
     * Based very heavily on jQuery UI's implementaiton
     * https://github.com/jquery/jquery-ui/blob/9d0f44fd7b16a66de1d9b0d8c5e4ab954d83790f/ui/widget.js#L492
     *
     * @param  {String} eventType
     * @param  {Object} event
     * @param  {Object} data
     */
    _trigger: function(eventType, event, data) {
      var callback = this.options[eventType];
      var prop, orig;

      if ($.isFunction(callback)) {
        data = data || {};

        event = $.Event(event);
        event.target = this.el;
        event.type = eventType;

        // copy original event properties over to the new event
        orig = event.originalEvent;
        if (orig) {
          for (prop in orig) {
            if (!(prop in event)) {
              event[prop] = orig[prop];
            }
          }
        }

        // fire event
        this.$el.trigger(event, data);

        // call the callback
        this.options[eventType](event, data);
      }
    }
  }; // end plugin.prototype

  
  /**
   * Utility methods
   * 
   * now(), debounce() and throttle() are from on Underscore.js:
   * https://github.com/jashkenas/underscore
   */
  
  /**
   * Underscore's now():
   * http://underscorejs.org/#now
   * @return {Function}
   */
  var now = Date.now || function() {
    return new Date().getTime();
  };

  /**
   * Underscore's debounce:
   * http://underscorejs.org/#debounce
   */
  var debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) {
            context = args = null;
          }
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  /**
   * Underscore's throttle:
   * http://underscorejs.org/#throttle
   */
  var throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) {
      options = {};
    }
    var later = function() {
      previous = options.leading === false ? 0 : now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) {
        context = args = null;
      }
    };
    return function() {
      var timestamp = now();
      if (!previous && options.leading === false) {
        previous = timestamp;
      }
      var remaining = wait - (timestamp - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = timestamp;
        result = func.apply(context, args);
        if (!timeout) {
          context = args = null;
        }
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // A really lightweight plugin wrapper around the constructor,
  // preventing multiple instantiations
  $.fn[pluginName] = function(options) {
    return this.each(function() {
      if (!$.data(this, 'plugin_' + pluginName)) {
        $.data(this, 'plugin_' + pluginName, new Plugin(this, options));
      }
    });
  };
}));