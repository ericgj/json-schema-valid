'use strict';

var isBrowser = require('is-browser')
  , type = isBrowser ? require('type') : require('component-type')

module.exports = ValidateString;

function ValidateString(){
  if (type(this.instance())!=='string') return;
  validateStringLength.call(this)
  validateStringPattern.call(this)
}

function validateStringLength() {
  var instance = this.instance()
    , min = this.property('minLength')
    , max = this.property('maxLength')

  if (min){
    this.assert(instance.length >= min, 
                "is less than the minimum length",
                "minLength",
                instance.length
               );
  }
  if (max){
    this.assert(instance.length <= max,
                "is greater than the maximum length",
                "maxLength",
                instance.length
               );
  }
}

function validateStringPattern(){
  var pattern = this.property('pattern')
  if (!pattern) return;
  pattern = new RegExp(pattern);
  this.assert(pattern.test(this.instance()), 
             "did not match pattern",
             "pattern"
            );
}

