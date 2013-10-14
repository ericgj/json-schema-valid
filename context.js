'use strict';

var has = hasOwnProperty

module.exports = Context;

function Context(schema,instance,desc){
  if (!(this instanceof Context)) return new Context(schema,instance,path);
  this.primarySchema = schema; this.primaryInstance = instance;
  this.description = desc || schema.property('description');
  return this.at('#','#');
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

Context.prototype.at = function(schemaPath,instancePath){
  var segs = schemaPath.split('/')
  if (segs[0]!=='#') segs.unshift('#');
  this._schemaSegs = segs;
  segs = instancePath.split('/')
  if (segs[0]!=='#') segs.unshift('#');
  this._instanceSegs = segs;
  this.debug("subcontext: schemaPath: " + this.schemaPath() + 
               " , instancePath: " + this.instancePath(),
             { schema: this.schema(), 
               instance: this.instance(), 
               context: this.description 
             }
            );
  return this;
}

Context.prototype.subcontext = function(schemaPath,instancePath){
  return new Context(this.primarySchema,this.primaryInstance,this.description)
               .at(joinPath(this.schemaPath(),schemaPath),
                   joinPath(this.instancePath(),instancePath)
                  );
}


Context.prototype.schemaPath = function(){
  return this.schemaSegments().join('/');
}

Context.prototype.schemaSegments = function(){
  return this._schemaSegs;
}

Context.prototype.instancePath = function(){
  return this.instanceSegments().join('/');
}

Context.prototype.instanceSegments = function(){
  return this._instanceSegs;
}

Context.prototype.schema = function(){
  return this.primarySchema && 
    this.primarySchema.getPath(this.schemaPath());
}

Context.prototype.instance = function(){
  return this.primaryInstance && 
    getPath.call(this.primaryInstance,this.instancePath());
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
  p1 = (p1 === undefined ? '' : p1).toString();
  p2 = (p2 === undefined ? '' : p2).toString();
  var segments = []; segments.push.apply(segments,p1.split('/'));
  if (p2) segments.push.apply(segments,p2.split('/'));
  return segments.join('/');
}


// utils

/* this == instance object */
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

