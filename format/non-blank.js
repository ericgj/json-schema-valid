'use strict';

module.exports = function(){

  var instance = this.instance()
    , ret = ( instance !== undefined && instance !== null && instance !== '' )
  this.assert( ret,
               'missing'
             );

  return (!!ret);
}

