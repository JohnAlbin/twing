import { TwingBaseNodeVisitor } from "../base-node-visitor";
import { TwingNode } from "../node";
import { TwingNodeCheckSecurity } from "../node/check-security";
import { TwingNodeCheckToString } from "../node/check-to-string";
import { type as moduleType } from "../node/module";
import { type as nameType } from "../node/expression/name";
import { type as filterType } from "../node/expression/filter";
import { type as functionType } from "../node/expression/function";
import { type as rangeType } from "../node/expression/binary/range";
import { type as concatType } from "../node/expression/binary/concat";
import { type as getAttrType } from "../node/expression/get-attribute";
import { type as setType } from "../node/set";
import { type as printType } from "../node/print";
export class TwingNodeVisitorSandbox extends TwingBaseNodeVisitor {
    constructor() {
        super();
        this.TwingNodeVisitorInterfaceImpl = this;
    }
    doEnterNode(node, env) {
        if (!env.isSandboxed()) {
            return node;
        }
        if (node.is(moduleType)) {
            this.tags = new Map();
            this.filters = new Map();
            this.functions = new Map();
            return node;
        }
        else {
            // look for tags
            if (node.getNodeTag() && !(this.tags.has(node.getNodeTag()))) {
                this.tags.set(node.getNodeTag(), node);
            }
            // look for filters
            if (node.is(filterType) && !this.filters.has(node.getNode('filter').getAttribute('value'))) {
                this.filters.set(node.getNode('filter').getAttribute('value'), node);
            }
            // look for functions
            if (node.is(functionType) && !this.functions.has(node.getAttribute('name'))) {
                this.functions.set(node.getAttribute('name'), node);
            }
            // the .. operator is equivalent to the range() function
            if (node.is(rangeType) && !(this.functions.has('range'))) {
                this.functions.set('range', node);
            }
            // wrap print to check toString() calls
            if (node.is(printType)) {
                this.needsToStringWrap = true;
                this.wrapNode(node, 'expr');
            }
            if (node.is(setType) && !node.getAttribute('capture')) {
                this.needsToStringWrap = true;
            }
            // wrap outer nodes that can implicitly call toString()
            if (this.needsToStringWrap) {
                if (node.is(concatType)) {
                    this.wrapNode(node, 'left');
                    this.wrapNode(node, 'right');
                }
                if (node.is(filterType)) {
                    this.wrapNode(node, 'node');
                    this.wrapArrayNode(node, 'arguments');
                }
                if (node.is(functionType)) {
                    this.wrapArrayNode(node, 'arguments');
                }
            }
        }
        return node;
    }
    doLeaveNode(node, env) {
        if (!env.isSandboxed()) {
            return node;
        }
        if (node.is(moduleType)) {
            let nodes = new Map();
            let i = 0;
            nodes.set(i++, new TwingNodeCheckSecurity(this.filters, this.tags, this.functions));
            nodes.set(i++, node.getNode('display_start'));
            node.getNode('constructor_end').setNode('_security_check', new TwingNode(nodes));
        }
        else {
            if (node.is(printType) || node.is(setType)) {
                this.needsToStringWrap = false;
            }
        }
        return node;
    }
    wrapNode(node, name) {
        let expr = node.getNode(name);
        if (expr.is(nameType) || expr.is(getAttrType)) {
            node.setNode(name, new TwingNodeCheckToString(expr));
        }
    }
    wrapArrayNode(node, name) {
        let args = node.getNode(name);
        for (let [name] of args.getNodes()) {
            this.wrapNode(args, name);
        }
    }
    getPriority() {
        return 0;
    }
}
