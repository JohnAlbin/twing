"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwingNodeMacro = exports.type = void 0;
/**
 * Represents a macro node.
 *
 * @author Eric MORAND <eric.morand@gmail.com>
 */
const node_1 = require("../node");
const syntax_1 = require("../error/syntax");
const node_type_1 = require("../node-type");
exports.type = new node_type_1.TwingNodeType('macro');
class TwingNodeMacro extends node_1.TwingNode {
    constructor(name, body, macroArguments, lineno, columnno, tag = null) {
        for (let [argumentName, macroArgument] of macroArguments.getNodes()) {
            if (argumentName === TwingNodeMacro.VARARGS_NAME) {
                throw new syntax_1.TwingErrorSyntax(`The argument "${TwingNodeMacro.VARARGS_NAME}" in macro "${name}" cannot be defined because the variable "${TwingNodeMacro.VARARGS_NAME}" is reserved for arbitrary arguments.`, macroArgument.getTemplateLine());
            }
        }
        let nodes = new Map();
        nodes.set('body', body);
        nodes.set('arguments', macroArguments);
        super(nodes, new Map([['name', name]]), lineno, columnno, tag);
    }
    get type() {
        return exports.type;
    }
    compile(compiler) {
        compiler
            .raw(`async (`)
            .raw('outputBuffer, ');
        let count = this.getNode('arguments').getNodes().size;
        let pos = 0;
        for (let [name, defaultValue] of this.getNode('arguments').getNodes()) {
            compiler
                .raw('__' + name + '__ = ')
                .subcompile(defaultValue);
            if (++pos < count) {
                compiler.raw(', ');
            }
        }
        if (count) {
            compiler.raw(', ');
        }
        compiler
            .raw('...__varargs__')
            .raw(") => {\n")
            .indent()
            .write('let aliases = this.aliases.clone();\n')
            .write("let context = new this.Context(this.environment.mergeGlobals(new Map([\n")
            .indent();
        let first = true;
        for (let [name, default_] of this.getNode('arguments').getNodes()) {
            if (!first) {
                compiler.raw(',\n');
            }
            first = false;
            compiler
                .write('[')
                .string(name)
                .raw(', __' + name + '__]');
        }
        if (!first) {
            compiler.raw(',\n');
        }
        compiler
            .write('[')
            .string(TwingNodeMacro.VARARGS_NAME)
            .raw(', ');
        compiler
            .raw("\__varargs__]\n")
            .outdent()
            .write("])));\n\n")
            .write("let blocks = new Map();\n")
            .write('let result;\n')
            .write('let error;\n\n')
            .write("outputBuffer.start();\n")
            .write("try {\n")
            .indent()
            .subcompile(this.getNode('body'))
            .raw("\n")
            .write('let tmp = outputBuffer.getContents();\n')
            .write("result = (tmp === '') ? '' : new this.Markup(tmp, this.environment.getCharset());\n")
            .outdent()
            .write("}\n")
            .write('catch (e) {\n')
            .indent()
            .write('error = e;\n')
            .outdent()
            .write('}\n\n')
            .write("outputBuffer.endAndClean();\n\n")
            .write('if (error) {\n')
            .indent()
            .write('throw error;\n')
            .outdent()
            .write('}\n')
            .write('return result;\n')
            .outdent()
            .write("}");
    }
}
exports.TwingNodeMacro = TwingNodeMacro;
TwingNodeMacro.VARARGS_NAME = 'varargs';
