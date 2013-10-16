'use strict';

var isBrowser = require('is-browser')
  , assert = require('assert')
  , Emitter = isBrowser ? require('emitter') : require('emitter-component')
  , type = isBrowser ? require('type') : require('component-type')
  , each = isBrowser ? require('each') : require('each-component')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , validationPlugin = isBrowser ? require('json-schema-valid') : require('json-schema-valid-component')
  , hyperPlugin = isBrowser ? require('json-schema-hyper') : require('json-schema-hyper-component')
  , Schema = core.Schema

Schema.use(validationPlugin);
Schema.use(hyperPlugin);

var listener = validationPlugin.emitter();

listener.on('error', function(e){
  console.error('  %s , %s , error: %o', e.context, e.message, e);
});

listener.on('debug', function(data){
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



