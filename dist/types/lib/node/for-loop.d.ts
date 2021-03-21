import { TwingNode } from "../node";
import { TwingCompiler } from "../compiler";
import { TwingNodeType } from "../node-type";
export declare const type: TwingNodeType;
export declare class TwingNodeForLoop extends TwingNode {
    constructor(lineno: number, columnno: number, tag?: string);
    get type(): TwingNodeType;
    compile(compiler: TwingCompiler): void;
}
