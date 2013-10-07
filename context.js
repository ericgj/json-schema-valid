'use strict';

// var Emitter = require('emitter')

module.exports = Context;

function Context(schema,instance,path){
  if (!(this instanceof Context)) return new Context(schema,instance,path);
  this.schema = schema; this.instance = instance;
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

// Context.prototype = new Emitter();

Context.prototype.path = function(){
  return this._segments.join('/');
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
  if (schema.nodeType !== 'Schema') schema = undefined;
  return new Context(schema,instance,schemaPath);
}


Context.prototype.assert = function(value, message){
  if (!value) this.error(message);
  return (value);
}

// TODO throw error if some flag is set
Context.prototype.error = function(message){
  var emitter = this.emitter();
  if (emitter) emitter.emit('error', buildError.call(this,message));
}


// private

// TODO add context to error
function buildError(message){
  return new Error(message);
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

