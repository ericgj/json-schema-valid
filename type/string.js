var type = require('type')

module.exports = ValidateString;

function ValidateString(){
  return validateStringType.call(this) &&
         (
           validateStringLength.call(this)  ||
           validateStringPattern.call(this)
         );
};

function validateStringType(){
  return this.assert(type(instance) == 'string', "not a string")
}

function validateStringLength() {
  var instance = this.instance
    , min = this.property('minLength')
    , max = this.property('maxLength')
    , valid = true

  if (min){
    valid = this.assert(instance.length >= min) && valid;
  }
  if (max){
    valid = this.assert(instance.length <= max) && valid;
  }

  return (valid);
}

function validateStringPattern(){
  var pattern = this.property('pattern')
  if (!pattern) return true;
  pattern = new RegExp(pattern);
  return this.assert(pattern.test(this.instance), "did not match pattern");
}

