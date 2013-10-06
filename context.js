'use strict';

var Emitter = require('emitter')

module.exports = Context;

function Context(schema,instance,path){
  if (!(this instanceof Context)) return new Context(schema,instance,path);
  this.schema = schema; this.instance = instance;
  this._segments = (path || '#').split('/');
  return this;
}

Context.prototype = new Emitter();

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
  if (!path || 0==path.length) return this;
  var parts = path.split('/')
    , prop = parts.shift()
    , rest = parts.join('/')
  if ('#' == prop) return getPath.call(this,rest);
  var branch = this[prop]
  if (!branch) return;
  return getPath.call(branch,rest);
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

// TODO throw error if some flag is set
Context.prototype.error = function(message){
  this.emit('error', buildError.call(this,message));
}


// private

// TODO add context to error
function buildError(message){
  return new Error(message);
}


// utils

/* this == instance object */

