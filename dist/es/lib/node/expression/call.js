import { TwingNodeExpression } from "../expression";
import { TwingNode } from "../../node";
import { TwingErrorSyntax } from "../../error/syntax";
import { TwingNodeExpressionConstant } from "./constant";
import { TwingNodeExpressionArray } from "./array";
import { TwingNodeType } from "../../node-type";
const array_merge = require('locutus/php/array/array_merge');
const snakeCase = require('snake-case');
const capitalize = require('capitalize');
export const type = new TwingNodeType('expression_call');
export class TwingNodeExpressionCall extends TwingNodeExpression {
    get type() {
        return type;
    }
    compileCallable(compiler) {
        let callable = this.getAttribute('callable');
        if (typeof callable === 'string') {
            compiler.raw(callable);
        }
        else {
            compiler.raw(`await this.environment.get${capitalize(this.getAttribute('type'))}('${this.getAttribute('name')}').traceableCallable(${this.getTemplateLine()}, this.source)`);
        }
        compiler.raw('(...[');
        this.compileArguments(compiler);
        compiler.raw('])');
    }
    compileArguments(compiler) {
        let first = true;
        if (this.hasAttribute('needs_template') && this.getAttribute('needs_template')) {
            compiler.raw('this');
            first = false;
        }
        if (this.hasAttribute('needs_context') && this.getAttribute('needs_context')) {
            if (!first) {
                compiler.raw(', ');
            }
            compiler.raw('context');
            first = false;
        }
        if (this.hasAttribute('needs_output_buffer') && this.getAttribute('needs_output_buffer')) {
            if (!first) {
                compiler.raw(', ');
            }
            compiler.raw('outputBuffer');
            first = false;
        }
        if (this.hasAttribute('arguments')) {
            for (let argument_ of this.getAttribute('arguments')) {
                if (!first) {
                    compiler.raw(', ');
                }
                compiler.string(argument_);
                first = false;
            }
        }
        if (this.hasNode('node')) {
            if (!first) {
                compiler.raw(', ');
            }
            compiler.subcompile(this.getNode('node'));
            first = false;
        }
        if (this.hasNode('arguments')) {
            let callable = this.getAttribute('callable');
            let arguments_ = this.getArguments(callable, this.getNode('arguments'));
            for (let node of arguments_) {
                if (!first) {
                    compiler.raw(', ');
                }
                compiler.subcompile(node);
                first = false;
            }
        }
    }
    getArguments(callable, argumentsNode) {
        let callType = this.getAttribute('type');
        let callName = this.getAttribute('name');
        let parameters = new Map();
        let named = false;
        for (let [name, node] of argumentsNode.getNodes()) {
            if (typeof name !== 'number') {
                named = true;
                name = this.normalizeName(name);
            }
            else if (named) {
                throw new TwingErrorSyntax(`Positional arguments cannot be used after named arguments for ${callType} "${callName}".`, this.getTemplateLine());
            }
            parameters.set(name, node);
        }
        let isVariadic = this.hasAttribute('is_variadic') && this.getAttribute('is_variadic');
        if (!named && !isVariadic) {
            return [...parameters.values()];
        }
        let message;
        if (!callable) {
            if (named) {
                message = `Named arguments are not supported for ${callType} "${callName}".`;
            }
            else {
                message = `Arbitrary positional arguments are not supported for ${callType} "${callName}".`;
            }
            throw new Error(message);
        }
        let callableParameters = this.hasAttribute('accepted_arguments') ? this.getAttribute('accepted_arguments') : [];
        let arguments_ = [];
        let names = [];
        let optionalArguments = [];
        let pos = 0;
        for (let callableParameter of callableParameters) {
            let name = '' + this.normalizeName(callableParameter.name);
            names.push(name);
            if (parameters.has(name)) {
                if (parameters.has(pos)) {
                    throw new TwingErrorSyntax(`Argument "${name}" is defined twice for ${callType} "${callName}".`, this.getTemplateLine());
                }
                arguments_ = array_merge(arguments_, optionalArguments);
                arguments_.push(parameters.get(name));
                parameters.delete(name);
                optionalArguments = [];
            }
            else if (parameters.has(pos)) {
                arguments_ = array_merge(arguments_, optionalArguments);
                arguments_.push(parameters.get(pos));
                parameters.delete(pos);
                optionalArguments = [];
                ++pos;
            }
            else if (callableParameter.defaultValue !== undefined) {
                optionalArguments.push(new TwingNodeExpressionConstant(callableParameter.defaultValue, -1, -1));
            }
            else {
                throw new TwingErrorSyntax(`Value for argument "${name}" is required for ${callType} "${callName}".`, this.getTemplateLine());
            }
        }
        if (isVariadic) {
            let arbitraryArguments = new TwingNodeExpressionArray(new Map(), -1, -1);
            let resolvedKeys = [];
            for (let [key, value] of parameters) {
                if (Number.isInteger(key)) {
                    arbitraryArguments.addElement(value);
                }
                else {
                    arbitraryArguments.addElement(value, new TwingNodeExpressionConstant(key, -1, -1));
                }
                resolvedKeys.push(key);
            }
            for (let key of resolvedKeys) {
                parameters.delete(key);
            }
            if (arbitraryArguments.count()) {
                arguments_ = array_merge(arguments_, optionalArguments);
                arguments_.push(arbitraryArguments);
            }
        }
        if (parameters.size > 0) {
            let unknownParameter = [...parameters.values()].find(function (parameter) {
                // todo: what other type of data can parameter be?
                return parameter instanceof TwingNode;
            });
            throw new TwingErrorSyntax(`Unknown argument${parameters.size > 1 ? 's' : ''} "${[...parameters.keys()].join('", "')}" for ${callType} "${callName}(${names.join(', ')})".`, unknownParameter ? unknownParameter.getTemplateLine() : this.getTemplateLine());
        }
        return arguments_;
    }
    normalizeName(name) {
        return snakeCase(name).toLowerCase();
    }
}
