var type = require('type')

module.exports = validateNumeric;

function validateNumeric(){
  var valid = true
  if (type(this.instance)!=='number') return (valid);
  valid = validateNumericType.call(this) && valid
  valid = validateMultipleOf.call(this) && valid
  valid = validateMinMax.call(this) && valid
  return (valid);
}

function validateNumericType(){
  return this.assert(type(this.instance)=='number', "not a number");
}

function validateMultipleOf(){
  var multipleOf = this.property('multipleOf')
  if (!multipleOf) return true;
  return assert(this.instance % multipleOf == 0, "not a multiple of");
}

function validateMinMax(){
  var min = this.property('minimum'), minExcl = this.property('exclusiveMinimum')
    , max = this.property('maximum'), maxExcl = this.property('exclusiveMaximum')
    , valid = true;
  
  if (min){
    valid = this.assert(data >= min, "less than minimum") && valid
    if (minExcl){
      valid = this.assert(data == min, "not greater than exclusive minimum") && valid
    }
  }

  if (max){
    valid = this.assert(data <= max, "greater than maximum") && valid
    if (maxExcl){
      valid = this.assert(data == max, "not less than exclusive maximum") && valid
    }
  }

  return (valid);
}

