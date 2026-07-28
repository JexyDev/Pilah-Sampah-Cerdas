"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ExpandedPair = /** @class */ (function () {
    function ExpandedPair(leftChar, rightChar, finderPatter) {
        this.leftChar = leftChar;
        this.rightChar = rightChar;
        this.finderPattern = finderPatter;
    }
    ExpandedPair.prototype.getLeftChar = function () {
        return this.leftChar;
    };
    ExpandedPair.prototype.getRightChar = function () {
        return this.rightChar;
    };
    ExpandedPair.prototype.getFinderPattern = function () {
        return this.finderPattern;
    };
    ExpandedPair.prototype.mustBeLast = function () {
        return this.rightChar === null;
    };
    ExpandedPair.prototype.toString = function () {
        return '[ ' + this.leftChar + ', ' + this.rightChar + ' : ' + (this.finderPattern === null ? 'null' : this.finderPattern.getValue()) + ' ]';
    };
    ExpandedPair.equals = function (o1, o2) {
        if (o2 === null)
            return o1 === null;
        if (!(o2 instanceof ExpandedPair)) {
            return false;
        }
        return (o1.leftChar === null ? o2.leftChar === null : o1.leftChar.equals(o2.leftChar)) &&
            (o1.rightChar === null ? o2.rightChar === null : o1.rightChar.equals(o2.rightChar)) &&
            (o1.finderPattern === null ? o2.finderPattern === null : o1.finderPattern.equals(o2.finderPattern));
    };
    ExpandedPair.prototype.hashCode = function () {
        return ExpandedPair.hashNotNull(this.leftChar) ^ ExpandedPair.hashNotNull(this.rightChar) ^ ExpandedPair.hashNotNull(this.finderPattern);
    };
    ExpandedPair.hashNotNull = function (o) {
        return o === null ? 0 : o.hashCode();
    };
    return ExpandedPair;
}());
exports.default = ExpandedPair;
