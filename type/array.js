'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')
  , deepEqual = require('../deepequal')

module.exports = validateArray;

function validateArray(){
  if (type(this.instance())!=='array') return;
  validateArrayLength.call(this);
  validateArrayUniqueItems.call(this);
  validateArrayItems.call(this);
}

function validateArrayLength(){
  var min = this.property('minItems')
    , max = this.property('maxItems')
    , instance = this.instance()

  if (min){
    this.assert(instance.length >= min,
                "has less than the minimum number of items",
                "minItems",
                instance.length
               );
  }
  if (max){
    this.assert(instance.length <= max,
                "has greater than the maximum number of items",
                "maxItems",
                instance.length
               );
  }
}

function validateArrayUniqueItems(){
  var unique = this.property('uniqueItems')
    , instance = this.instance()
    , match = false

  if (!unique) return;

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
}

function validateArrayItems(){
  var items = this.get('items')
    , additional = this.property('additionalItems')
    , additionalSchema = this.get('additionalItems')
    , instance = this.instance()
  if (!items) return;
  if (items.nodeType == 'SchemaArray'){
    for (var i=0;i<instance.length;++i){
      var schema = items.get(i)
      if (schema){
        var ctx = this.subcontext(['items',i].join('/'),i)
        this.assert( ctx.validate(),
                     "item " + i + " is invalid",
                     "items"
                   );
      } else if (type(additional)=='boolean') {
        this.assert(additional,
                    "contains additional items",
                    "additionalItems",
                    true
                   );
      } else if (additionalSchema){
        var ctx = this.subcontext('additionalItems',i)
        this.assert( ctx.validate(),
                     "additional item " + i + " is invalid",
                     "additionalSchema"
                   );
      }
    }
  } else if (items.nodeType == 'Schema') {
     for (var i=0;i<instance.length;++i){
       var ctx = this.subcontext('items',i)
       this.assert( ctx.validate(),
                    "item " + i + " is invalid",
                    "items"
                  );
     }
  }
}



