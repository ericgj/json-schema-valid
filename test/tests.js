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

    it('should validate subschema', function(){
      var subject = getCorrelation('validate','validate');
      var sub = subject.subschema('one')
        , act = sub.bind(subject.instance['one'])
      assert(act.validate());
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

  describe('coerce', function(){

    function getCorrelation(schemakey,instancekey){
      instancekey = instancekey || schemakey;
      var schema = new Schema().parse(fixtures.coerce.schema[schemakey]);
      var instance = JSON.parse(JSON.stringify(fixtures.coerce.instance[instancekey]));
      return schema.bind(instance);
    }

    it('should coerce using valid top-level schema when no combinations', function(){
      var subject = getCorrelation('none','obj')
        , act = subject.coerce()
        , expdefault = subject.schema.property('default')
        , expinst = subject.instance
      assert(act);
      console.log('coerce no combinations: %o', act.instance);
      assert(act.instance);
      assert(act.instance.one == expinst.one);
      assert(act.instance.two == expdefault.two);
      assert(act.instance.three == expinst.three);
    })

    it('should return undefined if not valid', function(){
      var subject = getCorrelation('none','invalid')
        , act = subject.coerce()
      assert(act === undefined);
    })

    it('should coerce using first valid schema that has type specified', function(){
      var subject = getCorrelation('comboType','obj')
        , act = subject.coerce()
      assert(act);
      console.log('coerce combinations type: %o', act.instance);
      assert(act.instance);
      assert.deepEqual(act.instance, subject.instance);
    })

    it('should coerce using first valid schema that has default specified', function(){
      var subject = getCorrelation('comboDefault','obj')
        , act = subject.coerce()
        , expdefault = subject.schema.$('#/anyOf/1').property('default')
        , expinst = subject.instance
      assert(act);
      console.log('coerce combinations default: %o', act.instance);
      assert(act.instance);
      assert(act.instance.one); assert(act.instance.two); assert(act.instance.three);
      assert(act.instance.one == expinst.one); 
      assert(act.instance.two == expdefault.two); 
      assert(act.instance.three == expinst.three); 
    })

    it('should coerce as deep-equal to instance if no type or default specified in any valid schemas', function(){
      var subject = getCorrelation('comboNone', 'array')
        , act = subject.coerce()
      assert(act);
      console.log('coerce combinations no type or default: %o', act.instance);
      assert(act.instance);
      assert.deepEqual(act.instance, subject.instance);
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

fixtures.subschema.schema.validate = {
  type: 'object',
  properties: {
    one: 'string'
  }
}


fixtures.subschema.instance.one = {
  one: { }
}

fixtures.subschema.instance.two = {
  one: { two: {} }
}

fixtures.subschema.instance.validate = {
  one: "1"
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


fixtures.coerce = {};
fixtures.coerce.schema = {};
fixtures.coerce.schema.none = {
  required: ["one"],
  default: { one: "1", two: "2" }
}

fixtures.coerce.schema.comboType = {
  required: ["one"],
  anyOf: [
    {
      properties: {
        "two": { type: 'string' }
      },
      required: ["two"]
    },
    {
      type: 'array'
    },
    {
      type: 'object',
      minProperties: 2
    }
  ],
  oneOf: [
    { 
      required: ["three"]
    },
    {
      required: ["four"]
    },
    {
      required: ["five"]
    }
  ]
}

fixtures.coerce.schema.comboDefault = {
  required: ["one"],
  anyOf: [
    {
      type: 'array'
    },
    {
      maxProperties: 5,
      default: { one: "11", two: "22", three: "33" }
    },
    {
      minProperties: 2
    },
    {
      properties: {
        "two": { type: "string" }
      },
      required: ["two"],
      default: { two: "22" }
    }
  ]
}

fixtures.coerce.schema.comboNone = {
  anyOf: [
    { minItems: 1 },
    { type: 'array',
      items: { type: "numeric" } 
    },
    { items: {
        required: ["one","two","three"]
      }
    }
  ]
}

fixtures.coerce.instance = {};
fixtures.coerce.instance.obj = {
  one: "1",
  three: "3"
}

fixtures.coerce.instance.invalid = {
  two: "2",
  three: "3"
}

fixtures.coerce.instance.array = [
 { one: "1", two: "2", three: "3" },
 { one: "11", two: "22", three: "33" }
]


