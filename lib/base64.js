/** Copyright 2015, Christopher Brown <io@henrian.com>, MIT Licensed

Encoding takes us from the raw source to a more obscure format.
Decoding gets us from that format back to the raw source.

In this case, the raw (unencoded) source is an array of bytes, and the obscured
format is the base64 string.

API:

base64.encodeBytes(bytes: Uint8Array | number[], alphabet?: string): string

    Takes a Uint8Array or Array of bytes (numbers in the range 0-255) and
    returns a Javascript string representing the bytes, using the base64
    alphabet.

base64.decodeString(string: string, alphabet?: string): number[]

    Takes a Javascript string and decodes it as base64 into an array of bytes.

When the optional alphabet argument is not specified, it uses the standard
base64 alphabet:

    ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=

The given alphabet should be 65 characters long, with the 65th character
representing the padding character.

https://raw.github.com/chbrown/misc-js/master/base64.js
*/
var base64 = (function() {

  var standard_alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  /**
  Converts a Uint8Array or native Array of bytes and returns a native
    Javascript string representation in base64.

  Mostly from https://gist.github.com/jonleighton/958841, benchmarks at:
  http://jsperf.com/encoding-xhr-image-data/5
  */
  function encodeBytes(bytes, alphabet) {
    if (alphabet === undefined) alphabet = standard_alphabet;

    var bytes_length = bytes.length;
    var byteRemainder = bytes_length % 3;
    var mainLength = bytes_length - byteRemainder;

    var a, b, c, d;
    var chunk;

    var chunks = [];

    // Main loop deals with bytes in chunks of 3
    for (var i = 0; i < mainLength; i = i + 3) {
      // Combine the three bytes into a single integer
      chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

      // Use bitmasks to extract 6-bit segments from the triplet
      a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
      b = (chunk & 258048)   >> 12; // 258048   = (2^6 - 1) << 12
      c = (chunk & 4032)     >>  6; // 4032     = (2^6 - 1) << 6
      d = chunk & 63;               // 63       = 2^6 - 1

      // Convert the raw binary segments to the appropriate ASCII encoding
      chunks.push(alphabet[a] + alphabet[b] + alphabet[c] + alphabet[d]);
    }

    // Deal with the remaining bytes and padding
    if (byteRemainder == 1) {
      chunk = bytes[mainLength];

      a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

      // Set the 4 least significant bits to zero
      b = (chunk & 3)   << 4; // 3   = 2^2 - 1

      chunks.push(alphabet[a] + alphabet[b] + '==');
    }
    else if (byteRemainder == 2) {
      chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

      a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
      b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4

      // Set the 2 least significant bits to zero
      c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

      chunks.push(alphabet[a] + alphabet[b] + alphabet[c] + '=');
    }

    return chunks.join('');
  }

  /**
  From https://github.com/danguer/blog-examples/blob/master/js/base64-binary.js

  Decode a base64-encoded Javascript string into an array of bytes.

  References:
  https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
  https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array

  Copyright (c) 2011, Daniel Guerrero, BSD Licensed
  */
  function decodeString(string, alphabet) {
    if (alphabet === undefined) alphabet = standard_alphabet;

    var bytes = [];

    for (var index = 0, length = string.length; index < length; index += 4) {
      // get the values of the next 4 base64 chars
      var c1 = alphabet.indexOf(string[index    ]);
      var c2 = alphabet.indexOf(string[index + 1]);
      var c3 = alphabet.indexOf(string[index + 2]);
      var c4 = alphabet.indexOf(string[index + 3]);
      // and derive the original bytes from them
      var b1 = (c1 << 2) | (c2 >> 4);
      var b2 = ((c2 & 15) << 4) | (c3 >> 2);
      var b3 = ((c3 & 3) << 6) | c4;
      // detect padding chars and adjust final length accordingly
      if (c3 === 64) {
        if (c4 === 64) {
          // 2 padding bytes
          bytes.push(b1);
        }
        else {
          // 1 padding byte
          bytes.push(b1, b2);
        }
      }
      else {
        // no padding
        bytes.push(b1, b2, b3);
      }
    }

    return bytes;
  }

  return {encodeBytes: encodeBytes, decodeString: decodeString};
})();
