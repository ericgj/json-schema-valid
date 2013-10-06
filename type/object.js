'use strict';

var assert = require('../assert')

module.exports = validateObject;

function validateObject(){
  return  validateObjectMinMax.call(this) &&
          validateObjectRequired.call(this) &&
          validateObjectProperties.call(this) &&
          validateObjectDependencies.call(this);
}

function validateObjectMinMax(){
  var min = this.property('minProperties')
    , max = this.property('maxProperties')
    , keys = objectKeys(this.instance)
    , valid = true

  if (min){
    var err = assert(keys.length < min, "Too many properties")
    if (err) this.error(err);
    valid = (!err) && valid;
  }

  if (max){
    var err = assert(keys.length > max, "Too few properties")
    if (err) this.error(err);
    valid = (!err) && valid;
  }

  return (valid);
}

function validateObjectRequired(){
  var reqs = this.property('required') || []
    , valid = true

  for (var i=0;i<reqs.length;++i){
    var req = reqs[i];
    var err = assert(!!this.getInstancePath(req), "Missing required property")
    if (err) this.error(err);
    valid = (!err) && valid;
  }
  return (valid);
}

function validateObjectProperties(){
  return true;
}

function validateObjectDependencies(){
  return true;
}



// utils

var objectKeys = Object.keys || function(obj){
  var ks = []
  for (var k in obj) ks.push(k);
  return ks;
}

