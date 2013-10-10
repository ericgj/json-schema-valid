
# json-schema-valid

  A modular javascript [JSON Schema][jsonschema] validator
  

## Installation

  Via [component][component]:

    $ component install ericgj/json-schema-valid

## Examples

  There are two basic modes: as a _simple function_, and as a _Correlation
  binding_.

  In either case, the validate() function returns boolean, and an
  [Emitter][emitter] is used for error handling.

  __Simple function__:
  
```javascript
  var Validator = require('json-schema-core')
    , Emitter = require('emitter')

  // error handling via external emitter
  var emitter = new Emitter();
  emitter.on('error', function(e){
    console.error('Error: %o', e);
  })

  var validator = new Validator(emitter)

  // if schema has already been parsed
  var valid = validator.validate(schema,instance);
  
  // if raw schema object
  var valid = validator.validateRaw(rawSchema,instance);
  
```

  __Correlation binding__:

```javascript

  var core = require('json-schema-core')
    , Schema = core.Schema
    , plugin = require('json-schema-valid')
   
  // attach plugin to Schema 
  Schema.use(plugin);

  // error handling via 'default' emitter
  var emitter = plugin.emitter();
  emitter.on('error', function(e){
    console.error('Error: %o', e);
  })

  // once you have a correlation, you can call validate() on it
  var valid = correlation.validate();

  // subschema for given instance property
  // resolving valid combination conditions (allOf, anyOf, oneOf)
  var subschema = correlation.subschema('foo');

  // resolved URI-template links, including for valid combination conditions
  var links = correlation.links();

```

## API

### `Validator.prototype.validate(` <br> `schema:Schema, instance:Object,` <br> `[desc:String], [callback:Function] )`

  Validate given instance against given schema.
  Takes optional description string (for error handling) and/or
  callback function. Callback receives array of valid schemas (i.e.,
  the root-level schema plus any schemas valid through combination
  conditions). Callback is only run if validation succeeds (valid).

### `Validator.prototype.validateRaw(` <br> `schema:Object, instance:Object,` <br> `schema:Object, instance:Object,`

  Validate given instance against given raw schema (parsing schema first).

### `Validator.addType( key:String, validator:Function )`

  Add custom validation function. See `types/*.js` for examples of how
  to write validation functions.

### `Validator.addFormat( format:String, validator:Function|Regexp )`

  Add custom format validation function or regular expression to match.
  Note specifying a regular expression here is essentially like having
  named schema `pattern` properties.

### `Validator.emitter( )`

  Returns a (singleton) Emitter instance, used by default when a 
  validator is not initialized with an external emitter.
 

### `Correlation#validate( [desc:String], [callback:Function] )`

  Validate correlation instance against correlation schema. 

### `Correlation#resolveLinks()`

  Validate, and return links merged from all valid schemas, if valid.
  
  Intended to be used with the [hyperschema plugin][hyper], to provide
  `links()`, `rel()`, etc. methods to the correlation, when combination
  conditions are specified. If the hyperschema plugin is not used, this
  method returns undefined. 

  See `test/tests.js` for usage examples.

### `Correlation#subschema( property:String )`

  Validate, and get the subschema describing the given instance property.
  If multiple subschemas are valid, the subschema is normalized as a 
  single allOf condition.

  Intended to be used as the basis for `correlation.getPath()` for 
  co-traversing the schema and instance, when combination conditions are
  specified.

  See `test/tests.js` for usage examples. 

 
## Running tests

  1. Run `make` to generate JSON Schema test suite files and build the 
     component.

  2. Browse the file `test/index.html`. Tests are run via in-browser mocha.

## A note on dereferencing

  Dereferencing schemas is _not_ implemented here. It is assumed that schemas
  with JSON references (`$ref`) will have already been dereferenced, making use
  of an http client library. See for example [json-schema-agent][agent], which
  provides both correlation (via HTTP headers) and schema dereferencing. The
  underlying Schema data structure does provide an interface for manipulating
  references, so it is also possible to roll your own dereferencing.

  My view is that dereferencing necessarily involves external resources
  (the HTTP stack) and thus should be cleanly separated from validation.

## TODO

  - add common format validators
  - make error data compatible with tv4 errors
  - consider emitting schema-level errors or 'error trees'
  - non-plugin interface to validate raw schema and instance
  - more complete walk-through of how to use with json-schema-hyper,
    json-schema-agent, etc.
  - bower and npm installation

## License

  MIT


[component]: https://github.com/component/component
[jsonschema]: http://json-schema.org
[hyper]: https://github.com/ericgj/json-schema-hyper
[agent]: https://github.com/ericgj/json-schema-agent
[emitter]: https://github.com/component/emitter

