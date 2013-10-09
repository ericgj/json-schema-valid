var type = require('type')

module.exports = validateNumeric;

function validateNumeric(){
  var valid = true
  if (type(this.instance())!=='number') return (valid);
  valid = validateMultipleOf.call(this) && valid
  valid = validateMinMax.call(this) && valid
  return (valid);
}

function validateMultipleOf(){
  var multipleOf = this.property('multipleOf')
    , instance = this.instance()
  if (!multipleOf) return true;
  return this.assert((instance/multipleOf % 1) == 0, 
                     "not a multiple of",
                     "multipleOf"
                    );
}

function validateMinMax(){
  var min = this.property('minimum'), minExcl = this.property('exclusiveMinimum')
    , max = this.property('maximum'), maxExcl = this.property('exclusiveMaximum')
    , instance = this.instance()
    , valid = true;
  
  if (min){
    valid = this.assert(instance >= min, 
                        "less than minimum",
                        "minimum"
                       ) && valid
    if (minExcl){
      valid = this.assert(instance > min, 
                          "not greater than exclusive minimum",
                          "exclusiveMinimum"
                         ) && valid
    }
  }

  if (max){
    valid = this.assert(instance <= max, 
                        "greater than maximum",
                        "maximum"
                       ) && valid
    if (maxExcl){
      valid = this.assert(instance < max, 
                          "not less than exclusive maximum",
                          "exclusiveMaximum"
                         ) && valid
    }
  }

  return (valid);
}

