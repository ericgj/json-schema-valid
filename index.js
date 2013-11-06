'use strict';

var isBrowser = require('is-browser')
  , validate = require('./validate')
  , Context = require('./context')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , Schema = core.Schema
  , each = isBrowser ? require('each') : require('each-component')
  , type = isBrowser ? require('type') : require('component-type')

var validateObject = require('./type/object')
  , validateArray = require('./type/array')
  , validateString = require('./type/string')
  , validateNumeric = require('./type/numeric')
  , validateEnum = require('./type/enum')

var formatRegex = require('./format/regex')
  , formatjsFunc = require('./format/js-function')

// default validate() configuration

validate.addType('object',validateObject);
validate.addType('array',validateArray);
validate.addType('string',validateString);
validate.addType('numeric',validateNumeric);
validate.addType('enum',validateEnum);

validate.addFormat('date',/^(\d{4})((\-?)(0\d|1[0-2]))((\-?)([0-2]\d|3[0-1]))$/);
validate.addFormat('time',/^([01]\d|2[0-3])((:?)[0-5]\d)((:?)[0-5]\d)$/);
validate.addFormat('datetime',/^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24\:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/);
validate.addFormat('utc',/^\d+$/);
validate.addFormat('regex',formatRegex);
validate.addFormat('email',/^[a-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i);
validate.addFormat('phone',/^[0-9\(\)\.\-\s]+$/);
validate.addFormat('uri',/^([^:\/?#]+:)?(\/\/(?:[^:@]*(?::[^:@]*)?@)?(([^:\/?#]*)(?::(\d*))?))?([^?#]*)(\?[^#]*)?(#[\s\S]*)?/);
validate.addFormat('js-function',formatjsFunc);

// late-bind validate to Context.prototype here
// to include all custom type/format functions

Context.prototype.validate = validate;


module.exports = Validator;

function Validator(fn){

  if (type(fn) == 'function'){  // plugin, fn == Schema
    plugin(fn);

  } else {   // standalone validator
    if (!(this instanceof Validator)) return new Validator();
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

Validator.prototype.context = function(){
  return this._ctx;
}

Validator.prototype.valid = function(){
  var ctx = this.context()
  return ctx && ctx.valid();
}

Validator.prototype.error = function(){
  var ctx = this.context()
  return ctx && ctx.error();
}

Validator.prototype.errorTrace = function(){
  var ctx = this.context()
  return ctx && ctx.errorTrace();
}

Validator.prototype.assertionTrace = function(){
  var ctx = this.context()
  return ctx && ctx.assertionTrace();
}

Validator.prototype.errorTree = function(){
  var ctx = this.context()
  return ctx && ctx.errorTree();
}

Validator.prototype.assertionTree = function(){
  var ctx = this.context()
  return ctx && ctx.assertionTree();
}

/******************************** 
 * Standalone validate()
 *
 */
Validator.prototype.validate = function(schema,instance,fn){
  if (!schema) return;
  var ctx = new Context(schema,instance);
  this._ctx = ctx;
  return ctx.validate(fn);
}

Validator.prototype.validateRaw = function(schema,instance,fn){
  schema = new Schema().parse(schema);
  return this.validate(schema,instance,fn);
}


/******************************** 
 * Schema plugin
 *
 * - Adds validate() to correlation
 * - Wraps existing correlation methods to account for validation 
 *   (i.e., when multiple schemas apply).
 *   - Adds resolveLinks() to correlation, used as basis for 
 *     correlation.links() defined in json-schema-hyper plugin.
 *   - Wraps subschema() 
 *   - Wraps coerce()
 *
 */
function plugin(target){
  target.addBinding('validate',validateBinding);
  target.addBinding('resolveLinks',resolveLinksBinding);
  target.addBinding('subschema',subschemaBinding);
  target.addBinding('coerce',coerceBinding);
}


/*
 * correlation.validate()
 *
 * Validates correlation instance against correlation schema.
 *
 * Note validation errors are inaccessible here; if you need
 * them, use the standalone validate().
 *
 * @returns boolean
 *
 */
function validateBinding(fn){
  if (!this.schema || this.instance === undefined) return;
  var validator = new Validator()
    , valid =  validator.validate(this.schema,this.instance,fn);
  if (!valid){
    this.emit('error', validator.error())
  }
  return (valid);
}

/*
 * correlation.resolveLinks()
 *
 * Validates, and builds a links object, concatenating all link
 * specifications from all valid schemas. Links are then resolved
 * against the correlation instance.
 *
 * Typically this method is not called directly but instead via
 * correlation.links(), defined in json-schema-hyper.
 *
 * @returns new Links
 *
 */
function resolveLinksBinding(){
  if (!this.schema || this.instance === undefined) return;
  var links;
  var valid = this.validate( function(schemas){
    links = mergeLinks(schemas);
  })
  if (!valid) return;
  return links && links.resolve(this.instance);
}

/*
 * correlation.subschema()
 *
 * Validates, and builds a 'collated' schema (Schema.allOf) for the given
 * property/array-index from all valid schemas. Note if only one valid 
 * schema (the "top-level schema"), the behavior is identical to the basic 
 * subschema() method provided in json-schema-core.
 *
 * @returns schema
 *
 */
function subschemaBinding(prop){
  if (!this.schema || this.instance === undefined) return;
  var self = this
    , ret
  this.validate( function(schemas){
    ret = buildSubschema.call(self,schemas,prop);
  });
  return ret;
}

/*
 * correlation.coerce()
 *
 * Validates, and coerces instance according to:
 * (1) the first valid schema that specifies either `type` or `default` or both;
 * (2) the "top-level schema", otherwise
 *
 * Note that the ordering of valid schemas cannot be relied on, so it is
 * recommended that either the top-level schema specify type and/or default, or
 * _only one_ combination schema specify these.
 *
 * @returns new Correlation
 *
 */
function coerceBinding(){
  if (!this.schema || this.instance === undefined) return;
  var self = this
    , ret
  this.validate( function(schemas){
    ret = buildCoerce.call(self,schemas);
  });
  return ret;
}


// private

function buildSubschema(schemas,prop){
  var protoSubschema = this.__proto__.subschema
    , instance = this.instance
    , found = []
  each(schemas, function(schema){
    var corr = schema.bind(instance)
      , sub = protoSubschema.call(corr,prop)
    if (sub) found.push(sub);
  })
  if (found.length == 0){
    return (new Schema());  // if property in instance but not any valid schema
  } else if (found.length == 1){
    return (found[0]);
  } else {
    return (Schema.allOf(found));
  }
}


function buildCoerce(schemas){
  var protoCoerce = this.__proto__.coerce
    , instance = this.instance
    , ret
  for (var i=0;i<schemas.length;++i){
    var schema = schemas[i]
      , corr = schema.bind(instance)

    // coerce against first schema
    if (!ret) ret = protoCoerce.call(corr);

    // and overwrite with first schema that has either type or default specified
    // if any
    if (( schema.hasProperty('type') || 
          schema.hasProperty('default') )) {
      ret = protoCoerce.call(corr)
      break;  
    }
  }
  return ret;
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

