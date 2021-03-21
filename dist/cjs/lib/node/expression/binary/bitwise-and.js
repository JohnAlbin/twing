"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwingNodeExpressionBinaryBitwiseAnd = exports.type = void 0;
const binary_1 = require("../binary");
const node_type_1 = require("../../../node-type");
exports.type = new node_type_1.TwingNodeType('expression_binary_bitwise_and');
class TwingNodeExpressionBinaryBitwiseAnd extends binary_1.TwingNodeExpressionBinary {
    get type() {
        return exports.type;
    }
    operator(compiler) {
        return compiler.raw('&');
    }
}
exports.TwingNodeExpressionBinaryBitwiseAnd = TwingNodeExpressionBinaryBitwiseAnd;
