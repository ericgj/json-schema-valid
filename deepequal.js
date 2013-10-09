
/* 
 * Copied from sinon.js, minus the Element equality checking not needed here.
 * http://github.com/cjohansen/Sinon.JS
 * (BSD License -- see below)
 *
 */
module.exports = function deepEqual(a, b) {

  if (typeof a != "object" || typeof b != "object") {
      return a === b;
  }

  if (a === b) {
      return true;
  }

  if ((a === null && b !== null) || (a !== null && b === null)) {
      return false;
  }

  var aString = Object.prototype.toString.call(a);
  if (aString != Object.prototype.toString.call(b)) {
      return false;
  }

  if (aString == "[object Array]") {
      if (a.length !== b.length) {
          return false;
      }

      for (var i = 0, l = a.length; i < l; i += 1) {
          if (!deepEqual(a[i], b[i])) {
              return false;
          }
      }

      return true;
  }

  var prop, aLength = 0, bLength = 0;

  for (prop in a) {
      aLength += 1;

      if (!deepEqual(a[prop], b[prop])) {
          return false;
      }
  }

  for (prop in b) {
      bLength += 1;
  }

  return aLength == bLength;
}

/*

(The BSD License)

Copyright (c) 2010-2013, Christian Johansen, christian@cjohansen.no
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright notice,
      this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.
    * Neither the name of Christian Johansen nor the names of his contributors
      may be used to endorse or promote products derived from this software
      without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/
