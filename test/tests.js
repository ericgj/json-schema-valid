'use strict';

var isBrowser = require('is-browser')
  , assert = require('assert')
  , Emitter = isBrowser ? require('emitter') : require('emitter-component')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , validationPlugin = isBrowser ? require('json-schema-valid') : require('json-schema-valid-component')
  , hyperPlugin = isBrowser ? require('json-schema-hyper') : require('json-schema-hyper-component')
  , Schema = core.Schema

var fixtures = {};

Schema.use(validationPlugin);
Schema.use(hyperPlugin);

///////////////////////////////////

describe('json-schema-valid: additional tests', function(){
  describe('simple usage', function(){

    it('should validate and handle errors', function(){
      var schema = new Schema().parse({ minItems: 3 })
        , instance = [1,2]
        , listener = new Emitter()
        , errcount = 0
        , debugcount = 0
      
      listener.on('error', function(e){ errcount++; });
      listener.on('debug', function(e){ debugcount++; });

      var act = validationPlugin(listener).validate(schema,instance); 
      assert(act === false);
      assert(errcount == 1);
      assert(debugcount > 0);
    })

    it('should validate from raw schema', function(){
      var schema = { minItems: 3 }
        , instance = [1,2]
        , listener = new Emitter()
        , errcount = 0
        , debugcount = 0
      
      listener.on('error', function(e){ errcount++; });
      listener.on('debug', function(e){ debugcount++; });

      var act = validationPlugin(listener).validateRaw(schema,instance); 
      assert(act === false);
      assert(errcount == 1);
      assert(debugcount > 0);
    })

  })

  describe('subschema', function(){

    function getCorrelation(schemakey,instancekey){
      instancekey = instancekey || schemakey;
      var schema = new Schema().parse(fixtures.subschema.schema[schemakey]);
      var instance = JSON.parse(JSON.stringify(fixtures.subschema.instance[instancekey]));
      return schema.bind(instance);
    }

    it('should get subschema from schema when valid and no combinations', function(){
     var subject = getCorrelation('none','one');
     var act = subject.subschema('one');
     console.log('subschema no combinations: %o', act);
     var exp = subject.schema.get('properties').get('one');
     assert(act);
     assert(exp);
     assert(act === exp);
    })

    it('should get subschema from schema and from all allOf schemas, when valid', function(){
      var subject = getCorrelation('allof','one');
      var act = subject.subschema('one');
      console.log('subschema allof: %o', act);
      assert(act);
      assert("one: 0" == act.getPath('allOf/0').property('title'));
      assert("one: 1" == act.getPath('allOf/1').property('title'));
      assert("one: 2" == act.getPath('allOf/2').property('title'));
    })

    it('should getPath with allOf schemas, when valid, one schema valid for subpath', function(){
      var subject = getCorrelation('allof','two');
      var act = subject.getPath('one/two');
      console.log('subschema getPath: %o', act);
      assert(act);
      var expschema = subject.schema.getPath('allOf/0/properties/one/properties/two');
      var expinstance = subject.instance.one.two;
      assert(expschema);
      assert(expschema === act.schema);
      assert(expinstance === act.instance);
    })

  })

  describe('links', function(){

    function getCorrelation(schemakey,instancekey){
      instancekey = instancekey || schemakey;
      var schema = new Schema().parse(fixtures.resolvelinks.schema[schemakey]);
      var instance = JSON.parse(JSON.stringify(fixtures.resolvelinks.instance[instancekey]));
      return schema.bind(instance);
    }

    it('should get links from schema when no combinations', function(){
      var subject = getCorrelation('none','one');
      var act = subject.links();
      console.log('links no combinations: %o', act);
      assert(act);
      assert(act.rel('one')); 
      assert(act.rel('one').get('href') == '/1');
    })

    it('should get links from schema and from all allOf schemas, when valid allOf', function(){
      var subject = getCorrelation('allOf','one');
      var act = subject.links();
      console.log('links allOf: %o', act);
      assert(act);
      assert(act.rel('root').get('href') == '#');
      assert(act.get(1).get('href') == '/0/1');
      assert(act.get(2).get('href') == '/1/1');
      assert(act.get(3).get('href') == '/1/2');
    })
  
    /* I'm not even sure this is the appropriate behavior */

    it('should get links from nested allOf schemas, when valid', function(){
      var subject = getCorrelation('nested','one');
      var act = subject.links();
      console.log('links nested: %o', act);
      assert(act);
      assert(act.rel('root').get('href') == '#');
      assert(act.get(1).get('href') == '/0/1');
      assert(act.get(2).get('href') == '/1/1');
      assert(act.get(3).get('href') == '/1/2');
      assert(act.get(4).get('href') == '/alt');
    })

  })
})
    


// fixtures

fixtures.subschema = {}
fixtures.subschema.schema = {}
fixtures.subschema.instance = {}

fixtures.subschema.schema.none = {
  properties: {
    one: {}
  }
}

fixtures.subschema.schema.allof = {
  properties: {
    one: { title: "one: 0" }
  },
  allOf: [
    {
      properties: {
        one: { 
          title: "one: 1", 
          properties: {
            two: {}
          }
        }
      }
    },
    {
      properties: {
        one: { title: "one: 2" }
      }
    }
  ]
}


fixtures.subschema.instance.one = {
  one: { }
}

fixtures.subschema.instance.two = {
  one: { two: {} }
}

fixtures.resolvelinks = {};
fixtures.resolvelinks.schema = {};
fixtures.resolvelinks.instance = {};

fixtures.resolvelinks.schema.none = {
  links: [
    { rel: "one", href: "/{one}" }
  ],
  properties: {
    one: {}
  }
}

fixtures.resolvelinks.schema.allOf = {
  links: [
    { rel: "root", href: "#" }
  ],
  allOf: [
    {
      links: [
        { rel: "one", href: "/0/{one}" }
      ],
      properties: {
        one: { }
      }
    },
    {
      links: [
        { rel: "one", href: "/1/{one}" },
        { rel: "two", href: "/1/{two}" }
      ],
      properties: {
        one: { },
        two: { }
      }
    }
  ]
}

fixtures.resolvelinks.schema.nested = {
  allOf: [
    fixtures.resolvelinks.schema.allOf,
    {
      links: [
        { rel: "alternate", href: "/alt" }
      ]
    }
  ]
}

fixtures.resolvelinks.instance.one = {
  one: 1,
  two: 2
}

