/*jslint browser: true */ /*globals pako */
var base64_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

/**
Compress a normal Javascript UTF16 string and encode the result as a base64 string.
*/
function compress(string) {
  if (string === undefined || string === '') return '';
  var bytes = string_to_Uint8Array(string);
  var compressed_bytes = pako.deflate(bytes);
  // TODO: avoid base64's odd characters: +, /, and =
  return Uint8Array_to_base64(compressed_bytes);
}

/**
Decode and decompress a base64-encoded string into the original string.
*/
function decompress(base64) {
  if (base64 === undefined || base64 === '') return '';
  var compressed_bytes = base64_to_Uint8Array(base64);
  var bytes = pako.inflate(compressed_bytes);
  return Uint8Array_to_string(bytes);
}

/**
Converts an Array / TypedArray directly to base64, without any intermediate
'convert to string then use window.btoa' step. According to my tests,
this appears to be a faster approach: http://jsperf.com/encoding-xhr-image-data/5

https://gist.github.com/jonleighton/958841
*/
function Uint8Array_to_base64(bytes) {
  var base64    = '';

  var byteLength    = bytes.byteLength;
  var byteRemainder = byteLength % 3;
  var mainLength    = byteLength - byteRemainder;

  var a, b, c, d;
  var chunk;

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
    base64 += base64_chars[a] + base64_chars[b] + base64_chars[c] + base64_chars[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder == 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3)   << 4; // 3   = 2^2 - 1

    base64 += base64_chars[a] + base64_chars[b] + '==';
  }
  else if (byteRemainder == 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008)  >>  4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15)    <<  2; // 15    = 2^4 - 1

    base64 += base64_chars[a] + base64_chars[b] + base64_chars[c] + '=';
  }

  return base64;
}

/** From https://github.com/danguer/blog-examples/blob/master/js/base64-binary.js

Decode a binary base64-encoded string into a Uint8Array.

References:
https://developer.mozilla.org/en/JavaScript_typed_arrays/ArrayBuffer
https://developer.mozilla.org/en/JavaScript_typed_arrays/Uint8Array

Copyright (c) 2011, Daniel Guerrero, BSD Licensed
*/
function base64_to_Uint8Array(input) {
  var byteLength = (input.length / 4) * 3;

  //get last chars to see if they are valid / significant
  var lkey1 = base64_chars.indexOf(input.charAt(input.length - 1));
  var lkey2 = base64_chars.indexOf(input.charAt(input.length - 2));

  if (lkey1 == 64) byteLength--; //padding chars, so skip
  if (lkey2 == 64) byteLength--; //padding chars, so skip

  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;

  var bytes = new Uint8Array(byteLength);

  for (var i = 0, j = 0; i < byteLength; i += 3) {
    //get the 3 octects in 4 ascii chars
    enc1 = base64_chars.indexOf(input.charAt(j++));
    enc2 = base64_chars.indexOf(input.charAt(j++));
    enc3 = base64_chars.indexOf(input.charAt(j++));
    enc4 = base64_chars.indexOf(input.charAt(j++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    bytes[i] = chr1;
    if (enc3 != 64) bytes[i+1] = chr2;
    if (enc4 != 64) bytes[i+2] = chr3;
  }

  return bytes;
}


/**
From https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
*/
function Uint8Array_to_string(aBytes) {
  var sView = "";

  for (var nPart, nLen = aBytes.length, nIdx = 0; nIdx < nLen; nIdx++) {
    nPart = aBytes[nIdx];
    sView += String.fromCharCode(
      nPart > 251 && nPart < 254 && nIdx + 5 < nLen ? /* six bytes */
        /* (nPart - 252 << 30) may be not so safe in ECMAScript! So...: */
        (nPart - 252) * 1073741824 + (aBytes[++nIdx] - 128 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 247 && nPart < 252 && nIdx + 4 < nLen ? /* five bytes */
        (nPart - 248 << 24) + (aBytes[++nIdx] - 128 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 239 && nPart < 248 && nIdx + 3 < nLen ? /* four bytes */
        (nPart - 240 << 18) + (aBytes[++nIdx] - 128 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 223 && nPart < 240 && nIdx + 2 < nLen ? /* three bytes */
        (nPart - 224 << 12) + (aBytes[++nIdx] - 128 << 6) + aBytes[++nIdx] - 128
      : nPart > 191 && nPart < 224 && nIdx + 1 < nLen ? /* two bytes */
        (nPart - 192 << 6) + aBytes[++nIdx] - 128
      : /* nPart < 127 ? */ /* one byte */
        nPart
    );
  }

  return sView;
}

/**
From https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding
*/
function string_to_Uint8Array(string) {
  var nChr, nStrLen = string.length, nArrLen = 0;

  /* mapping... */

  for (var nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
    nChr = string.charCodeAt(nMapIdx);
    nArrLen += nChr < 0x80 ? 1 : nChr < 0x800 ? 2 : nChr < 0x10000 ? 3 : nChr < 0x200000 ? 4 : nChr < 0x4000000 ? 5 : 6;
  }

  var aBytes = new Uint8Array(nArrLen);

  /* transcription... */

  for (var nIdx = 0, nChrIdx = 0; nIdx < nArrLen; nChrIdx++) {
    nChr = string.charCodeAt(nChrIdx);
    if (nChr < 128) {
      /* one byte */
      aBytes[nIdx++] = nChr;
    } else if (nChr < 0x800) {
      /* two bytes */
      aBytes[nIdx++] = 192 + (nChr >>> 6);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x10000) {
      /* three bytes */
      aBytes[nIdx++] = 224 + (nChr >>> 12);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x200000) {
      /* four bytes */
      aBytes[nIdx++] = 240 + (nChr >>> 18);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x4000000) {
      /* five bytes */
      aBytes[nIdx++] = 248 + (nChr >>> 24);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else /* if (nChr <= 0x7fffffff) */ {
      /* six bytes */
      aBytes[nIdx++] = 252 + (nChr >>> 30);
      aBytes[nIdx++] = 128 + (nChr >>> 24 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 18 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 12 & 63);
      aBytes[nIdx++] = 128 + (nChr >>> 6 & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    }
  }

  return aBytes;
}
