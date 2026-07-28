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
var DataCharacter_1 = __importDefault(require("./DataCharacter"));
var Pair = /** @class */ (function (_super) {
    __extends(Pair, _super);
    function Pair(value, checksumPortion, finderPattern) {
        var _this = _super.call(this, value, checksumPortion) || this;
        _this.count = 0;
        _this.finderPattern = finderPattern;
        return _this;
    }
    Pair.prototype.getFinderPattern = function () {
        return this.finderPattern;
    };
    Pair.prototype.getCount = function () {
        return this.count;
    };
    Pair.prototype.incrementCount = function () {
        this.count++;
    };
    return Pair;
}(DataCharacter_1.default));
exports.default = Pair;
