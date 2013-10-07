'use strict';

var indexOf = require('indexof')
  , type = require('type')
  , assert = require('./assert')

module.exports = validate;

function validate(fn){
  var valid = true

  var self = this
  valid = validateType.call(this, function(t){
    var validator = validate.getType(t)
    if (validator) valid = (validator.call(self) && valid);
  }) && valid

  valid = validateFormat.call(this) && valid;

  valid = validateCombinations.call(this, fn) && valid;

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

validate.getType = function(key){ return this._types[key]; }
validate.getFormat = function(key){ return this._formats[key]; }


function validateType(fn){
  var instance = this.instance
    , types = this.property('type')
  if (!types) return true;

  types = ('array' == type(types) ? types : [types])
  var i = indexOf(type(instance),types)

  var err = assert(i >= 0, "invalid type");
  if (err) this.error(err);

  if (!err && fn) fn(types[i]);

  return (!err);
}

function validateFormat(){
  var format = this.property('format')
  if (!format) return true;

  var formatter = validate.getFormat(format)
    , err = assert(!!formatter, "unknown format")
  if (err) this.error(err);

  var valid = formatter && formatter.call(this); 
  return valid;
}

function validateCombinations(fn){

  var allOf = this.get('allOf')
    , anyOf = this.get('anyOf')
    , oneOf = this.get('oneOf')
    , not   = this.get('not')
 
  var valids = [this.schema], valid = true
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
    return (validate.call(ctx,collect) && !valid);
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


