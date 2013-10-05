var assert = require('timoxley-assert')
  , core = require('json-schema-core')
  , validationPlugin = require('json-schema-valid')
  , hyperPlugin = require('json-schema-hyper')
  , Schema = core.Schema

fixtures = {};

Schema.use(validationPlugin);
Schema.use(hyperPlugin);

///////////////////////////////////

describe('json-schema-valid', function(){
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

