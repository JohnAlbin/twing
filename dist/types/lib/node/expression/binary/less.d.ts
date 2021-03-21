import { TwingNodeExpressionBinary } from "../binary";
import { TwingCompiler } from "../../../compiler";
import { TwingNodeType } from "../../../node-type";
export declare const type: TwingNodeType;
export declare class TwingNodeExpressionBinaryLess extends TwingNodeExpressionBinary {
    get type(): TwingNodeType;
    operator(compiler: TwingCompiler): TwingCompiler;
}
