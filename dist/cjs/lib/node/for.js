"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwingNodeFor = exports.type = void 0;
const node_1 = require("../node");
const for_loop_1 = require("./for-loop");
const if_1 = require("./if");
const node_type_1 = require("../node-type");
exports.type = new node_type_1.TwingNodeType('for');
class TwingNodeFor extends node_1.TwingNode {
    constructor(keyTarget, valueTarget, seq, ifexpr, body, elseNode, lineno, columnno, tag = null) {
        let loop = new for_loop_1.TwingNodeForLoop(lineno, columnno, tag);
        let bodyNodes = new Map();
        let i = 0;
        bodyNodes.set(i++, body);
        bodyNodes.set(i++, loop);
        body = new node_1.TwingNode(bodyNodes);
        if (ifexpr) {
            let ifNodes = new Map();
            let i = 0;
            ifNodes.set(i++, ifexpr);
            ifNodes.set(i++, body);
            body = new if_1.TwingNodeIf(new node_1.TwingNode(ifNodes), null, lineno, columnno, tag);
        }
        let nodes = new Map();
        nodes.set('key_target', keyTarget);
        nodes.set('value_target', valueTarget);
        nodes.set('seq', seq);
        nodes.set('body', body);
        if (elseNode) {
            nodes.set('else', elseNode);
        }
        let attributes = new Map();
        attributes.set('with_loop', true);
        attributes.set('ifexpr', ifexpr !== null);
        super(nodes, attributes, lineno, columnno, tag);
        this.loop = loop;
    }
    get type() {
        return exports.type;
    }
    compile(compiler) {
        compiler
            .write("context.set('_parent', context.clone());\n\n")
            .write('await (async () => {\n')
            .indent()
            .write('let c = this.ensureTraversable(')
            .subcompile(this.getNode('seq'))
            .raw(");\n\n")
            .write('if (c === context) {\n')
            .indent()
            .write("context.set('_seq', context.clone());\n")
            .outdent()
            .write("}\n")
            .write("else {\n")
            .indent()
            .write("context.set('_seq', c);\n")
            .outdent()
            .write("}\n")
            .outdent()
            .write("})();\n\n");
        if (this.hasNode('else')) {
            compiler.write("context.set('_iterated', false);\n");
        }
        if (this.getAttribute('with_loop')) {
            compiler
                .write("context.set('loop', new Map([\n")
                .write("  ['parent', context.get('_parent')],\n")
                .write("  ['index0', 0],\n")
                .write("  ['index', 1],\n")
                .write("  ['first', true]\n")
                .write("]));\n");
            if (!this.getAttribute('ifexpr')) {
                compiler
                    .write("if ((typeof context.get('_seq') === 'object') && this.isCountable(context.get('_seq'))) {\n")
                    .indent()
                    .write("let length = this.count(context.get('_seq'));\n")
                    .write("let loop = context.get('loop');\n")
                    .write("loop.set('revindex0', length - 1);\n")
                    .write("loop.set('revindex', length);\n")
                    .write("loop.set('length', length);\n")
                    .write("loop.set('last', (length === 1));\n")
                    .outdent()
                    .write("}\n");
            }
        }
        this.loop.setAttribute('else', this.hasNode('else'));
        this.loop.setAttribute('with_loop', this.getAttribute('with_loop'));
        this.loop.setAttribute('ifexpr', this.getAttribute('ifexpr'));
        compiler
            .write("await this.iterate(context.get('_seq'), async (__key__, __value__) => {\n")
            .indent()
            .subcompile(this.getNode('key_target'), false)
            .raw(' = __key__;\n')
            .subcompile(this.getNode('value_target'), false)
            .raw(' = __value__;\n')
            .subcompile(this.getNode('body'))
            .outdent()
            .write("});\n");
        if (this.hasNode('else')) {
            compiler
                .write("if (context.get('_iterated') === false) {\n")
                .indent()
                .subcompile(this.getNode('else'))
                .outdent()
                .write("}\n");
        }
        compiler
            .write("(() => {\n")
            .indent()
            .write(`let parent = context.get('_parent');\n`);
        // remove some "private" loop variables (needed for nested loops)
        compiler
            .write('context.delete(\'_seq\');\n')
            .write('context.delete(\'_iterated\');\n')
            .write('context.delete(\'' + this.getNode('key_target').getAttribute('name') + '\');\n')
            .write('context.delete(\'' + this.getNode('value_target').getAttribute('name') + '\');\n')
            .write('context.delete(\'_parent\');\n')
            .write('context.delete(\'loop\');\n');
        // keep the values set in the inner context for variables defined in the outer context
        compiler
            .write(`for (let [k, v] of parent) {\n`)
            .indent()
            .write('if (!context.has(k)) {\n')
            .indent()
            .write(`context.set(k, v);\n`)
            .outdent()
            .write('}\n')
            .outdent()
            .write('}\n');
        compiler
            .outdent()
            .write("})();\n");
    }
}
exports.TwingNodeFor = TwingNodeFor;
