"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var AI013x0xDecoder_1 = __importDefault(require("./AI013x0xDecoder"));
var AI013103decoder = /** @class */ (function (_super) {
    __extends(AI013103decoder, _super);
    function AI013103decoder(information) {
        return _super.call(this, information) || this;
    }
    AI013103decoder.prototype.addWeightCode = function (buf, weight) {
        buf.append('(3103)');
    };
    AI013103decoder.prototype.checkWeight = function (weight) {
        return weight;
    };
    return AI013103decoder;
}(AI013x0xDecoder_1.default));
exports.default = AI013103decoder;
