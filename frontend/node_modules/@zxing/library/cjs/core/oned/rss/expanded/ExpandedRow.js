"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ExpandedPair_1 = __importDefault(require("./ExpandedPair"));
var ExpandedRow = /** @class */ (function () {
    function ExpandedRow(pairs, rowNumber) {
        this.pairs = __spreadArray([], __read(pairs), false);
        this.rowNumber = rowNumber;
    }
    ExpandedRow.prototype.getPairs = function () {
        return this.pairs;
    };
    ExpandedRow.prototype.getRowNumber = function () {
        return this.rowNumber;
    };
    ExpandedRow.prototype.isEquivalent = function (otherPairs) {
        return ExpandedRow.listEquals(this.getPairs(), otherPairs);
    };
    ExpandedRow.prototype.toString = function () {
        return '{ ' + this.pairs + ' }';
    };
    /**
     * Two rows are equal if they contain the same pairs in the same order.
     */
    // @Override
    ExpandedRow.equals = function (o1, o2) {
        if (o1 === null)
            return o2 === null;
        if (!(o2 instanceof ExpandedRow)) {
            return false;
        }
        return ExpandedRow.listEquals(o1.pairs, o2.getPairs());
    };
    ExpandedRow.listEquals = function (pairs1, pairs2) {
        if (pairs1.length !== pairs2.length)
            return false;
        return pairs1.every(function (pair1, index) {
            var pair2 = pairs2[index];
            return ExpandedPair_1.default.equals(pair1, pair2);
        });
    };
    return ExpandedRow;
}());
exports.default = ExpandedRow;
