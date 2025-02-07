"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwingNodeModule = exports.type = void 0;
const node_1 = require("../node");
const constant_1 = require("./expression/constant");
const body_1 = require("./body");
const node_type_1 = require("../node-type");
exports.type = new node_type_1.TwingNodeType('module');
/**
 * Represents a module node that compiles into a JavaScript module.
 */
class TwingNodeModule extends node_1.TwingNode {
    constructor(body, parent, blocks, macros, traits, embeddedTemplates, source) {
        let nodes = new Map();
        nodes.set('body', body);
        nodes.set('blocks', blocks);
        nodes.set('macros', macros);
        nodes.set('traits', traits);
        nodes.set('display_start', new node_1.TwingNode());
        nodes.set('display_end', new node_1.TwingNode());
        nodes.set('constructor_start', new node_1.TwingNode());
        nodes.set('constructor_end', new node_1.TwingNode());
        nodes.set('class_end', new node_1.TwingNode());
        if (parent !== null) {
            nodes.set('parent', parent);
        }
        // embedded templates are set as attributes so that they are only visited once by the visitors
        let attributes = new Map();
        attributes.set('index', 0);
        attributes.set('embedded_templates', embeddedTemplates);
        super(nodes, attributes, 1, 1);
        this.source = source;
        // populate the template name of all node children
        this.setTemplateName(this.source.getName());
    }
    get type() {
        return exports.type;
    }
    setIndex(index) {
        this.setAttribute('index', index);
    }
    compile(compiler) {
        let index = this.getAttribute('index');
        if (index === 0) {
            compiler
                .write('module.exports = (TwingTemplate) => {\n')
                .indent()
                .write('return new Map([\n')
                .indent();
        }
        this.compileTemplate(compiler);
        for (let template of this.getAttribute('embedded_templates')) {
            compiler.subcompile(template);
        }
        if (index === 0) {
            compiler
                .outdent()
                .write(']);\n')
                .outdent()
                .write('};');
        }
    }
    compileTemplate(compiler) {
        this.compileClassHeader(compiler);
        this.compileConstructor(compiler);
        this.compileDoGetParent(compiler);
        this.compileDoGetTraits(compiler);
        this.compileDoDisplay(compiler);
        this.compileIsTraitable(compiler);
        this.compileClassfooter(compiler);
    }
    compileClassHeader(compiler) {
        let index = this.getAttribute('index');
        compiler
            .write(`[${index}, class extends TwingTemplate {\n`)
            .indent();
    }
    compileConstructor(compiler) {
        compiler
            .write('constructor(environment) {\n')
            .indent()
            .subcompile(this.getNode('constructor_start'))
            .write('super(environment);\n\n')
            .write('this._source = new this.Source(')
            .string(compiler.getEnvironment().isDebug() || compiler.getEnvironment().isSourceMap() ? this.source.getCode() : '')
            .raw(', ')
            .string(this.source.getResolvedName())
            .raw(");\n\n")
            .write('let aliases = new this.Context();\n');
        // block handlers
        let count = this.getNode('blocks').getNodes().size;
        if (count > 0) {
            compiler
                .write('\n')
                .write('this.blockHandlers = new Map([\n')
                .indent();
            for (let [name, node] of this.getNode('blocks').getNodes()) {
                count--;
                compiler.write(`['${name}', `)
                    .subcompile(node)
                    .raw(']');
                if (count > 0) {
                    compiler.raw(',');
                }
                compiler.raw('\n');
            }
            compiler
                .outdent()
                .write(']);\n');
        }
        // macro handlers
        count = this.getNode('macros').getNodes().size;
        if (count > 0) {
            compiler
                .write('\n')
                .write('this.macroHandlers = new Map([\n')
                .indent();
            for (let [name, node] of this.getNode('macros').getNodes()) {
                count--;
                compiler.write(`['${name}', `)
                    .subcompile(node)
                    .raw(']');
                if (count > 0) {
                    compiler.raw(',');
                }
                compiler.raw('\n');
            }
            compiler
                .outdent()
                .write(']);\n');
        }
        compiler
            .subcompile(this.getNode('constructor_end'))
            .outdent()
            .write('}\n\n');
    }
    compileDoGetTraits(compiler) {
        let count = this.getNode('traits').getNodes().size;
        if (count > 0) {
            compiler
                .write("async doGetTraits() {\n")
                .indent()
                .write('let traits = new Map();\n\n');
            for (let [i, trait] of this.getNode('traits').getNodes()) {
                let node = trait.getNode('template');
                compiler
                    .write(`let trait_${i} = await this.loadTemplate(`)
                    .subcompile(node)
                    .raw(', ')
                    .repr(node.getTemplateLine())
                    .raw(");\n\n");
                compiler
                    .write(`if (!trait_${i}.isTraitable) {\n`)
                    .indent()
                    .write('throw new this.RuntimeError(\'Template ')
                    .subcompile(trait.getNode('template'))
                    .raw(' cannot be used as a trait.\', ')
                    .repr(node.getTemplateLine())
                    .raw(", this.source);\n")
                    .outdent()
                    .write('}\n\n')
                    .write(`let traits_${i} = this.cloneMap(await trait_${i}.getBlocks());\n\n`);
                for (let [key, value] of trait.getNode('targets').getNodes()) {
                    compiler
                        .write(`if (!traits_${i}.has(`)
                        .string(key)
                        .raw(")) {\n")
                        .indent()
                        .write('throw new this.RuntimeError(\'Block ')
                        .string(key)
                        .raw(' is not defined in trait ')
                        .subcompile(trait.getNode('template'))
                        .raw('.\', ')
                        .repr(value.getTemplateLine())
                        .raw(', this.source);\n')
                        .outdent()
                        .write('}\n\n')
                        .write(`traits_${i}.set(`)
                        .subcompile(value)
                        .raw(`, traits_${i}.get(`)
                        .string(key)
                        .raw(`)); traits_${i}.delete(`)
                        .string(key)
                        .raw(');\n\n');
                }
            }
            for (let i = 0; i < count; ++i) {
                compiler.write(`traits = this.merge(traits, traits_${i});\n`);
            }
            compiler.write('\n');
            compiler
                .write('return Promise.resolve(traits);\n')
                .outdent()
                .write('}\n\n');
        }
    }
    compileDoGetParent(compiler) {
        if (this.hasNode('parent')) {
            let parent = this.getNode('parent');
            compiler
                .write("doGetParent(context) {\n")
                .indent()
                .write('return this.loadTemplate(')
                .subcompile(parent)
                .raw(', ')
                .repr(parent.getTemplateLine())
                .raw(")");
            // if the parent name is not dynamic, then we can cache the parent as it will never change
            if (parent.is(constant_1.type)) {
                compiler
                    .raw('.then((parent) => {\n')
                    .indent()
                    .write('this.parent = parent;\n\n')
                    .write('return parent;\n')
                    .outdent()
                    .write('})');
            }
            compiler
                .raw(';\n')
                .outdent()
                .write("}\n\n");
        }
    }
    compileDoDisplay(compiler) {
        compiler
            .write("async doDisplay(context, outputBuffer, blocks = new Map()) {\n")
            .indent()
            .write('let aliases = this.aliases.clone();\n\n')
            .addSourceMapEnter(this)
            .subcompile(this.getNode('display_start'))
            .subcompile(this.getNode('body'));
        if (this.hasNode('parent')) {
            compiler.write('await (await this.getParent(context)).display(context, this.merge(await this.getBlocks(), blocks), outputBuffer);\n');
        }
        compiler
            .subcompile(this.getNode('display_end'))
            .addSourceMapLeave()
            .outdent()
            .write("}\n\n");
    }
    compileIsTraitable(compiler) {
        // A template can be used as a trait if:
        //   * it has no parent
        //   * it has no macros
        //   * it has no body
        //
        // Put another way, a template can be used as a trait if it
        // only contains blocks and use statements.
        let traitable = !this.hasNode('parent') && (this.getNode('macros').getNodes().size === 0);
        if (traitable) {
            let node = this.getNode('body');
            if (node.is(body_1.type)) {
                node = node.getNode(0);
            }
            if (!node.getNodes().size) {
                let n = new Map();
                n.set(0, node);
                node = new node_1.TwingNode(n);
            }
            for (let [idx, subNode] of node.getNodes()) {
                if (!subNode.getNodes().size) {
                    continue;
                }
                traitable = false;
                break;
            }
        }
        if (traitable) {
            return;
        }
        compiler
            .write("get isTraitable() {\n")
            .indent()
            .write('return false;\n')
            .outdent()
            .write("}\n\n");
    }
    compileClassfooter(compiler) {
        compiler
            .subcompile(this.getNode('class_end'))
            .outdent()
            .write(`}],\n`);
    }
}
exports.TwingNodeModule = TwingNodeModule;
