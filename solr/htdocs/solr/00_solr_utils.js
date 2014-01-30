// Generated by CoffeeScript 1.5.0
(function() {

  window.DeferredHash = (function() {

    function DeferredHash(that, complete) {
      this.that = that;
      this.complete = complete;
      this.data = {};
      this.outstanding = {};
      this.num = 0;
      this._go = 0;
    }

    DeferredHash.prototype.add = function(key) {
      this.outstanding[key] = 1;
      return this.num++;
    };

    DeferredHash.prototype.done = function(key, data) {
      this.data[key] = data;
      delete this.outstanding[key];
      this.num--;
      if (this.num === 0 && this._go) {
        return this.complete.call(this.that, this.data);
      }
    };

    DeferredHash.prototype.go = function() {
      this._go = 1;
      if (this.num === 0) {
        return this.complete.call(this.that, this.data);
      }
    };

    return DeferredHash;

  })();

  window.EphemoralRequestRateLimiter = (function() {

    function EphemoralRequestRateLimiter(nochange_ms, lastreq_ms, operation, equal) {
      this.nochange_ms = nochange_ms;
      this.lastreq_ms = lastreq_ms;
      this.operation = operation;
      this.equal = equal != null ? equal : (function(a, b) {
        return a === b;
      });
      this.timeout = void 0;
      this.last_request = void 0;
      this.last_data = void 0;
      this._trigger();
    }

    EphemoralRequestRateLimiter.prototype.set = function(data) {
      var now,
        _this = this;
      this.data = data;
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
      this.timeout = setTimeout((function(v) {
        return _this._trigger(v);
      }), this.nochange_ms);
      now = new Date().getTime();
      if ((this.last_request == null) || now - this.last_request > this.lastreq_ms) {
        return this._trigger();
      }
    };

    EphemoralRequestRateLimiter.prototype._trigger = function() {
      if (!this.equal(this.last_data, this.data)) {
        this.last_data = this.data;
        this.last_request = new Date().getTime();
        return this.operation(this.data);
      }
    };

    EphemoralRequestRateLimiter.prototype.get = function() {
      return this.data;
    };

    return EphemoralRequestRateLimiter;

  })();

}).call(this);
