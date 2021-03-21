import { TwingNodeExpressionBinary } from "../binary";
import { TwingCompiler } from "../../../compiler";
import { TwingNodeType } from "../../../node-type";
export declare const type: TwingNodeType;
export declare class TwingNodeExpressionBinaryDiv extends TwingNodeExpressionBinary {
    operator(compiler: TwingCompiler): TwingCompiler;
    get type(): TwingNodeType;
}
