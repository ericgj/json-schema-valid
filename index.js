'use strict';

var validate = require('./validate')
  , Context = require('./context')
  , each = require('each')
  , type = require('type')

var validateObject = require('./type/object')

/* 

var validateArray = require('./type/array')
  , validateBoolean = require('./type/boolean')
  , validateNumber = require('./type/number')
  , validateString = require('./type/string')
  , validateAllOf  = require('./type/allof')
  , validateAnyOf  = require('./type/anyof')
  , validateOneOf  = require('./type/oneof')
  , validateNot    = require('./type/not')

var formatDate = require('./format/date')
  , formatTime = require('./format/time')
  , formatUTC  = require('./format/utc')
  , formatRegex = require('./format/regex')

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

  // late-bind the validate function with all added types and formats, etc.
  Context.prototype.validate = validate;  
}

plugin.addFormat = function(key,fn){
  validate.addFormat(key,fn);
  return this;
}

plugin.addType = function(key,fn){
  validate.addType(key,fn);
  return this;
}

function validateBinding(fn){
  if (!this.schema || !this.instance) return;
  var ctx = new Context(this.schema,this.instance);
  return ctx.validate(fn);
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


