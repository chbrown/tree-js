/** Copyright 2015, Christopher Brown <io@henrian.com>, MIT Licensed

This module serves to convert from unicode strings to byte arrays, and back.

The raw (unencoded) format is UTF16, and the obscure encoding is an array of
bytes, so we _encode_ a string into bytes, and _decode_ bytes into a string.

API:

unicode.encodeString(string: string): number[]

    Takes a native Javascript UTF16 string and returns an Array of bytes.

unicode.decodeBytes(bytes: Uint8Array | number[]): string

    Takes a Uint8Array or native Array of bytes and returns a native Javascript
    UTF16 string.

https://raw.github.com/chbrown/misc-js/master/unicode.js
*/
var unicode = (function() {

  /**
  Takes a native Javascript UTF16 string and returns an Array of bytes.

  Mostly from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
  Except I removed the mapping step so that we only pass over the input once.
  */
  function encodeString(string) {
    var bytes = [];

    for (var index = 0, length = string.length; index < length; index++) {
      var chr = string.charCodeAt(index);
      if (chr < 128) {
        // one byte
        bytes.push(chr);
      } else if (chr < 0x800) {
        // two bytes
        bytes.push(192 + (chr >>> 6),
                   128 + (chr & 63));
      } else if (chr < 0x10000) {
        // three bytes
        bytes.push(224 + (chr >>> 12),
                   128 + (chr >>> 6 & 63),
                   128 + (chr & 63));
      } else if (chr < 0x200000) {
        // four bytes
        bytes.push(240 + (chr >>> 18),
                   128 + (chr >>> 12 & 63),
                   128 + (chr >>> 6 & 63),
                   128 + (chr & 63));
      } else if (chr < 0x4000000) {
        // five bytes
        bytes.push(248 + (chr >>> 24),
                   128 + (chr >>> 18 & 63),
                   128 + (chr >>> 12 & 63),
                   128 + (chr >>> 6 & 63),
                   128 + (chr & 63));
      } else /* if (chr <= 0x7fffffff) */ {
        // six bytes
        bytes.push(252 + (chr >>> 30),
                   128 + (chr >>> 24 & 63),
                   128 + (chr >>> 18 & 63),
                   128 + (chr >>> 12 & 63),
                   128 + (chr >>> 6 & 63),
                   128 + (chr & 63));
      }
    }

    return bytes;
  }

  /**
  Takes a Uint8Array or native Array of bytes and returns a native Javascript
  UTF16 string.

  Mostly from https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding.
  */
  function decodeBytes(bytes) {
    var chunks = [];

    for (var index = 0, length = bytes.length; index < length; index++) {
      var part = bytes[index];
      chunks.push(String.fromCharCode(
        part > 251 && part < 254 && index + 5 < length ? /* six bytes */
          /* (part - 252 << 30) may be not so safe in ECMAScript! So...: */
          (part - 252) * 1073741824 + (bytes[++index] - 128 << 24) + (bytes[++index] - 128 << 18) + (bytes[++index] - 128 << 12) + (bytes[++index] - 128 << 6) + bytes[++index] - 128
        : part > 247 && part < 252 && index + 4 < length ? /* five bytes */
          (part - 248 << 24) + (bytes[++index] - 128 << 18) + (bytes[++index] - 128 << 12) + (bytes[++index] - 128 << 6) + bytes[++index] - 128
        : part > 239 && part < 248 && index + 3 < length ? /* four bytes */
          (part - 240 << 18) + (bytes[++index] - 128 << 12) + (bytes[++index] - 128 << 6) + bytes[++index] - 128
        : part > 223 && part < 240 && index + 2 < length ? /* three bytes */
          (part - 224 << 12) + (bytes[++index] - 128 << 6) + bytes[++index] - 128
        : part > 191 && part < 224 && index + 1 < length ? /* two bytes */
          (part - 192 << 6) + bytes[++index] - 128
        : /* part < 127 ? */ /* one byte */
          part
      ));
    }

    return chunks.join('');
  }

  return {encodeString: encodeString, decodeBytes: decodeBytes};
})();
