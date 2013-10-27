'use strict';

var has = hasOwnProperty

module.exports = Context;

function Context(schema,instance,schemaPath,instancePath){
  this._schema = schema; this._instance = instance;
  this._schemaPath = schemaPath; this._instancePath = instancePath;
  this._asserts = [];
  this._valid = true;
  this._subctx = [];
  return this;
}

Context.prototype.subcontext = function(schemaPath,instancePath){
  var schema = this.schema()
    , instance = this.instance()
    , subsch = schemaPath ? schema.getPath(schemaPath) : schema
    , subinst = instancePath ? getPath(instance,instancePath) : instance
    , subschPath = joinPath(this.schemaPath(),schemaPath)
    , subinstPath = joinPath(this.instancePath(),instancePath)
    , sub = new Context(subsch,subinst,subschPath,subinstPath)
  this._subctx.push(sub);
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

Context.prototype.subcontexts = function(){
  return this._subctx;
}

Context.prototype.assert = function(value, message, prop, actual){
  var assert = new Assertion(this,value)
  if (actual !== undefined) assert.actual(actual);
  if (prop !== undefined) assert.property(prop);
  if (!value && message !== undefined) assert.predicate(message);
  this._asserts.push(assert);
  this._valid = value && this._valid;
}

Context.prototype.assertions = function(mapfn,selectfn){
  var asserts = this._asserts
    , selectfn = function(){ return true; }
    , ret = []
  for (var i=0;i<asserts.length;++i){
    var a = asserts[i]
    if (!selectfn(a)) continue;
    ret.push(mapfn ? mapfn(a.toObject()) : a.toObject());
  }
  return ret;
}

Context.prototype.errors = function(mapfn){
  var ctx = this;
  return this.assertions(
           mapfn,
           function(assert){ 
             return (!ctx.valid() && !assert.valid()) 
           }
         )
}

Context.prototype.allErrors = function(){
  var ret = []
  this.reduce(ret, function(memo,ctx,level){
    if (ctx.valid()) return;
    var errs = ctx.errors( function(err){ 
                             err.level = level; return err;
                           });
    memo.push.apply(memo,errs);
    return memo;
  });
  return ret;
}

Context.prototype.errorTrace = function(){
  var ret = []
  this.reduce(ret, function(memo,ctx,level){
    if (ctx.valid()) return;
    var errs = ctx.errors( function(err){
          return repeatString(' ',level * 2) + 
                 err.message
        });
    memo.push.apply(memo,errs);
    return memo;
  });
  return ret;
}

Context.prototype.assertionTrace = function(){
  var ret = []
  this.reduce(ret, function(memo,ctx,level){
    var asserts = ctx.assertions( function(assert){
          return repeatString(' ',level * 2) + 
                 assert.message
        });
    memo.push.apply(memo,assert);
    return memo;
  });
  return ret;
}

Context.prototype.reduce = function(memo,fn,level){
  fn = fn || function(ctx){ return ctx; }
  level = level || 0;

  memo = fn(memo,this,level);

  var subctx = this.subcontexts()
  level++;
  for (var i=0;i<subctx.length;++i){
    var ctx = subctx[i]
    ctx.reduce(memo,fn,level);
  }
  level--;
  return memo;
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
  if (instPath) ret.push(instPath);
  if (prop) ret.push(prop);
  ret.push( valid ? "valid" : "invalid" )
  if (predicate){
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
  var segments = []; 
  if (p1) segments.push.apply(segments,p1.toString().split('/'));
  if (p2) segments.push.apply(segments,p2.toString().split('/'));
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

