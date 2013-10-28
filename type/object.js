'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , has = hasOwnProperty

module.exports = validateObject;

function validateObject(){
  if (type(this.instance())!=='object') return;
  validateObjectMinMax.call(this);
  validateObjectRequired.call(this);
  validateObjectProperties.call(this);
  validateObjectDependencies.call(this);
}

function validateObjectMinMax(){
  var min = this.property('minProperties')
    , max = this.property('maxProperties')
    , keys = objectKeys(this.instance())

  if (min){
    this.assert(keys.length >= min, 
                "too few properties",
                "minProperties",
                keys.length
               );
  }

  if (max){
    this.assert(keys.length <= max, 
                "too many properties",
                "maxProperties",
                keys.length
               );
  }
}

function validateObjectRequired(){
  var reqs = this.property('required') || []
    , instance = this.instance()
    , keys = objectKeys(instance)

  for (var i=0;i<reqs.length;++i){
    this.assert(!!has.call(instance,reqs[i]), 
                "missing required property",
                "required",
                keys
               );
  }
}

function validateObjectProperties(){
  var count = 0
    , self = this
    , additional = this.property('additionalProperties')
    , additionalSchema = this.get('additionalProperties')

  var validatePropContext = function(ctx,prop){
    count++;
    self.assert(ctx.validate(),
                'property "'+ prop + '" is not valid'
               );
  }

  for (var key in this.instance()){
    
    count = 0;
    withPropertyContext.call(this,key,validatePropContext);
    withPatternPropertyContexts.call(this,key,validatePropContext);

    // if no property or patternProperty schema for key
    if (count == 0) {
      if ('boolean' == type(additional)) {
        this.assert(additional, 
                    'unknown property',
                    'additional',
                    key
                   );
      }
      if (additionalSchema){
        var ctx = this.subcontext('additionalProperties',key)
        this.assert( ctx.validate(),
                     'an additional property is invalid',
                     'additionalProperties'
                   );
      }
    }
  }
}


function validateObjectDependencies(){
  var deps = this.get('dependencies')
    , instance = this.instance()
  if (!deps) return; 
  var self = this
  deps.each( function(key,dep){
    if (!has.call(instance,key)) return;
    if (type(dep)=='array'){
      var missing = []
      for (var i=0;i<dep.length;++i){
        if (!has.call(instance,dep[i])) missing.push(dep[i]);
      }
      self.assert(missing.length == 0,
                  "has missing dependencies " + JSON.stringify(missing),
                  ["dependencies",key].join('/')
                 );
    } else if (dep.nodeType == 'Schema'){
      var ctx = self.subcontext(['dependencies',key].join('/'))
      self.assert( ctx.validate(),
                   "has invalid dependency"
                 );
    }
  })
}

// private

function withPropertyContext(key,fn){
  var props = this.get('properties')
    , prop = props && props.get(key)
  if (!prop) return;
  var ctx = this.subcontext(['properties',key].join('/'),key);
  fn(ctx,key);
}

function withPatternPropertyContexts(key,fn){
  var props = this.get('patternProperties')
  if (!props) return;
  var self = this;
  props.each( function(rx,schema){
    var matcher = new RegExp(rx);
    if (matcher.test(key)){
      var ctx = self.subcontext(['patternProperties',rx].join('/'),key);
      fn(ctx,key);
    }
  });
}

// utils

var objectKeys = Object.keys || function(obj){
  var ks = []
  for (var k in obj) ks.push(k);
  return ks;
}

