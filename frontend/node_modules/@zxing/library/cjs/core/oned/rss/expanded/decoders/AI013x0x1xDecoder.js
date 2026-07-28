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
var AI01weightDecoder_1 = __importDefault(require("./AI01weightDecoder"));
var NotFoundException_1 = __importDefault(require("../../../../NotFoundException"));
var StringBuilder_1 = __importDefault(require("../../../../util/StringBuilder"));
var AI013x0x1xDecoder = /** @class */ (function (_super) {
    __extends(AI013x0x1xDecoder, _super);
    function AI013x0x1xDecoder(information, firstAIdigits, dateCode) {
        var _this = _super.call(this, information) || this;
        _this.dateCode = dateCode;
        _this.firstAIdigits = firstAIdigits;
        return _this;
    }
    AI013x0x1xDecoder.prototype.parseInformation = function () {
        if (this.getInformation().getSize() !==
            AI013x0x1xDecoder.HEADER_SIZE +
                AI013x0x1xDecoder.GTIN_SIZE +
                AI013x0x1xDecoder.WEIGHT_SIZE +
                AI013x0x1xDecoder.DATE_SIZE) {
            throw new NotFoundException_1.default();
        }
        var buf = new StringBuilder_1.default();
        this.encodeCompressedGtin(buf, AI013x0x1xDecoder.HEADER_SIZE);
        this.encodeCompressedWeight(buf, AI013x0x1xDecoder.HEADER_SIZE + AI013x0x1xDecoder.GTIN_SIZE, AI013x0x1xDecoder.WEIGHT_SIZE);
        this.encodeCompressedDate(buf, AI013x0x1xDecoder.HEADER_SIZE +
            AI013x0x1xDecoder.GTIN_SIZE +
            AI013x0x1xDecoder.WEIGHT_SIZE);
        return buf.toString();
    };
    AI013x0x1xDecoder.prototype.encodeCompressedDate = function (buf, currentPos) {
        var numericDate = this.getGeneralDecoder().extractNumericValueFromBitArray(currentPos, AI013x0x1xDecoder.DATE_SIZE);
        if (numericDate === 38400) {
            return;
        }
        buf.append('(');
        buf.append(this.dateCode);
        buf.append(')');
        var day /* int */ = numericDate % 32;
        numericDate = Math.trunc(numericDate / 32);
        var month /* int */ = (numericDate % 12) + 1;
        numericDate = Math.trunc(numericDate / 12);
        var year /* int */ = numericDate;
        // Division of an integer by 10 results in 0.
        // The checks exist to add a leading 0.
        if (year < 10) {
            buf.append('0');
        }
        buf.append('' + year);
        if (month < 10) {
            buf.append('0');
        }
        buf.append('' + month);
        if (day < 10) {
            buf.append('0');
        }
        buf.append('' + day);
    };
    AI013x0x1xDecoder.prototype.addWeightCode = function (buf, weight /* int */) {
        buf.append('(');
        buf.append(this.firstAIdigits);
        buf.append('' + Math.trunc(weight / 100000));
        buf.append(')');
    };
    AI013x0x1xDecoder.prototype.checkWeight = function (weight) {
        return weight % 100000;
    };
    AI013x0x1xDecoder.HEADER_SIZE = 7 + 1;
    AI013x0x1xDecoder.WEIGHT_SIZE = 20;
    AI013x0x1xDecoder.DATE_SIZE = 16;
    return AI013x0x1xDecoder;
}(AI01weightDecoder_1.default));
exports.default = AI013x0x1xDecoder;
