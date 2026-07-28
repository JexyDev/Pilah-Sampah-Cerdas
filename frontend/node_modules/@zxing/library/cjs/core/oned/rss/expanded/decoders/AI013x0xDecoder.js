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
var StringBuilder_1 = __importDefault(require("../../../../util/StringBuilder"));
var NotFoundException_1 = __importDefault(require("../../../../NotFoundException"));
var AI013x0xDecoder = /** @class */ (function (_super) {
    __extends(AI013x0xDecoder, _super);
    function AI013x0xDecoder(information) {
        return _super.call(this, information) || this;
    }
    AI013x0xDecoder.prototype.parseInformation = function () {
        if (this.getInformation().getSize() !==
            AI013x0xDecoder.HEADER_SIZE +
                AI01weightDecoder_1.default.GTIN_SIZE +
                AI013x0xDecoder.WEIGHT_SIZE) {
            throw new NotFoundException_1.default();
        }
        var buf = new StringBuilder_1.default();
        this.encodeCompressedGtin(buf, AI013x0xDecoder.HEADER_SIZE);
        this.encodeCompressedWeight(buf, AI013x0xDecoder.HEADER_SIZE + AI01weightDecoder_1.default.GTIN_SIZE, AI013x0xDecoder.WEIGHT_SIZE);
        return buf.toString();
    };
    AI013x0xDecoder.HEADER_SIZE = 4 + 1;
    AI013x0xDecoder.WEIGHT_SIZE = 15;
    return AI013x0xDecoder;
}(AI01weightDecoder_1.default));
exports.default = AI013x0xDecoder;
