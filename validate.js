'use strict';

var indexOf = require('indexof')
  , type = require('type')

module.exports = validate;

function validate(fn){
  var valid = true
  var combos = function(schemas){
    if (valid && fn) fn(schemas);
  }

  valid = validateType.call(this) && valid

  valid = validateTypes.call(this) && valid

  valid = validateFormat.call(this) && valid;

  valid = validateCombinations.call(this, combos) && valid;

  return (valid);
}

validate._types = {};
validate._formats = {};

validate.addType = function(key,fn){
  validate._types[key] = fn;
  return this;
}

validate.addFormat = function(key,fn){
  if (type(fn)=="regexp"){
    r = fn; fn = function(val){ return !!val.match(r) };
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
  if (!types) return true;

  types = ('array' == type(types) ? types : [types])
  var valid = this.assert((indexOf(types,actual)>=0) || 
                            (isinteger && indexOf(types,'integer')>=0), 
                          "type does not match",
                          "type"
                         );
  return (valid);
}

function validateTypes(){
  var types = validate.getTypes()
    , valid = true
  for (var k in types){
    var validator = types[k]
    valid = validator.call(this) && valid;
  }

  return (valid);
}

function validateFormat(){
  var format = this.property('format')
  if (!format) return true;

  var formatter = validate.getFormat(format)
    , valid = this.assert(!!formatter, 
                          "unknown format",
                          "format"
                         ) && 
              formatter.call(this); 
  return (valid);
}

function validateCombinations(fn){

  var allOf = this.get('allOf')
    , anyOf = this.get('anyOf')
    , oneOf = this.get('oneOf')
    , not   = this.get('not')
 
  var valids = [this.schema()], valid = true
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  if (allOf) valid = validateAllOf.call(this,collect) && valid;
  if (anyOf) valid = validateAnyOf.call(this,collect) && valid;
  if (oneOf) valid = validateOneOf.call(this,collect) && valid;
  if (not)   valid = validateNot.call(this) && valid;

  if (valid && fn) fn(valids);
  return (valid);
}


/*************
 * Combinations 
 *
 */

function validateAllOf(fn){
  var validfn = function(ctx,valid,collect){ 
    return (validate.call(ctx,collect) && valid);
  }
  return validateCombination.call(this,'allOf',true,validfn,fn);
}

function validateAnyOf(fn){
  var validfn = function(ctx,valid,collect){ 
    return (validate.call(ctx,collect) || valid);
  }
  return validateCombination.call(this,'anyOf',false,validfn,fn);
}

function validateOneOf(fn){
  var validfn = function(ctx,valid,collect){ 
    return (validate.call(ctx,collect) ? !valid : valid);
  }
  return validateCombination.call(this,'oneOf',false,validfn,fn);
}

function validateNot(){
  var ctx = this.subcontext('not')
    , not = ctx.schema
  if (!not) return;
  return (!(validate.call(ctx)));
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


