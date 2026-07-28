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
var AI01decoder_1 = __importDefault(require("./AI01decoder"));
var AI01weightDecoder = /** @class */ (function (_super) {
    __extends(AI01weightDecoder, _super);
    function AI01weightDecoder(information) {
        return _super.call(this, information) || this;
    }
    AI01weightDecoder.prototype.encodeCompressedWeight = function (buf, currentPos, weightSize) {
        var originalWeightNumeric = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos, weightSize);
        this.addWeightCode(buf, originalWeightNumeric);
        var weightNumeric /* int */ = this.checkWeight(originalWeightNumeric);
        var currentDivisor = 100000;
        // Pad with leading zeroes.
        for (var i = 0; i < 5; ++i) {
            if (weightNumeric < currentDivisor) {
                buf.append('0');
            }
            currentDivisor = Math.trunc(currentDivisor / 10);
        }
        buf.append('' + weightNumeric);
    };
    return AI01weightDecoder;
}(AI01decoder_1.default));
exports.default = AI01weightDecoder;
