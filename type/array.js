'use strict';

var type = require('type')

module.exports = validateArray;

function validateArray(){
  var valid = true
  if (type(this.instance())!=='array') return (valid);
  valid = validateArrayLength.call(this) && valid;
  valid = validateArrayUniqueItems.call(this) && valid;
  valid = validateArrayItems.call(this) && valid;
  return (valid);
}

function validateArrayLength(){
  var min = this.property('minItems')
    , max = this.property('maxItems')
    , instance = this.instance()
    , valid = true

  if (min){
    valid = this.assert(instance.length >= min,
                        "has less than the minimum number of items",
                        "minItems"
                       ) && valid;
  }
  if (max){
    valid = this.assert(instance.length <= max,
                        "has greater than the maximum number of items",
                        "maxItems"
                       ) && valid;
  }
  return (valid);
}

function validateArrayUniqueItems(){
  var unique = this.property('uniqueItems')
    , instance = this.instance()
    , match = false

  if (!unique) return (!match);

  for (var i=0;i<instance.length;++i){
    for (var j=i+1;j<instance.length;++j){
      match = deepEqual(instance[i],instance[j]);
      if (match) break;
    }
    if (match) break;
  }
  this.assert(!match,
              "does not contain unique items",
              "uniqueItems"
             );
  return (!match);
}

function validateArrayItems(){
  var items = this.get('items')
    , additional = this.property('additionalItems')
    , additionalSchema = this.get('additionalItems')
    , instance = this.instance()
    , valid = true;
  if (!items) return (valid);
  if (items.nodeType == 'SchemaArray'){
    for (var i=0;i<instance.length;++i){
      var schema = items.get(i)
      if (schema){
        var ctx = this.subcontext(['items',i].join('/'),i)
        valid = ctx.validate() && valid;
      } else if (type(additional)=='boolean') {
        valid = this.assert(additional,
                            "contains additional items",
                            "additionalItems"
                           ) && valid;
      } else if (additionalSchema){
        var ctx = this.subcontext('additionalItems',i)
        valid = ctx.validate() && valid;
      }
    }
  } else if (items.nodeType == 'Schema') {
     for (var i=0;i<instance.length;++i){
       var ctx = this.subcontext('items',i)
       valid = ctx.validate() && valid
     }
  }
  return (valid);
}


/* 
 * Copied from sinon.js, minus the Element equality checking not needed here.
 * http://github.com/cjohansen/Sinon.JS
 * (BSD License -- see below)
 *
 */
function deepEqual(a, b) {

  if (typeof a != "object" || typeof b != "object") {
      return a === b;
  }

  if (a === b) {
      return true;
  }

  if ((a === null && b !== null) || (a !== null && b === null)) {
      return false;
  }

  var aString = Object.prototype.toString.call(a);
  if (aString != Object.prototype.toString.call(b)) {
      return false;
  }

  if (aString == "[object Array]") {
      if (a.length !== b.length) {
          return false;
      }

      for (var i = 0, l = a.length; i < l; i += 1) {
          if (!deepEqual(a[i], b[i])) {
              return false;
          }
      }

      return true;
  }

  var prop, aLength = 0, bLength = 0;

  for (prop in a) {
      aLength += 1;

      if (!deepEqual(a[prop], b[prop])) {
          return false;
      }
  }

  for (prop in b) {
      bLength += 1;
  }

  return aLength == bLength;
}

/*

(The BSD License)

Copyright (c) 2010-2013, Christian Johansen, christian@cjohansen.no
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of Christian Johansen nor the names of his contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
