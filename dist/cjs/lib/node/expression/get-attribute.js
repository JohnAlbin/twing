"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwingNodeExpressionGetAttribute = exports.type = void 0;
const expression_1 = require("../expression");
const template_1 = require("../../template");
const node_type_1 = require("../../node-type");
exports.type = new node_type_1.TwingNodeType('expression_get_attribute');
class TwingNodeExpressionGetAttribute extends expression_1.TwingNodeExpression {
    constructor(node, attribute, methodArguments, type, lineno, columnno) {
        let nodes = new Map();
        nodes.set('node', node);
        nodes.set('attribute', attribute);
        if (methodArguments) {
            nodes.set('arguments', methodArguments);
        }
        let nodeAttributes = new Map();
        nodeAttributes.set('type', type);
        nodeAttributes.set('is_defined_test', false);
        nodeAttributes.set('ignore_strict_check', false);
        nodeAttributes.set('optimizable', true);
        super(nodes, nodeAttributes, lineno, columnno);
    }
    get type() {
        return exports.type;
    }
    compile(compiler) {
        let env = compiler.getEnvironment();
        // optimize array, hash and Map calls
        if (this.getAttribute('optimizable')
            && (!env.isStrictVariables() || this.getAttribute('ignore_strict_check'))
            && !this.getAttribute('is_defined_test')
            && this.getAttribute('type') === template_1.TwingTemplate.ARRAY_CALL) {
            compiler
                .raw('await (async () => {let object = ')
                .subcompile(this.getNode('node'))
                .raw('; return this.get(object, ')
                .subcompile(this.getNode('attribute'))
                .raw(');})()');
            return;
        }
        compiler.raw(`await this.traceableMethod(this.getAttribute, ${this.getTemplateLine()}, this.source)(this.environment, `);
        if (this.getAttribute('ignore_strict_check')) {
            this.getNode('node').setAttribute('ignore_strict_check', true);
        }
        compiler.subcompile(this.getNode('node'));
        compiler.raw(', ').subcompile(this.getNode('attribute'));
        if (this.hasNode('arguments')) {
            compiler.raw(', ').subcompile(this.getNode('arguments'));
        }
        else {
            compiler.raw(', new Map()');
        }
        compiler
            .raw(', ').repr(this.getAttribute('type'))
            .raw(', ').repr(this.getAttribute('is_defined_test'))
            .raw(', ').repr(this.getAttribute('ignore_strict_check'))
            .raw(', ').repr(env.isSandboxed())
            .raw(')');
    }
}
exports.TwingNodeExpressionGetAttribute = TwingNodeExpressionGetAttribute;
