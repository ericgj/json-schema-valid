'use strict';

var indexOf = require('indexof')
  , type  = require('type')
  , core  = require('json-schema-core')
  , Schema = core.Schema

/* not sure how far to break things down

var validateSchema = require('./validators/schema')
  , validateType   = require('./validators/type')
  , validateFormat = require('./validators/format')
  , validateCombinations = require('./validators/combinations')
  , validateArray = require('./validators/array')
  , validateBoolean = require('./validators/boolean')
  , validateNumber = require('./validators/number')
  , validateObject = require('./validators/object')
  , validateString = require('./validators/string')
  , validateAllOf  = require('./validators/allof')
  , validateAnyOf  = require('./validators/anyof')
  , validateOneOf  = require('./validators/oneof')
  , validateNot    = require('./validators/not')

var formatDate = require('./formatters/date')
  , formatTime = require('./formatters/time')
  , formatUTC  = require('./formatters/utc')
  , formatRegex = require('./formatters/regex')

*/


var TYPE_VALIDATORS = {
  'array': validateArray,
  'boolean': validateBoolean,
  'integer': validateNumber,
  'null': noop,
  'number': validateNumber,
  'object': validateObject,
  'string': validateString
}

// Note: built-in

var FORMAT_VALIDATORS = {
  'date': formatDate,
  'time': formatTime,
  'utc-millisec': formatUTC,
  'regex': formatRegex
}

/******************************** 
 * Schema plugin
 * adds validate() to correlation
 *
 */
module.exports = plugin;

function plugin(target){
  target.addBinding('validate',validateBinding);
}

plugin.addFormatter(key,fn){
  FORMAT_VALIDATORS[key] = fn;
  return this;
}

function validateBinding(fn){
  var schema = this.schema
    , instance = this.instance
  if (!schema || !instance) return; 
  Emitter(this);    // adds emitter methods/state to correlation
  validate.call(schema, instance, { emitter: this }, fn);
}


/***************************
 * Validation implementation
 *
 */
function validate(instance,ctx,fn){

  ctx = ctx || {};

  validateType.call(this, instance, ctx, function(t){
    TYPE_VALIDATORS[t].call(this, instance, ctx);
  })

  validateFormat.call(this, instance, ctx);

  validateCombinations.call(this, instance, ctx, fn);

})


function validateType(instance,ctx,fn){
  var types = this.property('type') || 'object'
    , types = ('array' == type(types) ? types : [types])
    , i = indexOf(type(instance),types)

  var err = assert(i >= 0, "invalid type");
  if (err) emitError(err,instance,ctx);

  if (!err && fn) fn(types[i]);

  return (!err);
}

function validateFormat(instance,ctx){
  var format = this.property('format')
  if (!format) return true;

  var formatter = FORMAT_VALIDATORS[format]
    , err = assert(!!formatter, "unknown format")
  if (err) emitError(err,instance,ctx);

  var valid = formatter && formatter.call(this,instance,ctx); 
  return valid;
}

function validateCombinations(instance,ctx,fn){

  var allOf = this.get('allOf')
    , anyOf = this.get('anyOf')
    , oneOf = this.get('oneOf')
    , not   = this.get('not')
 
  var valids = [], valid = true
  var collect = function(schemas){
    valids.concat.apply(valids,schemas);
  }

  if (allOf) valid = validateAllOf.call(this,instance,ctx,collect) && valid;
  if (anyOf) valid = validateAnyOf.call(this,instance,ctx,collect) && valid;
  if (oneOf) valid = validateOneOf.call(this.instance,ctx,collect) && valid;
  if (not)   valid = validateNot.call(this,instance,ctx) && valid;

  if (valid && fn){
    valids.length > 0 ? fn(Schema.allOf(valids))   // 'reduce' to union schema
                      : fn(this);
  }

  return (valid);
}


// combinations

function validateAllOf(instance,ctx,fn){
  var allof = this.get('allOf')
  if (!allof) return;

  var valids = [], valid = true
  allof.each( function(schema){
    valid = validate.call(schema,instance,ctx) && valid
    if (valid) valids.push(schema);
  }
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}

function validateAnyOf(instance,ctx,fn){
  var anyof = this.get('anyof')
  if (!anyof) return;

  var valids = [], valid = false
  anyof.each( function(schema){
    valid = validate.call(schema,instance,ctx) || valid
    if (valid) valids.push(schema);
  }
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}

function validateOneOf(instance,ctx,fn){
  var oneof = this.get('oneof')
  if (!oneof) return;

  var valids = [], valid = false
  oneof.each( function(schema){
    valid = validate.call(schema,instance,ctx) && !valid
    if (valid) valids.push(schema);
  }
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}

function validateNot(instance,ctx){
  var not = this.get('not'); if (!not) return;
  return (!(validate.call(not,instance,ctx)));
}








// utils

function assert(value, message){
  return (!value ? new Error(message) : undefined)
}

function emitError(err,instance,ctx){
  ctx.emitter && ctx.emitter.emit(buildError(err,instance,ctx));
}

function buildError(err,instance,ctx){

}

