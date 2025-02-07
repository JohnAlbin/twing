"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.iconv = void 0;
const { decode, encode } = require('iconv-lite');
/**
 * Internationalization conversion: convert buffer to requested character encoding
 *
 * @param {string} inCharset The input charset.
 * @param {string} outCharset The output charset.
 * @param {Buffer} buffer The buffer to be converted.
 *
 * @returns {Buffer} the converted buffer or false on failure.
 */
function iconv(inCharset, outCharset, buffer) {
    let str = decode(buffer, inCharset);
    buffer = encode(str, outCharset);
    return buffer;
}
exports.iconv = iconv;
