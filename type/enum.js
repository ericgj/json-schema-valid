'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , deepEqual = require('../deepequal')

module.exports = validateEnum;

function validateEnum(){
  var values = this.property('enum')
    , instance = this.instance()

  if (!values) return;

  var isarr = type(values)=='array';
  this.assert(isarr,
              "specified enum is not an array"
             );
  if (!isarr) return;

  var found = false;
  for (var i=0;i<values.length;++i){
    if (deepEqual(values[i],instance)){ found = true; break; }
  }
  this.assert(found, 
              "not a valid value", 
              "enum"
             );
}

