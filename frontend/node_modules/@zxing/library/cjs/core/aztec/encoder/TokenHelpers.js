"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addBinaryShift = addBinaryShift;
exports.add = add;
var SimpleToken_1 = __importDefault(require("./SimpleToken"));
var BinaryShiftToken_1 = __importDefault(require("./BinaryShiftToken"));
function addBinaryShift(token, start, byteCount) {
    // int bitCount = (byteCount * 8) + (byteCount <= 31 ? 10 : byteCount <= 62 ? 20 : 21);
    return new BinaryShiftToken_1.default(token, start, byteCount);
}
function add(token, value, bitCount) {
    return new SimpleToken_1.default(token, value, bitCount);
}
