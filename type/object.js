'use strict';

module.exports = validateObject;

function validateObject(){
  var valid = true
  if (type(this.instance)!=='object') return (valid);
  valid = validateObjectMinMax.call(this) && valid;
  valid = validateObjectRequired.call(this) && valid;
  valid = validateObjectProperties.call(this) && valid;
  valid = validateObjectDependencies.call(this) && valid;
  return (valid);
}

function validateObjectMinMax(){
  var min = this.property('minProperties')
    , max = this.property('maxProperties')
    , keys = objectKeys(this.instance)
    , valid = true

  if (min){
    valid = this.assert(keys.length >= min, "too few properties") && valid;
  }

  if (max){
    valid = this.assert(keys.length <= max, "too many properties") && valid;
  }

  return (valid);
}

function validateObjectRequired(){
  var reqs = this.property('required') || []
    , valid = true

  for (var i=0;i<reqs.length;++i){
    valid = assert(!!this.getInstancePath(reqs[i]), 
                   "missing required property"
                  ) && valid;
  }
  return (valid);
}

function validateObjectProperties(){
  var valid = true
    , count = 0
    , additional = this.property('additionalProperties')
    , additionalSchema = this.get('additionalProperties')

  var validatePropContext = function(ctx){
    count++;
    valid = ctx.validate() && valid;
  }

  for (var key in this.instance){
    
    count = 0;
    withPropertyContext.call(this,key,validatePropContext);
    withPatternPropertyContexts.call(this,key,validatePropContext);

    if (count == 0) {
      if ('boolean' == type(additional)) {
        valid = this.assert(additional, 'unknown property') && valid
      }
      if (additionalSchema){
        var ctx = this.subcontext('additionalProperties',key)
        valid = ctx.validate() && valid
      }
    }
  }

  return (valid);
}


function validateObjectDependencies(){
  return true;
}


// private

function withPropertyContext(key,fn){
  var props = this.get('properties')
    , prop = props && props.get(key)
  if (!prop) return;
  var ctx = this.subcontext(['properties',key].join('/'),key);
  fn(ctx);
}

function withPatternPropertyContexts(key,fn){
  var props = this.get('patternProperties')
  if (!props) return;
  var self = this;
  props.each( function(rx,schema){
    var matcher = new RegExp(rx);
    if (matcher.test(key)){
      var ctx = self.subcontext(['patternProperties',rx].join('/'),key);
      fn(ctx);
    }
  });
}

// utils

var objectKeys = Object.keys || function(obj){
  var ks = []
  for (var k in obj) ks.push(k);
  return ks;
}

