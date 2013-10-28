'use strict';

var Enumerable = require('enumerable')
  , has = hasOwnProperty

module.exports = Context;

function Context(schema,instance,schemaPath,instancePath){
  this._schema = schema; this._instance = instance;
  this._schemaPath = schemaPath; this._instancePath = instancePath;
  this._asserts = [];
  this._ctxs = [];
  this._valid = true;
  return this;
}

Context.prototype.subcontext = function(schemaPath,instancePath){
  var schema = this.schema()
    , instance = this.instance()
    , subsch = (schemaPath == undefined) ? schema : schema.getPath(schemaPath)
    , subinst = (instancePath == undefined) ? instance : getPath(instance,instancePath)
    , subschPath = joinPath(this.schemaPath(),schemaPath)
    , subinstPath = joinPath(this.instancePath(),instancePath)
    , sub = new Context(subsch,subinst,subschPath,subinstPath)
  this._ctxs.push(sub);
  return sub;
}

Context.prototype.valid = function(){
  return this._valid;
}

Context.prototype.schema = function(){
  return this._schema;
}

Context.prototype.instance = function(){
  return this._instance;
}

Context.prototype.property = function(prop){
  var schema = this.schema()
  return schema && schema.property(prop);
}

Context.prototype.get = function(cond){
  var schema = this.schema()
  return schema && schema.get(cond);
}

Context.prototype.schemaPath = function(){
  return this._schemaPath;
}

Context.prototype.instancePath = function(){
  return this._instancePath;
}

Context.prototype.assert = function(value, message, prop, actual){
  var assert = new Assertion(this,value)
  if (actual !== undefined) assert.actual(actual);
  if (prop !== undefined) assert.property(prop);
  if (!value && message !== undefined) assert.predicate(message);
  this._valid = value && this._valid;
  this._asserts.push(assert);
  return this._valid;
}

Context.prototype.assertions = function(){
  return this._asserts;
}

Context.prototype.subcontexts = function(){
  return this._ctxs;
}

Context.prototype.errors = function(){
  return this.assertionTree( 
    function(ctx)    { return !ctx.valid(); },
    function(assert) { return !(assert.valid || assert.contextValid); }
  );
}

Context.prototype.assertionTree = function(ctxfn,assertfn){
  if (ctxfn && !ctxfn(this)) return;
  var ret = { assertions: [], contexts: [] }
    , asserts = this.assertions()
    , ctxs = this.subcontexts()
  for (var i=0;i<asserts.length;++i){
    var a = asserts[i].toObject()
    if (!assertfn || assertfn(a)) ret.assertions.push(a);
  }
  for (var i=0;i<ctxs.length;++i){
    var tree = ctxs[i].assertionTree(ctxfn,assertfn)
    if (tree) ret.contexts.push( tree );
  }
  return ret;
}

Context.prototype.errorTrace = function(){
  var errs = this.errors()
  if (!errs) return;
  return assertionTrace.call(errs);
}

Context.prototype.assertionTrace = function(){
  var asserts = this.assertionTree()
  if (!asserts) return;
  return assertionTrace.call(asserts);
}


// private, bind to assertionTree object
// probably should be extracted to its own prototype once pinned down a bit more
function assertionTrace(accum,level){
  accum = accum || [];
  level = level || 0;
  for (var i=0;i<this.assertions.length;++i){
    accum.push( repeatString(' ', level * 2) + this.assertions[i].message );
  }
  level++;
  for (var i=0;i<this.contexts.length;++i){
    var ctx = this.contexts[i]
    assertionTrace.call(ctx,accum,level);
  }
  level--;
  return accum;
}



function Assertion(ctx,valid){
  if (!(this instanceof Assertion)) return new Assertion(ctx,valid);
  this._ctx = ctx;
  this._valid = valid;
  return this;
}

Assertion.prototype.valid = function(){
  return this._valid;
}

Assertion.prototype.contextValid = function(){
  return this.context().valid();
}

Assertion.prototype.context = function(){
  return this._ctx;
}

Assertion.prototype.predicate = function(m){
  if (arguments.length == 0){  return this._predicate; }
  else { this._predicate = m; return this; }
}

Assertion.prototype.actual = function(v){
  if (arguments.length == 0){  
    return this._actual || this.context().instance();
  }
  else { this._actual = v; return this; }
}

Assertion.prototype.property = function(p){
  if (arguments.length == 0){  return this._property; }
  else { this._property = p; return this; }
}

Assertion.prototype.expected = function(){
  var prop = this.property()
    , schema = this.context().schema()
  return prop && schema && schema.property(prop);
}

// for convenience
Assertion.prototype.message = function(){
  var context = this.context()
    , prop = this.property()
    , valid = this.valid()
    , expected = this.expected()
    , actual = this.actual()
    , predicate = this.predicate()
    , instPath = context.instancePath()
  var ret = []
  if (instPath !== undefined) ret.push(instPath);
  if (prop !== undefined) ret.push(prop);
  ret.push( valid ? "valid" : "invalid" )
  if (predicate !== undefined){
    ret.push(":");
    ret.push(predicate);
  }
  if (!valid && expected !== undefined){ 
    ret.push(":");
    ret.push( "expected " + JSON.stringify(expected) + 
              ", was " + JSON.stringify(actual)
            );
  }
  return ret.join(' ');
}

Assertion.prototype.toObject = function(){
  var ret = {}
    , context = this.context()
    , path = context.schemaPath()
    , prop = this.property()
  ret.contextValid = this.contextValid();
  ret.valid = this.valid();
  ret.predicate = this.predicate();
  ret.message = this.message();
  ret.schemaPath = path;
  ret.schemaProperty = prop;
  ret.schemaValue = this.expected();
  ret.schemaKey = joinPath(path,prop);
  ret.instancePath = context.instancePath();
  ret.instanceValue = context.instance();
  ret.expected = this.expected();
  ret.actual = this.actual();

  return ret;
}

// private

// utils

function joinPath(p1,p2){
  if (p1 == undefined && p2 == undefined) return;
  var segments = []; 
  if (p1 !== undefined) segments.push.apply(segments,p1.toString().split('/'));
  if (p2 !== undefined) segments.push.apply(segments,p2.toString().split('/'));
  return segments.join('/');
}

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

function repeatString(str,times){
  if (str.repeat) return str.repeat(times);
  var r = ''
  for (var i=0;i<times;++i){
    r = r + str;
  }
  return r;
}

