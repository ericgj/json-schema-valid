'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , has = hasOwnProperty

module.exports = validateObject;

function validateObject(){
  var valid = true
  if (type(this.instance())!=='object') return (valid);
  valid = validateObjectMinMax.call(this) && valid;
  valid = validateObjectRequired.call(this) && valid;
  valid = validateObjectProperties.call(this) && valid;
  valid = validateObjectDependencies.call(this) && valid;
  return (valid);
}

function validateObjectMinMax(){
  var min = this.property('minProperties')
    , max = this.property('maxProperties')
    , keys = objectKeys(this.instance())
    , valid = true

  if (min){
    valid = this.assert(keys.length >= min, 
                        "too few properties",
                        "minProperties"
                       ) && valid;
  }

  if (max){
    valid = this.assert(keys.length <= max, 
                        "too many properties",
                        "maxProperties"
                       ) && valid;
  }

  return (valid);
}

function validateObjectRequired(){
  var reqs = this.property('required') || []
    , instance = this.instance()
    , valid = true

  for (var i=0;i<reqs.length;++i){
    valid = this.assert(!!has.call(instance,reqs[i]), 
                        "missing required property",
                        "required"
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

  for (var key in this.instance()){
    
    count = 0;
    withPropertyContext.call(this,key,validatePropContext);
    withPatternPropertyContexts.call(this,key,validatePropContext);

    if (count == 0) {
      if ('boolean' == type(additional)) {
        valid = this.assert(additional, 
                            'unknown property',
                            'additional'
                           ) && valid
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
  var deps = this.get('dependencies')
    , instance = this.instance()
    , valid = true
  if (!deps) return (valid);
  var self = this
  deps.each( function(key,dep){
    if (!has.call(instance,key)) return;
    if (type(dep)=='array'){
      var missing = []
      for (var i=0;i<dep.length;++i){
        if (!has.call(instance,dep[i])) missing.push(dep[i]);
      }
      valid = self.assert(missing.length == 0,
                          "has missing dependencies for " + key + ": " + JSON.stringify(missing),
                          ["dependencies",key].join('/')
                         ) && valid;
    } else if (dep.nodeType == 'Schema'){
      var ctx = self.subcontext(['dependencies',key].join('/'),'')
      valid = ctx.validate() && valid;
    }
  })
  return (valid);
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

