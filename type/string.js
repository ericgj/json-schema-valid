var type = require('type')

module.exports = ValidateString;

function ValidateString(){
  var valid = true
  if (type(this.instance())!=='string') return (valid);
  valid = validateStringLength.call(this) && valid
  valid = validateStringPattern.call(this) && valid
  return (valid);
}

function validateStringLength() {
  var instance = this.instance()
    , min = this.property('minLength')
    , max = this.property('maxLength')
    , valid = true

  if (min){
    valid = this.assert(instance.length >= min, 
                        "is less than the minimum length",
                        "minLength"
                       ) && valid;
  }
  if (max){
    valid = this.assert(instance.length <= max,
                        "is greater than the maximum length",
                        "maxLength"
                       ) && valid;
  }

  return (valid);
}

function validateStringPattern(){
  var pattern = this.property('pattern')
  if (!pattern) return true;
  pattern = new RegExp(pattern);
  return this.assert(pattern.test(this.instance()), 
                     "did not match pattern",
                     "pattern"
                    );
}

