"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slice = void 0;
const util_1 = require("util");
function slice(map, start, length, preserveKeys) {
    let result = new Map();
    let index = 0;
    let keyIndex = 0;
    if (start < 0) {
        start = map.size + start;
    }
    for (let [key, value] of map) {
        if ((index >= start) && (index < start + length)) {
            let newKey;
            // Note that array_slice() will reorder and reset the ***numeric*** array indices by default. [...]
            // see http://php.net/manual/en/function.array-slice.php
            if (util_1.isNumber(key)) {
                newKey = preserveKeys ? key : keyIndex;
                keyIndex++;
            }
            else {
                newKey = key;
            }
            result.set(newKey, value);
        }
        if (index >= start + length) {
            break;
        }
        index++;
    }
    return result;
}
exports.slice = slice;
