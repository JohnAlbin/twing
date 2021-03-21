import { TwingNodeExpressionBinary } from "../binary";
import { TwingCompiler } from "../../../compiler";
import { TwingNodeType } from "../../../node-type";
export declare const type: TwingNodeType;
export declare class TwingNodeExpressionBinaryLessEqual extends TwingNodeExpressionBinary {
    get type(): TwingNodeType;
    operator(compiler: TwingCompiler): TwingCompiler;
}
