'use strict';

var toFunc = require('to-function')

module.exports = function(){

  var instance = this.instance()
    , strfn = this.property('js-function')

  if (strfn === undefined) return;
  
  var fn = toFunc(strfn)
    , ret, msg

  try      { ret = fn(instance); }
  catch(e) { ret = false; msg = e.message; }

  this.assert( ret,
               'does not meet condition "' + strfn + '"' + 
                 (msg ? " ; " + msg : "")
             );

  return (!!ret);
}

