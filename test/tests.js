'use strict';

var isBrowser = require('is-browser')
  , assert = require('assert')
  , core = isBrowser ? require('json-schema-core') : require('json-schema-core-component')
  , validationPlugin = isBrowser ? require('json-schema-valid') : require('json-schema-valid-component')
  , Validator = validationPlugin
  , hyperPlugin = isBrowser ? require('json-schema-hyper') : require('json-schema-hyper-component')
  , Schema = core.Schema

var fixtures = {};

Schema.use(validationPlugin);
Schema.use(hyperPlugin);

/* add optional formats */
validationPlugin.addFormat('js-function', require('json-schema-valid/format/js-function'))
validationPlugin.addFormat('non-null', require('json-schema-valid/format/non-null'))
validationPlugin.addFormat('non-blank', require('json-schema-valid/format/non-blank'))

///////////////////////////////////

describe('json-schema-valid: additional tests', function(){
  describe('simple usage', function(){

    it('should validate and handle errors', function(){
      var schema = new Schema().parse({ minItems: 3 })
        , instance = [1,2]
      
      var validator = validationPlugin()
      validator.validate(schema,instance); 
      var act = validator.context();
      console.log('simple usage: %o', act);
      assert(act.valid() === false);
      console.log('simple usage errors: %o', act.errorTree());
      var trace = act.errorTrace()
      assert(trace);
      assert(trace.length > 0);
      for (var i=0;i<trace.length;++i){
        console.log('  '+trace[i]);
      };
    })

    it('should validate from raw schema', function(){
      var schema = { minItems: 3 }
        , instance = [1,2]
      
      var validator = validationPlugin()
      validator.validateRaw(schema,instance); 
      var act = validator.context();
      assert(act.valid() === false);
      assert(act.errorTrace());
      assert(act.errorTrace().length > 0);
    })

  })

  describe('correlation validate', function(){

    it('should emit error when invalid, with error object', function(done){
      var schema = new Schema().parse({ minItems: 3 })
        , instance = [1,2]
        , corr = schema.bind(instance)
        , count = 0

      corr.on('error', function(err){
        console.log('correlation validate error: %o', err);
        count++;
        if (count == 2) done();
      })

      corr.validate();
      corr.instance = [1];
      corr.validate();

    })

  })

  describe('correlation subschema', function(){

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

    it('should get empty schema when valid and specified path not covered by schema', function(){
      var subject = getCorrelation('none','notcovered');
      var act = subject.subschema('two');
      console.log('subschema not covered: %o', act);
      assert(act);
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

  describe('correlation links', function(){

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

  describe('correlation coerce', function(){

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
    
    it('should coerce false instances', function(){
      var subject = getCorrelation('booltype','falseval')
        , act = subject.coerce()
      assert(act);
      assert(act.instance == subject.instance);
    })

  })

  describe('correlation context', function(){
 
    it('errors should not include anyOf combination errors when context is valid', function(){
      var schema = new Schema().parse(fixtures.context.schema.anyof)
        , inst = fixtures.context.instance.anyofvalid
        , validator = new Validator()
      validator.validate(schema,inst);
      assert(validator.valid());
      console.log('context anyOf valid: %o', validator.errorTree());
      var trace = validator.errorTrace()
      assert(!trace);
      console.log('context anyOf valid: full assertion trace');
      trace = validator.assertionTrace()
      for (var i=0;i<trace.length;++i){
        console.log('  '+trace[i]);
      };
    })

    it('error should be undefined when context is valid', function(){
      var schema = new Schema().parse(fixtures.context.schema.anyof)
        , inst = fixtures.context.instance.anyofvalid
        , validator = new Validator()
      validator.validate(schema,inst);
      assert(validator.valid());
      var e = validator.error()
      assert(e === undefined);
    })

    it('errors should not include internal anyOf combination errors when context is invalid due to other conditions', function(){
      var schema = new Schema().parse(fixtures.context.schema.nestedanyof)
        , inst = fixtures.context.instance.nestedanyofinvalid
        , validator = new Validator()
      validator.validate(schema,inst);
      assert(!validator.valid());
      console.log('context anyOf invalid: %o', validator.errorTree());
      var trace = validator.errorTrace()
      for (var i=0;i<trace.length;++i){
        console.log('  '+trace[i]);
      };
      assert(trace);
      assert(trace.length == 2);
      console.log('context anyOf invalid: full assertion trace');
      trace = validator.assertionTrace()
      for (var i=0;i<trace.length;++i){
        console.log('  '+trace[i]);
      };
    })

    it('error should be defined when context is invalid', function(){
      var schema = new Schema().parse(fixtures.context.schema.nestedanyof)
        , inst = fixtures.context.instance.nestedanyofinvalid
        , validator = new Validator()
      validator.validate(schema,inst);
      assert(!validator.valid());
      var e = validator.error();
      var trace = validator.errorTrace();
      console.log('context anyOf invalid error object: %o', e);
      assert(e);
      assert(e.message == trace[0]);
    })

  })

  describe('undefined values', function(){
    function getCorrelation(schemakey,instancekey){
      instancekey = instancekey || schemakey;
      var schema = new Schema().parse(fixtures['undef'].schema[schemakey]);
      var instance = fixtures['undef'].instance[instancekey];
      return schema.bind(instance);
    }

    it('should ignore type validation of javascript undefined values', function(){
      var subject = getCorrelation('type', 'valid')
      subject.once('error', function(err){
        console.log('undefined values: type validation errors: %o', err.trace);
      })
      var act = subject.validate();
      assert(act);
    })

    it('should ignore format validation of javascript undefined values', function(){
      var subject = getCorrelation('format', 'valid')
      subject.once('error', function(err){
        console.log('undefined values: format validation errors: %o', err.trace);
      })
      var act = subject.validate();
      assert(act);
    })
     
  })

  describe('format: email', function(){
     function getCorrelation(schemakey,instancekey){
      instancekey = instancekey || schemakey;
      var schema = new Schema().parse(fixtures['emailformat'].schema[schemakey]);
      var instance = JSON.parse(JSON.stringify(fixtures['emailformat'].instance[instancekey]));
      return schema.bind(instance);
    }

    it('should validate correctly when valid', function(){
      var subject = getCorrelation('simple', 'valid')
      subject.on('error', function(err){
        console.log('email format valid error: %o', err);
      });
      var act = subject.validate();
      assert(act);
    })

    it('should validate correctly when invalid', function(){
      var subject = getCorrelation('simple', 'invalid')
      subject.on('error', function(err){
        console.log('email format invalid error: %o', err);
      });
      var act = subject.validate();
      assert(!act);
    })
   
  })

  describe('format: js-function', function(){

    function getCorrelation(schemakey,instancekey){
      instancekey = instancekey || schemakey;
      var schema = new Schema().parse(fixtures['js-function'].schema[schemakey]);
      var instance = JSON.parse(JSON.stringify(fixtures['js-function'].instance[instancekey]));
      return schema.bind(instance);
    }

    it('should validate correctly when valid', function(){
      var subject = getCorrelation('simple', 'valid')
      subject.on('error', function(err){
        console.log('js-function valid error: %o', err);
      });
      var act = subject.validate();
      assert(act);
    })

    it('should validate correctly when invalid', function(){
      var subject = getCorrelation('simple', 'invalid')
      subject.on('error', function(err){
        console.log('js-function invalid error: %o', err);
      });
      var act = subject.validate();
      assert(!act);
    })

  })
  
  describe('format: non-null', function(){

    it('should validate correctly when valid', function(){
      var schema = new Schema().parse({ properties: { one: { format: 'non-null' } } })
        , instance = {one: ''}
        , subject = schema.bind(instance)
        , act = subject.validate()
      assert(act);
    })

    it('should validate correctly when invalid', function(){
      var schema = new Schema().parse({ properties: { one: { format: 'non-null' } } })
        , instance = {one: null}
        , subject = schema.bind(instance)
      subject.on('error', function(err){ console.log('non-null invalid error: %o', err); });
      var act = subject.validate();
      assert(!act);
    })

  })

  describe('format: non-blank', function(){

    it('should validate correctly when valid', function(){
      var schema = new Schema().parse({ properties: { one: { format: 'non-blank' }}})
        , instance = {one: '0'}
        , subject = schema.bind(instance)
        , act = subject.validate()
      assert(act);
    })

    it('should validate correctly when null (invalid)', function(){
      var schema = new Schema().parse({ properties: { one: { format: 'non-blank' }}})
        , instance = {one: null}
        , subject = schema.bind(instance)
      subject.on('error', function(err){ console.log('non-blank null error: %o', err); });
      var act = subject.validate();
      assert(!act);
    })

    it('should validate correctly when empty string (invalid)', function(){
      var schema = new Schema().parse({ properties: { one: { format: 'non-blank' }}})
        , instance = {one: ''}
        , subject = schema.bind(instance)
      subject.on('error', function(err){ console.log('non-blank empty string error: %o', err); });
      var act = subject.validate();
      assert(!act);
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

fixtures.subschema.instance.notcovered = {
  one: { },
  two: { }
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

fixtures.coerce.schema.booltype = {
  type: "boolean"
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

fixtures.coerce.instance.falseval = false;


fixtures.context = {}
fixtures.context.schema = {}
fixtures.context.schema.anyof = {
  type: 'array',
  items: {
    anyOf: [
      {
        properties: {
          one: { type: 'string'},
        },
        required: ["one"]
      },
      {
        properties: {
          two: { type: 'integer'}
        },
        required: ["two"]
      },
      {
        properties: {
          three: { type: 'boolean'}
        },
        required: ["three"]
      }
    ]
  }
}

fixtures.context.schema.nestedanyof = {
  type: 'object',
  properties: {
    one: {
      type: 'number',
      anyOf: [
        {
          minimum: 10
        },
        {
          maximum: 3
        }
      ]
    },
    two: { type: 'number' }
  },
  required: ["one","two"]
}


fixtures.context.instance = {};
fixtures.context.instance.anyofvalid = [
  { one: true, two: false, three: true},
  { one: 1, two: 2, three: 3 },
  { one: "1", two: "2", three: "3"}
]

fixtures.context.instance.nestedanyofinvalid = {
  "one": 11,
  "two": "string, not a number"
}

fixtures.undef = {}; 
fixtures.undef.schema = {};
fixtures.undef.schema.type = {
  properties: {
    one: { type: 'string' }
  }
}
fixtures.undef.schema.format = {
  properties: {
    one: { format: 'email' }
  }
}

fixtures.undef.instance = {};
fixtures.undef.instance.valid = {
  one: undefined
}

fixtures['emailformat'] = {};
fixtures['emailformat'].schema = {};
fixtures['emailformat'].schema.simple = {
  type: 'object',
  properties: {
    email: { format: 'email' }
  },
  required: ["email"]
}

fixtures['emailformat'].instance = {};
fixtures['emailformat'].instance.valid = {
  email: "hello.kitty+junk@mail.a.b.c.edu"
}
fixtures['emailformat'].instance.invalid = {
  email: "hello.kitty+junk@.a.b.c.edu"
}





fixtures['js-function'] = {};
fixtures['js-function'].schema = {};
fixtures['js-function'].schema.simple = {
  type: 'object',
  properties: {
    one: { type: 'number' },
    two: { type: 'number' }
  },
  required: ['one','two'],
  format: "js-function",
  "js-function": "one > (2 * _.two)"
}

fixtures['js-function'].instance = {};
fixtures['js-function'].instance.valid = {
  one: 11,
  two: 5
}
fixtures['js-function'].instance.invalid = {
  one: 10,
  two: 5
}



