(function() {
  var heart, proto;

  heart = window.Heart = function( options ) {
    this.distance = options.distance || 1;
    this.interval = options.interval || 10;
    this.element = options.element;
    this.scrollable = this.element.querySelector( "ul" );

    if( options.start ) {
      this.start();
    }
  };

  proto = heart.prototype;

  proto._tick = function() {
    var newScrollLeft, head;

    newScrollLeft = this.element.scrollLeft = this.element.scrollLeft + this.distance;
  };

  proto.start = function() {
    var self = this;
    this.intervalId = setInterval(function() {
      self._tick();
    }, this.interval );
  };
})();
