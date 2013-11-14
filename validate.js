'use strict';

var isBrowser = require('is-browser')
  , indexOf = isBrowser ? require('indexof') : require('indexof-component')
  , type = isBrowser ? require('type') : require('component-type')

module.exports = validate;

function validate(fn){
  validateType.call(this);
  validateTypes.call(this);
  validateFormat.call(this);
  validateCombinations.call(this, fn);

  return (this.valid());
}

validate._types = {};
validate._formats = {};

validate.addType = function(key,fn){
  validate._types[key] = fn;
  return this;
}

validate.addFormat = function(key,fn){
  if (type(fn)=="regexp"){
    var r = fn; 
    fn = function(){ 
      var val = this.instance();
      if (val == undefined) return false;
      return !!r.test(val.toString()); 
    };
  }
  validate._formats[key] = fn;
  return this;
}

validate.getTypes = function(){ return this._types; }
validate.getFormat = function(key){ return this._formats[key]; }


function validateType(){
  var types = this.property('type')
    , instance = this.instance()
    , actual = type(instance)
    , isinteger = actual == 'number' && (instance==(instance|0))
  if (!types) return;
  if (instance === undefined) return;

  types = ('array' == type(types) ? types : [types])
  this.assert((indexOf(types,actual)>=0) || 
                (isinteger && indexOf(types,'integer')>=0), 
              "does not match type",
              "type",
              actual
             );
}

// Note: assertions done in concrete validator functions
function validateTypes(){
  var types = validate.getTypes()
  for (var k in types){
    var validator = types[k]
    validator.call(this);
  }
}

function validateFormat(){
  var format = this.property('format')
    , instance = this.instance()
  if (!format) return;
  if (instance === undefined) return;

  var formatter = validate.getFormat(format)
  if (!formatter) return; 
  
  this.assert( formatter.call(this),
              'does not match format',
              'format'
             );
}

function validateCombinations(fn){

  var allOf = this.get('allOf')
    , anyOf = this.get('anyOf')
    , oneOf = this.get('oneOf')
    , not   = this.get('not')
 
  var valids = [this.schema()]
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  if (allOf){
    this.assert( validateAllOf.call(this,collect),
                 "not all of conditions valid",
                 "allOf"
               );
  }
  if (anyOf){
    this.assert( validateAnyOf.call(this,collect),
                 "not any of conditions valid",
                 "anyOf"
               );
  }
  if (oneOf){
    this.assert( validateOneOf.call(this,collect),
                 "not any of conditions valid, or more than one of conditions valid",
                 "oneOf"
               );
  }
  if (not){
    this.assert( validateNot.call(this),
                 "not condition invalid",
                 "not"
               );
  }

  if (this.valid() && fn) fn(valids);
}


/*************
 * Combinations 
 *
 */

function validateAllOf(fn){
  var validfn = function(ctx,valid,collect){ 
    validate.call(ctx,collect);
    return (ctx.valid() && valid);
  }
  return validateCombination.call(this,'allOf',true,validfn,fn);
}

function validateAnyOf(fn){
  var validfn = function(ctx,valid,collect){ 
    validate.call(ctx,collect);
    return (ctx.valid() || valid);
  }
  return validateCombination.call(this,'anyOf',false,validfn,fn);
}

function validateOneOf(fn){
  var validfn = function(ctx,valid,collect){ 
    validate.call(ctx,collect);
    return (ctx.valid() ? !valid : valid);
  }
  return validateCombination.call(this,'oneOf',false,validfn,fn);
}

function validateNot(){
  var ctx = this.subcontext('not')
    , not = ctx.schema
  if (!not) return;
  validate.call(ctx) 
  return (!ctx.valid());
}

function validateCombination(key,valid,validfn,fn){
  var cond = this.get(key);
  if (!cond) return;

  var valids = []
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  var self = this
  cond.each( function(i,schema){
    var ctx = self.subcontext([key,i].join('/'))
    valid = validfn(ctx,valid,collect);
  });
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}


