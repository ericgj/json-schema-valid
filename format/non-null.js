'use strict';

module.exports = function(){

  var instance = this.instance()
    , ret = ( instance !== undefined && instance !== null )
  this.assert( ret,
               'is missing or null'
             );

  return (!!ret);
}

