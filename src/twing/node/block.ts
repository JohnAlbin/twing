import {TwingNode, TwingNodeType} from "../node";
import {TwingMap} from "../map";
import {TwingCompiler} from "../compiler";

export class TwingNodeBlock extends TwingNode {
    constructor(name: string, body: TwingNode, lineno: number, tag: string = null) {
        super(new TwingMap([['body', body]]), new TwingMap([['name', name]]), lineno, tag);

        this.type = TwingNodeType.BLOCK;
    }

    compile(compiler: TwingCompiler) {
        compiler
            .addDebugInfo(this)
            .write(`block_${this.getAttribute('name')}(context, blocks = new Twing.TwingMap()) {\n`)
            .indent()
        ;

        compiler
            .subcompile(this.getNode('body'))
            .outdent()
            .write("}\n\n")
        ;
    }
}
