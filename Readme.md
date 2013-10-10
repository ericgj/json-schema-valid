
# json-schema-valid

  A modular javascript [JSON Schema][jsonschema] validator
  

## Installation

  Via [component][component]:

    $ component install ericgj/json-schema-valid

## Example

```javascript

  var core = require('json-schema-core')
    , Schema = core.Schema
    , plugin = require('json-schema-valid')

  // validation is implemented as a plugin to Schema
  Schema.use(plugin);

  // error handling via emitter
  plugin.on('error', function(e){
    console.error('Error: %o', e);
  })

  // add format validators
  plugin.addFormat('date', myDateFormatValidator);

  // bind schema to instance (correlation)
  var schema = new Schema().parse(rawSchema)
  var correlation = schema.bind(instance);

  // validate() returns boolean, emitting errors
  var valid = correlation.validate();

  // get subschema for instance property
  // resolving valid combination conditions (allOf, anyOf, oneOf)
  var subschema = correlation.subschema('foo');

  // get resolved links, including for valid combination conditions
  var links = correlation.links();

```

## API

### `Correlation#validate( [desc:String], [callback:Function] )`

  Validate correlation instance against correlation schema. 
  Takes optional description string (for error handling) and/or
  callback function. Callback receives array of valid schemas (i.e.,
  the root-level schema plus any schemas valid through combination
  conditions). Callback is only run if validation succeeds (valid).

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

