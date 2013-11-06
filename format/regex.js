'use strict';

module.exports = function(){

  var instance = this.instance()
    , instance = instance.toString()

  try      { new RegExp(instance); } 
  catch(e) { return false; }

  return true;
}

