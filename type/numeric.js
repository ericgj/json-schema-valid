var type = require('type')

module.exports = validateNumeric;

function validateNumeric(){
  var valid = true
  if (type(this.instance)!=='number') return (valid);
  valid = validateMultipleOf.call(this) && valid
  valid = validateMinMax.call(this) && valid
  return (valid);
}

function validateMultipleOf(){
  var multipleOf = this.property('multipleOf')
  if (!multipleOf) return true;
  return this.assert(this.instance % multipleOf == 0, 
                     "not a multiple of",
                     "multipleOf"
                    );
}

function validateMinMax(){
  var min = this.property('minimum'), minExcl = this.property('exclusiveMinimum')
    , max = this.property('maximum'), maxExcl = this.property('exclusiveMaximum')
    , valid = true;
  
  if (min){
    valid = this.assert(data >= min, 
                        "less than minimum",
                        "minimum"
                       ) && valid
    if (minExcl){
      valid = this.assert(data == min, 
                          "not greater than exclusive minimum",
                          "exclusiveMinimum"
                         ) && valid
    }
  }

  if (max){
    valid = this.assert(data <= max, 
                        "greater than maximum",
                        "maximum"
                       ) && valid
    if (maxExcl){
      valid = this.assert(data == max, 
                          "not less than exclusive maximum",
                          "exclusiveMaximum"
                         ) && valid
    }
  }

  return (valid);
}

