'use strict';

var isBrowser = require('is-browser')
  , assert = require('assert')
  , type = isBrowser ? require('type') : require('component-type')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , Schema = core.Schema
  , Context = isBrowser ? require('json-schema-valid/context') : require('../context')

var fixtures = {}

///////////////////////////////////

describe('json-schema-valid: context unit tests', function(){

  function getContext(type,schkey,instkey){
    var sch = new Schema().parse(fixtures[type].schema[schkey])
      , inst = fixtures[type].instance[instkey]
    return new Context(sch,inst);
  }

  describe('subcontext', function(){

    it('top-level context should have undefined paths', function(){
      var subject = getContext('subcontext','simple','simple')
      assert(subject.schemaPath() === undefined);
      assert(subject.instancePath() === undefined);
    })

    it('should set subschema, subinstance, and paths', function(){
      var subject = getContext('subcontext','simple','simple')
        , act = subject.subcontext('properties/one','one')
      console.log('subcontext simple: %o', act);
      assert(act.schema() == subject.schema().get('properties').get('one'));
      assert(act.instance() == subject.instance().one);
      assert(act.schemaPath() == 'properties/one');
      assert(act.instancePath() == 'one');
    })

    it('should set subschema, subinstance, and paths for nested subcontext calls', function(){
      var subject = getContext('subcontext','nested','nested')
        , act1 = subject.subcontext('items','0')
      console.log('subcontext nested 1: %o', act1);
      var act2 = act1.subcontext('properties/one','one')
      console.log('subcontext nested 2: %o', act2);
      var act3 = act2.subcontext('items','1')
      console.log('subcontext nested 3: %o', act3);
      var act4 = act3.subcontext('properties/two','two')
      console.log('subcontext nested 4: %o', act4);
      assert(act4.schema() == subject.schema().get('items').get('properties').get('one')
                                     .get('items').get('properties').get('two'));
      assert(act4.instance() == subject.instance()[0].one[1].two);
      assert(act4.schemaPath() == 'items/properties/one/items/properties/two');
      assert(act4.instancePath() == '0/one/1/two');
    })

  })

  describe('assert', function(){

    it('should set simple assertion failure', function(){
      var subject = getContext('assert','simple','simple')
      subject.assert(false,'type does not match','type'); 
      var act = subject.assertions()
      console.log('assert simple failure: %o', act);
      assert(act.value().length == 1);
      assert(act.at(0).expected = subject.property('type'));
      assert(act.at(0).actual = subject.instance());
      assert(act.at(0).predicate);
    })

    it('should set simple assertion success', function(){
      var subject = getContext('assert','simple','simple')
      subject.assert(true,'type does not match','type'); 
      var act = subject.assertions()
      console.log('assert simple success: %o', act);
      assert(act.value().length == 1);
      assert(act.at(0).expected = subject.property('type'));
      assert(act.at(0).actual = subject.instance());
      assert(!act.at(0).predicate);
    })

    it('should set simple assertion failure with actual value', function(){
      var subject = getContext('assert','simple','simple')
      subject.assert(false,'type does not match','type', type(subject.instance())); 
      var act = subject.assertions()
      console.log('assert simple failure with actual value: %o', act);
      assert(act.value().length == 1);
      assert(act.at(0).actual = type( subject.instance()) );
      assert(act.at(0).instanceValue = subject.instance() );
    })
  
    it('should set nested assertions', function(){
      var subject = getContext('assert','nested','nested')
        , sub = subject.subcontext('properties/one','one')
      sub.assert(false,'type does not match','type');
      sub.assert(false,'something else is wrong with property one');
      subject.assert(false,'properties invalid'); // simulating nested error
      subject.assert(true,'dependencies valid');
      var act = subject.assertions()
      console.log('assert nested: %o', act);
      assert(act.value().length == 4);
      var trace = subject.errorTrace()
      for (var i=0;i<trace.length;++i){
        console.log(trace[i]);
      }
    })

  })

})


fixtures.subcontext = {}
fixtures.subcontext.schema = {}
fixtures.subcontext.schema.simple = {
  properties: {
    one: { type: 'string' }
  }
}
fixtures.subcontext.schema.nested = {
  items: {
    properties: {
      one: {
        items: {
          properties: {
            two: { type: 'boolean' }
          }
        }
      }
    }
  }
}


fixtures.subcontext.instance = {}
fixtures.subcontext.instance.simple = {
  one: "hello"
}

fixtures.subcontext.instance.nested = [
  { 
    one: [
      { two: false },
      { two: true }
    ]
  },
  {
    one: [
      { two: true },
      { two: false }
    ]
  }
]


fixtures.assert = {};
fixtures.assert.schema = {};
fixtures.assert.schema.simple = {
  type: 'string'
}

fixtures.assert.schema.nested = {
  properties: {
    one: { type: 'string'}
  }
}


fixtures.assert.instance = {}
fixtures.assert.instance.simple = 1
fixtures.assert.instance.nested = {
  one: 1
}

