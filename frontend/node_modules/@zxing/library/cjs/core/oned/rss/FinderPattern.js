"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ResultPoint_1 = __importDefault(require("../../ResultPoint"));
var FinderPattern = /** @class */ (function () {
    function FinderPattern(value, startEnd, start, end, rowNumber) {
        this.value = value;
        this.startEnd = startEnd;
        this.resultPoints = new Array();
        this.resultPoints.push(new ResultPoint_1.default(start, rowNumber));
        this.resultPoints.push(new ResultPoint_1.default(end, rowNumber));
    }
    FinderPattern.prototype.getValue = function () {
        return this.value;
    };
    FinderPattern.prototype.getStartEnd = function () {
        return this.startEnd;
    };
    FinderPattern.prototype.getResultPoints = function () {
        return this.resultPoints;
    };
    FinderPattern.prototype.equals = function (o) {
        if (!(o instanceof FinderPattern)) {
            return false;
        }
        var that = o;
        return this.value === that.value;
    };
    FinderPattern.prototype.hashCode = function () {
        return this.value;
    };
    return FinderPattern;
}());
exports.default = FinderPattern;
