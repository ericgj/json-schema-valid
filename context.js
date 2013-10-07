'use strict';

module.exports = Context;

function Context(schema,instance,path,desc){
  if (!(this instanceof Context)) return new Context(schema,instance,path);
  this.schema = schema; this.instance = instance;
  this.description = desc || schema.property('description');
  this._segments = (path || '#').split('/');
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

Context.prototype.path = function(){
  return joinPath.call(this);
}

Context.prototype.segments = function(){
  return this._segments;
}

Context.prototype.condition =
Context.prototype.get = function(key){
  return this.schema && this.schema.get(key);
}

Context.prototype.property = function(key){
  return this.schema && this.schema.property(key);
}

Context.prototype.getInstancePath = function(path){
  return getPath.call(this.instance,path);
}

Context.prototype.getSchemaPath =
Context.prototype.getPath = function(path){
  return this.schema && this.schema.getPath(path);
}

Context.prototype.subcontext = function(schemaPath,instancePath){
  var schema = this.getPath(schemaPath)
    , instance = this.getInstancePath(instancePath)
    , path  = joinPath.call(this,schemaPath)
  if (schema.nodeType !== 'Schema') schema = undefined;
  return new Context(schema,instance,path,this.description);
}


Context.prototype.assert = function(value, message, prop){
  if (!value) this.error(message,prop);
  return (value);
}

// TODO throw error if some flag is set
Context.prototype.error = function(message,prop){
  var emitter = this.emitter();
  if (emitter) emitter.emit('error', buildError.call(this,message,prop));
}


// private

// TODO add context to error
function buildError(message,prop){
  var path = joinPath.call(this,prop)
  message = "<" + JSON.stringify(this.instance) + "> " + message
  var e = new Error(message);
  e.context = this.description;
  e.schemaPath = this.path();
  if (prop){
    e.schemaProperty = prop;
    e.schemaValue = this.property(prop);
  }
  e.schemaKey = path;
  return e;
}

function joinPath(path){
  var segments = []; segments.push.apply(segments,this.segments());
  if (path) segments.push.apply(segments,path.split('/'));
  return segments.join('/');
}


// utils

/* this == instance object */
function getPath(path){
  if (!path || 0==path.length) return this;
  var parts = path.split('/')
    , prop = parts.shift()
    , rest = parts.join('/')
  var branch = this[prop]
  if (!branch) return;
  return getPath.call(branch,rest);
}

