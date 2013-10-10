'use strict';

var validate = require('./validate')
  , Context = require('./context')
  , Emitter = require('emitter')
  , each = require('each')
  , type = require('type')

var validateObject = require('./type/object')
  , validateArray = require('./type/array')
  , validateString = require('./type/string')
  , validateNumeric = require('./type/numeric')
  , validateEnum = require('./type/enum')

/* 
var formatDate = require('./format/date')
  , formatTime = require('./format/time')
  , formatUTC  = require('./format/utc')
  , formatRegex = require('./format/regex')
*/

// default validate() configuration

validate.addType('object',validateObject);
validate.addType('array',validateArray);
validate.addType('string',validateString);
validate.addType('numeric',validateNumeric);
validate.addType('enum',validateEnum);

// late-bind validate to Context.prototype here
// to include all custom type/format functions

Context.prototype.validate = validate;


module.exports = Validator;

function Validator(emitter){

  if (type(emitter) == 'function'){  // plugin, emitter == Schema
    plugin(emitter);

  } else {   // standalone validator
    if (!(this instanceof Validator)) return new Validator(emitter);
    this.emitter(emitter || Validator.emitter());
    return this;

  }
}

Validator.addFormat = function(key,fn){
  validate.addFormat(key,fn);
  return this;
}

Validator.addType = function(key,fn){
  validate.addType(key,fn);
  return this;
}

/* default emitter */
Validator.emitter = function(){
  this._emitter = this._emitter || new Emitter();
  return this._emitter;
}

Validator.prototype.emitter = function(emitter){ 
  if (arguments.length == 0){ return this._emitter;    }
  else                      { this._emitter = emitter; }
}

Validator.prototype.validate = function(schema,instance,desc,fn){
  if (type(desc)=='function'){
    fn = desc; desc = undefined;
  }
  if (!schema) return;
  var ctx = new Context(schema,instance,desc);
  Context.emitter(this.emitter());
  return ctx.validate(fn);
}

Validator.prototype.validateRaw = function(schema,instance,desc,fn){
  schema = new Schema().parse(schema);
  return this.validate(schema,instance,desc,fn);
}


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
function plugin(target){
  target.addBinding('validate',validateBinding);
  target.addBinding('resolveLinks',resolveLinksBinding);
  target.addBinding('subschema',subschemaBinding);
}

function validateBinding(desc,fn){
  var validator = new Validator();
  return validator.validate(this.schema,this.instance,desc,fn);
}

function resolveLinksBinding(){
  var links;
  var valid = this.validate( function(schemas){
    links = mergeLinks(schemas);
  })
  if (!valid) return undefined;
  return links && links.resolve(this.instance);
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


