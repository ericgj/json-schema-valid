'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')

module.exports = validateNumeric;

function validateNumeric(){
  if (type(this.instance())!=='number') return;
  validateMultipleOf.call(this);
  validateMinMax.call(this);
}

function validateMultipleOf(){
  var multipleOf = this.property('multipleOf')
    , instance = this.instance()
  if (!multipleOf) return;
  this.assert((instance/multipleOf % 1) == 0, 
              "not a multiple of",
              "multipleOf"
             );
}

function validateMinMax(){
  var min = this.property('minimum'), minExcl = this.property('exclusiveMinimum')
    , max = this.property('maximum'), maxExcl = this.property('exclusiveMaximum')
    , instance = this.instance()
  
  if (min){
    this.assert(instance >= min, 
                "less than minimum",
                "minimum"
               )
    if (minExcl){
      this.assert(instance > min, 
                  "not greater than exclusive minimum",
                  "exclusiveMinimum"
                 )
    }
  }

  if (max){
    this.assert(instance <= max, 
                "greater than maximum",
                "maximum"
               )
    if (maxExcl){
      this.assert(instance < max, 
                  "not less than exclusive maximum",
                  "exclusiveMaximum"
                 )
    }
  }
}

