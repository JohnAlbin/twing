"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escape = void 0;
const markup_1 = require("../../../markup");
const runtime_1 = require("../../../error/runtime");
const bin2hex = require('locutus/php/strings/bin2hex');
const strlen = require('utf8-binary-cutter').getBinarySize;
const ltrim = require('locutus/php/strings/ltrim');
const locutusOrd = require('locutus/php/strings/ord');
const htmlspecialchars = require('htmlspecialchars');
const rawurlencode = require('locutus/php/url/rawurlencode');
const sprintf = require('locutus/php/strings/sprintf');
const array_merge = require('locutus/php/array/array_merge');
/**
 * Escapes a string.
 *
 * @param {TwingTemplate} template
 * @param {*} string The value to be escaped
 * @param {string} strategy The escaping strategy
 * @param {string} charset The charset
 * @param {boolean} autoescape Whether the function is called by the auto-escaping feature (true) or by the developer (false)
 *
 * @returns {Promise<string>}
 */
function escape(template, string, strategy = 'html', charset = null, autoescape = false) {
    let _do = () => {
        let env = template.environment;
        if (autoescape && string && string instanceof markup_1.TwingMarkup) {
            return string;
        }
        if (typeof string !== 'string') {
            if (string && (typeof string === 'object') && Reflect.has(string, 'toString')) {
                string = '' + string;
            }
            else if (['html', 'js', 'css', 'html_attr', 'url'].includes(strategy)) {
                return string;
            }
        }
        if (string === '') {
            return '';
        }
        if (charset === null) {
            charset = env.getCharset();
        }
        switch (strategy) {
            case 'html':
                return htmlspecialchars(string);
            case 'js':
                // escape all non-alphanumeric characters
                // into their \x or \uHHHH representations
                string = string.replace(/[^a-zA-Z0-9,._]/ug, function (matches) {
                    let char = matches;
                    /**
                     * A few characters have short escape sequences in JSON and JavaScript.
                     * Escape sequences supported only by JavaScript, not JSON, are ommitted.
                     * \" is also supported but omitted, because the resulting string is not HTML safe.
                     */
                    let shortMap = new Map([
                        ['\\', '\\\\'],
                        ['/', '\\/'],
                        ["\x08", '\\b'],
                        ["\x0C", '\\f'],
                        ["\x0A", '\\n'],
                        ["\x0D", '\\r'],
                        ["\x09", '\\t'],
                    ]);
                    if (shortMap.has(char)) {
                        return shortMap.get(char);
                    }
                    // \uHHHH
                    char = bin2hex(char).toUpperCase();
                    if (strlen(char) <= 4) {
                        return sprintf('\\u%04s', char);
                    }
                    return sprintf('\\u%04s\\u%04s', char.substr(0, 4), char.substr(4, 4));
                });
                return string;
            case 'css':
                string = string.replace(/[^a-zA-Z0-9]/ug, function (matches) {
                    let char = matches;
                    // \xHH
                    if (strlen(char) === 1) {
                        let hex = ltrim(bin2hex(char).toUpperCase(), '0');
                        if (strlen(hex) === 0) {
                            hex = '0';
                        }
                        return '\\' + hex + ' ';
                    }
                    // \uHHHH
                    return '\\' + ltrim(bin2hex(char).toUpperCase(), '0') + ' ';
                });
                return string;
            case 'html_attr':
                string = string.replace(/[^a-zA-Z0-9,.\-_]/ug, function (matches) {
                    /**
                     * This function is adapted from code coming from Zend Framework.
                     *
                     * @copyright Copyright (c) 2005-2012 Zend Technologies USA Inc. (http://www.zend.com)
                     * @license   http://framework.zend.com/license/new-bsd New BSD License
                     */
                    /*
                     * While HTML supports far more named entities, the lowest common denominator
                     * has become HTML5's XML Serialisation which is restricted to the those named
                     * entities that XML supports. Using HTML entities would result in this error:
                     *     XML Parsing Error: undefined entity
                     */
                    let entityMap = new Map([
                        [34, 'quot'],
                        [38, 'amp'],
                        [60, 'lt'],
                        [62, 'gt'] /* greater-than sign */
                    ]);
                    let chr = matches;
                    let ord = locutusOrd(chr);
                    /*
                     * The following replaces characters undefined in HTML with the
                     * hex entity for the Unicode replacement character.
                     */
                    if ((ord <= 0x1f && chr != "\t" && chr != "\n" && chr != "\r") || (ord >= 0x7f && ord <= 0x9f)) {
                        return '&#xFFFD;';
                    }
                    /*
                     * Check if the current character to escape has a name entity we should
                     * replace it with while grabbing the hex value of the character.
                     */
                    let int = chr.codePointAt(0);
                    if (entityMap.has(int)) {
                        return `&${entityMap.get(int)};`;
                    }
                    let hex = int.toString(16).toUpperCase();
                    if (hex.length === 1 || hex.length === 3) {
                        hex = '0' + hex;
                    }
                    /*
                     * Per OWASP recommendations, we'll use hex entities for any other
                     * characters where a named entity does not exist.
                     */
                    return `&#x${hex};`;
                });
                return string;
            case 'url':
                return rawurlencode(string);
            default:
                let coreExtension = env.getCoreExtension();
                let escapers = coreExtension.getEscapers();
                if (escapers.has(strategy)) {
                    return escapers.get(strategy)(env, string, charset);
                }
                let validStrategies = array_merge(['html', 'js', 'url', 'css', 'html_attr'], [...escapers.keys()]);
                throw new runtime_1.TwingErrorRuntime(`Invalid escaping strategy "${strategy}" (valid ones: ${validStrategies.join(', ')}).`);
        }
    };
    return Promise.resolve(_do());
}
exports.escape = escape;
