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

    if( this.element.scrollLeft > (this._head().offsetWidth + 20) ){
      this._moveHead();
    }
  };

  proto._moveHead = function() {
    var head = this._head();

    this.scrollable.appendChild(head);
    this.element.scrollLeft = this.element.scrollLeft - head.offsetWidth;
  };

  proto._head = function() {
    return this.scrollable.querySelector( "li" );
  };

  proto.start = function() {
    var self = this;
    this.intervalId = setInterval(function() {
      self._tick();
    }, this.interval );
  };
})();
