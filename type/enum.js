'use strict';
var deepEqual = require('../deepequal')

module.exports = validateEnum;

function validateEnum(){
  var values = this.property('enum')
    , instance = this.instance()
    , valid = true

  if (!values) return (valid);
  valid = this.assert(type(values)=='array',
                      "specified enum is not an array",
                      "enum"
                     ) && valid

  if (!valid) return (valid);

  var found = false;
  for (var i=0;i<values.length;++i){
    if (deepEqual(values[i],instance)){ found = true; break; }
  }
  valid = this.assert(found, "not a valid value", "enum") && valid;
  return (valid);
}

