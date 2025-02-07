import { TwingNodeExpression } from "../expression";
import { TwingNodeType } from "../../node-type";
export const type = new TwingNodeType('expression_name');
export class TwingNodeExpressionName extends TwingNodeExpression {
    constructor(name, lineno, columnno) {
        let attributes = new Map();
        attributes.set('name', name);
        attributes.set('is_defined_test', false);
        attributes.set('ignore_strict_check', false);
        attributes.set('always_defined', false);
        super(new Map(), attributes, lineno, columnno);
        this.specialVars = new Map([
            ['_self', 'this.templateName'],
            ['_context', 'context'],
            ['_charset', 'this.environment.getCharset()']
        ]);
    }
    get type() {
        return type;
    }
    compile(compiler) {
        let name = this.getAttribute('name');
        if (this.getAttribute('is_defined_test')) {
            if (this.isSpecial()) {
                compiler.repr(true);
            }
            else {
                compiler.raw('(context.has(').repr(name).raw('))');
            }
        }
        else if (this.isSpecial()) {
            compiler.raw(this.specialVars.get(name));
        }
        else if (this.getAttribute('always_defined')) {
            compiler
                .raw('context.get(')
                .string(name)
                .raw(')');
        }
        else {
            if (this.getAttribute('ignore_strict_check') || !compiler.getEnvironment().isStrictVariables()) {
                compiler
                    .raw('(context.has(')
                    .string(name)
                    .raw(') ? context.get(')
                    .string(name)
                    .raw(') : null)');
            }
            else {
                compiler
                    .raw('(context.has(')
                    .string(name)
                    .raw(') ? context.get(')
                    .string(name)
                    .raw(') : (() => { throw new this.RuntimeError(\'Variable ')
                    .string(name)
                    .raw(' does not exist.\', ')
                    .repr(this.lineno)
                    .raw(', this.source); })()')
                    .raw(')');
            }
        }
    }
    isSpecial() {
        return this.specialVars.has(this.getAttribute('name'));
    }
    isSimple() {
        return !this.isSpecial() && !this.getAttribute('is_defined_test');
    }
}
