'use strict';

var assert = require('timoxley-assert')
  , type = require('type')
  , each = require('each')
  , core = require('json-schema-core')
  , validationPlugin = require('json-schema-valid')
  , hyperPlugin = require('json-schema-hyper')
  , Schema = core.Schema

Schema.use(validationPlugin);
Schema.use(hyperPlugin);

validationPlugin.on('error', function(e){
  console.error('  %s , %s , error: %o', e.context, e.message, e);
});

validationPlugin.on('debug', function(data){
  console.debug('  %s , %s , debug: %o', data.context, data.message, data);
})

var suite = window['json-schema-test-suite']

describe('json-schema-valid: suite', function(){

  // each(suite, function(tests){
  for (var key in suite){
    
    describe(key, function(){

      var tests = suite[key]
      tests = type(tests) == 'array' ? tests : [tests]

      // each(tests, function(test){
      for (var j=0;j<tests.length;++j){
        var test = tests[j]
        genTests(test);
      }

    })
  }

  
})


function genTests(obj){
  
  describe(obj.description, function(){

    var schema = new Schema().parse(obj.schema)

    each(obj.tests, function(testcase){
    //for (var i=0;i<obj.tests.length;++i){
    //  var testcase = obj.tests[i]
      var exp = testcase.valid
        , instance = testcase.data
        , subject = schema.bind(instance)
      console.log(testcase.description + ' : %o , expected: %s', [subject.schema, subject.instance], exp);

      it(testcase.description, function(){
        // this is a kludge to get around scoping issues
        schema.addProperty('description', obj.description + " :: " + testcase.description);
        // var desc = obj.description + " :: " + testcase.description;
        assert(exp == subject.validate());
      })
    })
  })
}



