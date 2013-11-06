
# json-schema-valid

  **Please note this library is not ready for production use.**

  A modular javascript [JSON Schema v4][jsonschema] validator.
  
  Suitable for standalone use (see "validator object" mode below),
  or together with other components to handle dereferencing,
  correlation, hypermedia, etc.

  If you are looking for a (mostly) complete JSON Schema toolkit,
  see [json-schema-suite][suite] which bundles the components
  together.


## Installation

[component][component]:

    $ component install ericgj/json-schema-valid

npm:

    $ npm install json-schema-valid-component

## Examples

  There are two basic modes: as a _validator object_, and as a _Correlation
  binding_.

  __Validator object__:
  
```javascript
  var Validator = require('json-schema-valid')

  var validator = new Validator()

  // if schema has already been parsed
  var valid = validator.validate(schema,instance);
  
  // if raw schema object
  var valid = validator.validateRaw(rawSchema,instance);
  
  // checking state
  validator.valid();           // boolean
  validator.error();           // validation errors wrapped in an Error object
  validator.errorTrace();      // array of error messages with indented levels
  validator.assertionTrace();  // array of all assertions made on instance
  validator.errorTree();       // tree structure of validation errors 
  validator.assertionTree();   // tree structure of all assertions

```

  __Correlation binding__:

```javascript

  var core = require('json-schema-core')
    , Schema = core.Schema
    , plugin = require('json-schema-valid')
   
  // attach plugin to Schema 
  Schema.use(plugin);

  // now once you have a correlation, you can call validate() on it
  var valid = correlation.validate();

  // handling validation errors
  correlation.on('error', function(err){
    console.log('validation error: %o', err);
  }

  // subschema for given instance property
  // resolving valid combination conditions (allOf, anyOf, oneOf)
  var subschema = correlation.subschema('foo');

  // resolved URI-template links, including for valid combination conditions
  var links = correlation.links();

  // coerced instance (i.e., type and defaults applied to copy of instance)
  var coerced = correlation.coerce().instance;

```

Note that "raw" assertion data (`assertionTree()`, `assertionTrace()`) are 
_not_ currently available using the 'correlation binding' mode. The error
trace and tree are available through the error object emitted after failed 
validation (see below, "Events").


## Formats

The following JSON Schema v3 format validations are built-in:

  - `datetime` (ISO 8601)
  - `date` (YYYY-MM-DD)
  - `time` (HH:MM:SS)
  - `utc` (milliseconds since 1970-01-01 00:00 UTC)
  - `regex`
  - `phone`
  - `uri`
  - `email`

In addition, a custom format `js-function` is available which allows 
serialization of simple javascript expressions (using the 
[to-function][to-func] library).

You can use this for custom validation involving instance values.
For instance, the rule "x must be greater than 2 times y" can be
expressed in the schema as:

  ```json
  {
    "type": "object",
    "format": "js-function",
    "js-function": "x > 2 * _.y",
    "required": ["x","y"],
    "properties": {
      "x": { "type": "number" },
      "y": { "type": "number" }
    }
  }
  ```

The expression is specified as a string (or object) value of the "js-function"
key.

(Note the [to-function][to-func] library also allows "query-object" style 
conditions as well as strings, see its documentation for details.)

Of course, this custom format will be ignored by other implementations, so
if you are concerned about portability, you may wish to avoid using this 
format. 

Note however there is no current standard for custom validation involving
several instance values (a typical use-case for js-function). The JSON Schema 
v5 spec will have such a standard for simple cases (see 
[draft proposals][v5-proposals]).


## API

### Validator.prototype.validate( schema:Schema, instance:Object, [desc:String], [callback:Function] )

  Validate given instance against given schema.
  Takes optional description string (for error handling) and/or
  callback function. Callback receives array of valid schemas (i.e.,
  the root-level schema plus any schemas valid through combination
  conditions). Callback is only run if validation succeeds (valid).

### Validator.prototype.validateRaw( schema:Object, instance:Object, [desc:String], [callback:Function] )

  Validate given instance against given raw schema (parsing schema first).

### Validator.prototype.valid()

  Result of the last `validate()` call (boolean).

### Validator.prototype.errors()

  If the last `validate()` call returned false (invalid), then returns a tree of
  context objects of the form `{ assertions: [ ], contexts: [ ] }`, where
  `assertions` contains assertion (error) objects, and `contexts` contains other
  (sub-)context objects.

  This structure can be used to build custom error messaging.

### Validator.prototype.errorTrace()

  If the last `validate()` call returned false (invalid), then returns an array
  of error messages for invalid branches, indented according to context level.

### Validator.prototype.assertionTrace()

  Returns array of assertion messages for all validated branches of the last
  `validate()` call (regardless of whether valid or invalid).

### Validator.addType( key:String, validator:Function )

  Add custom validation function. See `type/*.js` for examples of how
  to write validation functions.

### Validator.addFormat( format:String, validator:Function|Regexp )

  Add custom format validation function or regular expression to match.
  Note specifying a regular expression here is essentially like having
  named schema `pattern` properties.

### Correlation#validate( [desc:String], [callback:Function] )

  Validate correlation instance against correlation schema. 

### Correlation#resolveLinks()

  Validate, and return links merged from all valid schemas, if valid.
  
  Intended to be used with the [hyperschema plugin][hyper], to provide
  `links()`, `rel()`, etc. methods to the correlation, when combination
  conditions are specified. If the hyperschema plugin is not used, this
  method returns undefined. 

  See `test/tests.js` for usage examples.

### Correlation#subschema( property:String )

  Validate, and get the subschema describing the given instance property.
  If multiple subschemas are valid, the subschema is normalized as a 
  single allOf condition.

  Intended to be used as the basis for `correlation.getPath()` for 
  co-traversing the schema and instance, when combination conditions are
  specified.

  See `test/tests.js` for usage examples. 

### Correlation#coerce()

  Validate, and coerces instance (applies type and default) according to:
    
  1.  the first valid schema that specifies either `type` or `default` or 
      both;
  2.  the "top-level schema", otherwise


  Note that the ordering of valid schemas cannot be relied on, so it is
  recommended that either the top-level schema specify type and/or default, or
  _only one_ combination schema specify these.

## Events

### Correlation#emit('error', fn[err])

  On validation failure, the correlation emits 'error' with the error.
  `err.message` is the first "top-level" error. `err.trace` is the error trace
  (equivalent of `validator.errorTrace()`). `err.tree` is the error tree
  (equivalent of `validator.errorTree()`).


## Running tests

In browser:

  1. Run `make` to generate JSON Schema test suite files and build the 
     component.

  2. Browse the file `test/index.html`. Tests are run via in-browser mocha.

In node:

  1. Run `make node` to generate JSON Schema test suite files.

  2. `npm test`


## A note on dereferencing

  Dereferencing schemas is _not_ implemented here. It is assumed that schemas
  with JSON references (`$ref`) will have already been dereferenced, making
  use of an http client library. See for example [json-schema-agent][agent],
  which provides both correlation (via HTTP headers) and schema dereferencing.

  My view is that dereferencing necessarily involves external resources
  (the HTTP stack) and thus should be cleanly separated from validation.

  However, if you _know_ that your schema files will only have internal
  (fragment) references, it is possible to dereference without loading
  external resources (what the spec refers to as _inline_ vs. canonical
  dereferencing). For convenience, in the future I will add inline
  dereferencing to [json-schema-core][core]. For now, the underlying Schema
  data structure does provide an interface for manipulating references,
  so it is also possible to roll your own inline dereferencing.


## TODO

  - <del>add common format validators</del>
  - make error data compatible with [tv4][tv4] errors
  - <del>consider emitting schema-level errors or 'error trees' / rework internal
    Context objects</del>
  - more complete walk-through of how to use with json-schema-hyper,
    json-schema-agent, etc. (add to json-schema-suite).
  - bower <del>and npm</del> installation

## Acknowledgements

  The validation logic used in this library is about 90% cribbed from the
  [geraintluff/tv4][tv4] javascript reference implementation. Thanks for
  that Geraint :beers: , and thanks equally for your always-excellent
  documentation of how JSON Schema is supposed to work, both in the specs
  and on the [json-schema email list][group].

  Regular expression for `datetime` format thanks to 
  [Cameron Brooks][regex-datetime].
  
  Regular expression for `uri` format thanks to 
  ["Yaffle"][regex-uri].
  
  Regular expression for `email` format thanks to 
  [Jan Goyvaerts, regular-expressions.info][regex-email].
  
## License

  MIT


[component]: https://github.com/component/component
[jsonschema]: http://json-schema.org
[core]: https://github.com/ericgj/json-schema-core
[hyper]: https://github.com/ericgj/json-schema-hyper
[agent]: https://github.com/ericgj/json-schema-agent
[suite]: https://github.com/ericgj/json-schema-suite
[emitter]: https://github.com/component/emitter
[tv4]: https://github.com/geraintluff/tv4
[group]: https://groups.google.com/forum/#!forum/json-schema
[v5-proposals]: https://github.com/json-schema/json-schema/wiki/v5-Proposals
[to-func]: https://github.com/component/to-function
[regex-datetime]: http://www.pelagodesign.com/blog/2009/05/20/iso-8601-date-validation-that-doesnt-suck/
[regex-uri]: https://gist.github.com/1088850
[regex-email]: http://www.regular-expressions.info/email.html