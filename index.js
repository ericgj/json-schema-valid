'use strict';

var indexOf = require('indexof')
  , type  = require('type')
  , find  = require('find')
  , each  = require('each')
  , Emitter = require('emitter')
  , core  = require('json-schema-core')
  , Schema = core.Schema
  , has   = hasOwnProperty

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


var TYPE_VALIDATORS = {}

/*
  'array': validateArray,
  'boolean': validateBoolean,
  'integer': validateNumber,
  'null': noop,
  'number': validateNumber,
  'object': validateObject,
  'string': validateString
*/


// Note: built-in

var FORMAT_VALIDATORS = {}

/*
  'date': formatDate,
  'time': formatTime,
  'utc-millisec': formatUTC,
  'regex': formatRegex
*/


/******************************** 
 * Schema plugin
 * - adds validate() and resolveLinks() to correlation
 * - wraps subschema() to take into account validation from 
 *   correlation.getPath()
 *
 * Note that resolveLinks() is used for links() and related methods
 *   when multiple valid schemas apply: cf. json-schema-hyper plugin.
 *
 */
module.exports = plugin;

function plugin(target){
  target.addBinding('validate',validateBinding);
  target.addBinding('resolveLinks',resolveLinksBinding);
  target.addBinding('subschema',subschemaBinding);
}

plugin.addFormatter = function(key,fn){
  FORMAT_VALIDATORS[key] = fn;
  return this;
}

plugin.addValidator = function(key,fn){
  TYPE_VALIDATORS[key] = fn;
  return this;
}

function validateBinding(fn){
  if (!this.schema || !this.instance) return;
  if (!has.call(this,'emit')) Emitter(this);    // adds emitter methods/state to correlation
  return validate.call(this.schema, this.instance, { emitter: this }, fn);
}

function resolveLinksBinding(){
  var links;
  var valid = this.validate( function(schemas){
    links = mergeLinks(schemas);
  })
  if (!valid) return undefined;
  return links.resolve(this.instance);
}

function subschemaBinding(prop){
  if (!this.schema || !this.instance) return;
  var self = this
    , ret
  this.validate( function(schemas){
    ret = buildSubschema.call(self,schemas,prop);
  });
  return ret;
}

function buildSubschema(schemas,prop){
  var protoSubschema = this.__proto__.subschema
    , instance = this.instance
    , found = []
  each(schemas, function(schema){
    var corr = schema.bind(instance)
      , sub = protoSubschema.call(corr,prop)
    if (sub) found.push(sub);
  })
  if (found.length == 1){
    return (found[0]);
  } else {
    return (new Schema.allOf(found));
  }
}



/***************************
 * Validation implementation
 *
 */
function validate(instance,ctx,fn){

  ctx = ctx || {};
  var valid = true

  valid = validateType.call(this, instance, ctx, function(t){
    var validator = TYPE_VALIDATORS[t]
    if (validator) valid = (validator.call(this, instance, ctx) && valid);
  }) && valid

  valid = validateFormat.call(this, instance, ctx) && valid;

  valid = validateCombinations.call(this, instance, ctx, fn) && valid;

  return (valid);
}


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
 
  var valids = [this], valid = true
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  if (allOf) valid = validateAllOf.call(this,instance,ctx,collect) && valid;
  if (anyOf) valid = validateAnyOf.call(this,instance,ctx,collect) && valid;
  if (oneOf) valid = validateOneOf.call(this.instance,ctx,collect) && valid;
  if (not)   valid = validateNot.call(this,instance,ctx) && valid;

  if (valid && fn) fn(valids);
  return (valid);
}


/*************
 * Combinations 
 * Note these can probably be refactored but my head hurts thinking about it
 *
 */

function validateAllOf(instance,ctx,fn){
  var allof = this.get('allOf')
  if (!allof) return;

  var valids = [], valid = true
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  allof.each( function(i,schema){
    valid = validate.call(schema,instance,ctx,collect) && valid
  });
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}

function validateAnyOf(instance,ctx,fn){
  var anyof = this.get('anyof')
  if (!anyof) return;

  var valids = [], valid = false
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  anyof.each( function(i,schema){
    valid = validate.call(schema,instance,ctx,collect) || valid
  });
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}

function validateOneOf(instance,ctx,fn){
  var oneof = this.get('oneof')
  if (!oneof) return;

  var valids = [], valid = false
  var collect = function(schemas){
    valids.push.apply(valids,schemas);
  }

  oneof.each( function(i,schema){
    valid = validate.call(schema,instance,ctx,collect) && !valid
  });
  
  if (valid && fn && valids.length > 0) fn(valids);

  return (valid);
}

function validateNot(instance,ctx){
  var not = this.get('not'); if (!not) return;
  return (!(validate.call(not,instance,ctx)));
}




// utils

function mergeLinks(schemas){
  schemas = type(schemas) == 'array' ? schemas : [schemas];
  var target = new Schema().parse({links: []});
  var targetLinks = target.get('links');
  each(schemas, function(schema){
    var links = schema.get('links')
    if (links){
      links.each( function(i,link){
        targetLinks.set(link);
      });
    }
  })
  return targetLinks;
}

function assert(value, message){
  return (!value ? new Error(message) : undefined)
}

function emitError(err,instance,ctx){
  ctx.emitter && ctx.emitter.emit(buildError(err,instance,ctx));
}

function buildError(err,instance,ctx){

}

