'use strict';

var isBrowser = require('is-browser')
  , assert = require('assert')
  , type = isBrowser ? require('type') : require('component-type')
  , each = isBrowser ? require('each') : require('each-component')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , validationPlugin = isBrowser ? require('json-schema-valid') : require('json-schema-valid-component')
  , Validator = validationPlugin
  , hyperPlugin = isBrowser ? require('json-schema-hyper') : require('json-schema-hyper-component')
  , Schema = core.Schema

if (!isBrowser && !window){
  var window = {}
  window['json-schema-test-suite'] = {};

  var fs = require('fs')
  var files = fs.readdirSync(__dirname + '/suite.node')
  each(files, function(file){
    // excluded tests
    if (file == 'ref.json' || file == 'refRemote.json' ||  file == 'definitions.json') return;
    console.log('loading...' + file);
    window['json-schema-test-suite'][file] = require(__dirname + '/suite.node/' + file);
  })
}

Schema.use(validationPlugin);
Schema.use(hyperPlugin);

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
      var exp = testcase.valid
        , instance = testcase.data

      console.log(testcase.description + ' : %o , expected: %s', [obj.schema, instance], exp);

      it(testcase.description, function(){
        var validator = new Validator()
          , act = validator.validate(schema,instance)

        ////// This is strictly for debugging. If all tests pass, none of this will output.
        if (exp !== act){
          console.error(testcase.description + ' : %o , expected: %s', [obj.schema, instance], exp);
          var trace = validator.context().trace()
          for (var i=0;i<trace.length;++i){
            console.log("  " + trace[i]);
          }
        }
        //////

        assert(exp == act);
      })
    })
  })
}



