'use strict';

var has = hasOwnProperty

module.exports = Context;

function Context(schema,instance,desc){
  if (!(this instanceof Context)) return new Context(schema,instance,desc);
  this.primarySchema = schema; this.primaryInstance = instance;
  this.description = desc || schema.property('description');
  this._schemaSegs = [];
  this._instanceSegs = [];
  return this;
}
  
Context.emitter = function(emitter){
  if (arguments.length == 0){
    return this._emitter;
  } else {
    this._emitter = emitter;
  }
}

Context.prototype.emitter = function(){
  return Context.emitter();
}

Context.prototype.atSegments = function(schemaSegs,instanceSegs){
  this._schemaSegs = schemaSegs;
  this._instanceSegs = instanceSegs;
  return this;
}

Context.prototype.subcontext = function(schemaPath,instancePath){
  var schemaSegs = [], instanceSegs = []
  schemaSegs.push.apply(schemaSegs, this.schemaSegments());
  if (schemaPath !== undefined){
    schemaSegs.push.apply(schemaSegs, schemaPath.toString().split('/'));
  }
  instanceSegs.push.apply(instanceSegs, this.instanceSegments());
  if (instancePath !== undefined){
    instanceSegs.push.apply(instanceSegs, instancePath.toString().split('/'));
  }
  
  var ctx = new Context(this.primarySchema,this.primaryInstance,this.description)
                 .atSegments(schemaSegs,instanceSegs);

  ctx.debug("subcontext: schemaPath: " + ctx.schemaPath() + 
               " , instancePath: " + ctx.instancePath(),
             { schema: ctx.schema(), 
               instance: ctx.instance(), 
               context: ctx.description 
             }
           );
  return ctx;
}


Context.prototype.schemaPath = function(){
  var segs = this.schemaSegments()
  if (segs.length == 0) return;
  return segs.join('/');
}

Context.prototype.schemaSegments = function(){
  return this._schemaSegs;
}

Context.prototype.instancePath = function(){
  var segs = this.instanceSegments()
  if (segs.length == 0) return;
  return segs.join('/');
}

Context.prototype.instanceSegments = function(){
  return this._instanceSegs;
}

Context.prototype.schema = function(){
  if (!this.primarySchema) return; 
  var schemaPath = this.schemaPath()
  return (schemaPath === undefined 
            ? this.primarySchema
            : this.primarySchema.getPath(schemaPath)
         );
}

Context.prototype.instance = function(){
  if (this.primaryInstance === undefined) return;
  var instancePath = this.instancePath()
  return (instancePath === undefined 
            ? this.primaryInstance
            : getPath(this.primaryInstance,instancePath)
         );
}


Context.prototype.condition =
Context.prototype.get = function(key){
  var schema = this.schema()
  return schema && schema.get(key);
}

Context.prototype.property = function(key){
  var schema = this.schema()
  return schema && schema.property(key);
}

Context.prototype.getSchemaPath =
Context.prototype.getPath = function(path){
  var schema = this.schema()
  return schema && schema.getPath(path);
}

Context.prototype.assert = function(value, message, prop){
  if (!value) this.error(message,prop);
  this.debugAssert(prop + ' assertion ' + (value ? 'passed' : 'failed'),prop);
  return (value);
}

Context.prototype.debug = function(message,obj){
  var emitter = this.emitter();
  obj = obj || {}; obj.message = message;
  if (emitter) emitter.emit('debug', obj);
}

// TODO throw error if some flag is set
Context.prototype.error = function(message,prop){
  var emitter = this.emitter();
  if (emitter) emitter.emit('error', buildError.call(this,message,prop));
}

Context.prototype.debugAssert = function(message,prop){
  var emitter = this.emitter();
  if (emitter) emitter.emit('debug', buildDebug.call(this,message,prop));
}

// private

function buildError(message,prop){
  var e = new Error();
  setContextInfo.call(this,e,message,prop);
  return e;
}

function buildDebug(message,prop){
  var data = {};
  setContextInfo.call(this,data,message,prop);
  return data;
}

function setContextInfo(target,message,prop){
  var skey = joinPath(this.schemaPath(),prop)
    , expected = this.property(prop)
    , actual = this.instance()
  message = [this.instanceSegments().slice(1).join('/'),
             message, 
             "(",
             (prop ? " expected: " + JSON.stringify(expected) + " , " : ""), 
             "value is " + JSON.stringify(actual),
             ")"
            ].join(' ');
  target.message = message;
  target.context = this.description;
  target.schemaPath = this.schemaPath();
  if (prop){
    target.schemaProperty = prop;
    target.schemaValue = expected;
  }
  target.schemaKey = skey;
  target.instancePath = this.instancePath();
  target.instanceValue = actual;
}

function joinPath(p1,p2){
  var segments = []; 
  if (p1) segments.push.apply(segments,p1.toString().split('/'));
  if (p2) segments.push.apply(segments,p2.toString().split('/'));
  return segments.join('/');
}


// utils


function getPath(instance,path){
  if (path === undefined) return instance;
  path = path.toString();
  if (0==path.length) return instance;
  var parts = path.split('/')
    , prop = parts.shift()
    , rest = parts.join('/')
  if ('#'==prop) return getPath(instance,rest);
  if (!has.call(instance,prop)) return;
  var branch = instance[prop]
  return getPath(branch,rest);
}

/*
function getPath(path){
  path = (path === undefined ? '' : path).toString();
  if (0==path.length) return this;
  var parts = path.split('/')
    , prop = parts.shift()
    , rest = parts.join('/')
  if ('#'==prop) return getPath.call(this,rest);
  if (!has.call(this,prop)) return;
  var branch = this[prop]
  return getPath.call(branch,rest);
}
*/
