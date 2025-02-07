"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateFromString = void 0;
/**
 * Loads a template from a string.
 *
 * <pre>
 * {{ include(template_from_string("Hello {{ name }}")) }}
 * </pre>
 *
 * @param {TwingTemplate} template A TwingTemplate instance
 * @param {string} string A template as a string or object implementing toString()
 * @param {string} name An optional name for the template to be used in error messages
 *
 * @returns {Promise<TwingTemplate>}
 */
function templateFromString(template, string, name = null) {
    return template.environment.createTemplate(string, name);
}
exports.templateFromString = templateFromString;
