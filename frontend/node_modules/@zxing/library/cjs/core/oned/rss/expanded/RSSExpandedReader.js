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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var BarcodeFormat_1 = __importDefault(require("../../../BarcodeFormat"));
var MathUtils_1 = __importDefault(require("../../../common/detector/MathUtils"));
// import FormatException from '../../../FormatException';
var NotFoundException_1 = __importDefault(require("../../../NotFoundException"));
var Result_1 = __importDefault(require("../../../Result"));
var System_1 = __importDefault(require("../../../util/System"));
var AbstractRSSReader_1 = __importDefault(require("../../rss/AbstractRSSReader"));
var DataCharacter_1 = __importDefault(require("../../rss/DataCharacter"));
var FinderPattern_1 = __importDefault(require("../../rss/FinderPattern"));
var RSSUtils_1 = __importDefault(require("../../rss/RSSUtils"));
var BitArrayBuilder_1 = __importDefault(require("./BitArrayBuilder"));
var AbstractExpandedDecoderComplement_1 = require("./decoders/AbstractExpandedDecoderComplement");
var ExpandedPair_1 = __importDefault(require("./ExpandedPair"));
var ExpandedRow_1 = __importDefault(require("./ExpandedRow"));
// import java.util.ArrayList;
// import java.util.Iterator;
// import java.util.List;
// import java.util.Map;
// import java.util.Collections;
/** @experimental */
var RSSExpandedReader = /** @class */ (function (_super) {
    __extends(RSSExpandedReader, _super);
    function RSSExpandedReader() {
        var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
        _this.pairs = new Array(RSSExpandedReader.MAX_PAIRS);
        _this.rows = new Array();
        _this.startEnd = [0, 0];
        _this.startFromEven = false;
        return _this;
    }
    RSSExpandedReader.prototype.decodeRow = function (rowNumber, row, hints) {
        // Rows can start with even pattern if previous rows had an odd number of patterns, so we try twice.
        this.startFromEven = false;
        try {
            return RSSExpandedReader.constructResult(this.decodeRow2pairs(rowNumber, row));
        }
        catch (ex) {
            if (ex instanceof NotFoundException_1.default) {
                // OK
                // console.log(ex);
            }
            else {
                throw ex;
            }
        }
        this.startFromEven = true;
        return RSSExpandedReader.constructResult(this.decodeRow2pairs(rowNumber, row));
    };
    RSSExpandedReader.prototype.reset = function () {
        this.pairs.length = 0;
        this.rows.length = 0;
    };
    // Not private for testing
    RSSExpandedReader.prototype.decodeRow2pairs = function (rowNumber, row) {
        this.pairs.length = 0;
        var done = false;
        while (!done) {
            try {
                this.pairs.push(this.retrieveNextPair(row, this.pairs, rowNumber));
            }
            catch (error) {
                if (error instanceof NotFoundException_1.default) {
                    if (this.pairs.length === 0) {
                        throw error;
                    }
                    // exit this loop when retrieveNextPair() fails and throws
                    done = true;
                }
                else {
                    throw error;
                }
            }
        }
        // TODO: verify sequence of finder patterns as in checkPairSequence()
        if (this.checkChecksum() && RSSExpandedReader.isValidSequence(this.pairs, true)) {
            return this.pairs;
        }
        var tryStackedDecode = this.rows.length > 0;
        this.storeRow(rowNumber); // TODO: deal with reversed rows
        if (tryStackedDecode) {
            // When the image is 180-rotated, then rows are sorted in wrong direction.
            // Try twice with both the directions.
            var ps = this.checkRowsBoolean(false);
            if (ps !== null) {
                return ps;
            }
            ps = this.checkRowsBoolean(true);
            if (ps !== null) {
                return ps;
            }
        }
        throw new NotFoundException_1.default();
    };
    RSSExpandedReader.prototype.checkRowsBoolean = function (reverse) {
        // Limit number of rows we are checking
        // We use recursive algorithm with pure complexity and don't want it to take forever
        // Stacked barcode can have up to 11 rows, so 25 seems reasonable enough
        if (this.rows.length > 25) {
            this.rows.length = 0; // We will never have a chance to get result, so clear it
            return null;
        }
        this.pairs.length = 0;
        if (reverse) {
            this.rows.reverse();
        }
        var ps = null;
        try {
            ps = this.checkRows(new Array(), 0);
        }
        catch (ex) {
            if (ex instanceof NotFoundException_1.default) {
                // OK
                // console.log(ex);
            }
            else {
                throw ex;
            }
        }
        if (reverse) {
            this.rows.reverse();
        }
        return ps;
    };
    // Try to construct a valid rows sequence
    // Recursion is used to implement backtracking
    RSSExpandedReader.prototype.checkRows = function (collectedRows, currentRow) {
        var _a;
        for (var i = currentRow; i < this.rows.length; i++) {
            var row = this.rows[i];
            (_a = this.pairs).push.apply(_a, __spreadArray([], __read(row.getPairs()), false));
            var addSize = row.getPairs().length;
            if (RSSExpandedReader.isValidSequence(this.pairs, false)) {
                if (this.checkChecksum()) {
                    return this.pairs;
                }
                collectedRows.push(row);
                try {
                    // Recursion: try to add more rows
                    return this.checkRows(collectedRows, i + 1);
                }
                catch (ex) {
                    if (ex instanceof NotFoundException_1.default) {
                        // We failed, try the next candidate
                        collectedRows.pop();
                        this.pairs.splice(this.pairs.length - addSize, addSize);
                    }
                    else {
                        throw ex;
                    }
                }
            }
            else {
                this.pairs.splice(this.pairs.length - addSize, addSize);
            }
        }
        throw new NotFoundException_1.default();
    };
    // Whether the pairs form a valid finder pattern sequence, either complete or a prefix
    RSSExpandedReader.isValidSequence = function (pairs, complete) {
        var e_1, _a;
        try {
            for (var _b = __values(RSSExpandedReader.FINDER_PATTERN_SEQUENCES), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sequence = _c.value;
                var sizeOk = (complete ? pairs.length === sequence.length : pairs.length <= sequence.length);
                if (sizeOk) {
                    var stop_1 = true;
                    for (var j = 0; j < pairs.length; j++) {
                        if (pairs[j].getFinderPattern().getValue() !== sequence[j]) {
                            stop_1 = false;
                            break;
                        }
                    }
                    if (stop_1) {
                        return true;
                    }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return false;
    };
    // Whether the pairs, plus another pair of the specified type, would together
    // form a valid finder pattern sequence, either complete or partial
    RSSExpandedReader.mayFollow = function (pairs, value /* int */) {
        var e_2, _a;
        if (pairs.length === 0) {
            return true;
        }
        try {
            for (var _b = __values(this.FINDER_PATTERN_SEQUENCES), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sequence = _c.value;
                if (pairs.length + 1 <= sequence.length) {
                    // the proposed sequence (i.e. pairs + value) would fit in this allowed sequence
                    for (var i = pairs.length; i < sequence.length; i++) {
                        if (sequence[i] === value) {
                            // we found our value in this allowed sequence, check to see if the elements preceding it match our existing
                            // pairs; note our existing pairs may not be a full sequence (e.g. if processing a row in a stacked symbol)
                            var matched = true;
                            for (var j = 0; j < pairs.length; j++) {
                                var allowed = sequence[i - j - 1];
                                var actual = pairs[pairs.length - j - 1].getFinderPattern().getValue();
                                if (allowed !== actual) {
                                    matched = false;
                                    break;
                                }
                            }
                            if (matched) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // the proposed finder pattern sequence is illegal
        return false;
    };
    RSSExpandedReader.prototype.storeRow = function (rowNumber) {
        // Discard if duplicate above or below; otherwise insert in order by row number.
        var insertPos = 0;
        var prevIsSame = false;
        var nextIsSame = false;
        while (insertPos < this.rows.length) {
            var erow = this.rows[insertPos];
            if (erow.getRowNumber() > rowNumber) {
                nextIsSame = erow.isEquivalent(this.pairs);
                break;
            }
            prevIsSame = erow.isEquivalent(this.pairs);
            insertPos++;
        }
        if (nextIsSame || prevIsSame) {
            return;
        }
        // When the row was partially decoded (e.g. 2 pairs found instead of 3),
        // it will prevent us from detecting the barcode.
        // Try to merge partial rows
        // Check whether the row is part of an already detected row
        if (RSSExpandedReader.isPartialRow(this.pairs, this.rows)) {
            return;
        }
        this.rows.splice(insertPos, 0, new ExpandedRow_1.default(this.pairs, rowNumber));
        this.removePartialRows(this.pairs, this.rows);
    };
    // Remove all the rows that contains only specified pairs
    RSSExpandedReader.prototype.removePartialRows = function (pairs, rows) {
        var e_3, _a;
        // Iterate backwards to prevent shifting indices.
        for (var rowsIndex = rows.length - 1; rowsIndex >= 0; rowsIndex--) {
            var r = rows[rowsIndex];
            if (r.getPairs().length !== pairs.length) {
                var allFound = true;
                var _loop_1 = function (p) {
                    if (!pairs.some(function (otherPair) { return ExpandedPair_1.default.equals(p, otherPair); })) {
                        allFound = false;
                        return "break";
                    }
                };
                try {
                    for (var _b = (e_3 = void 0, __values(r.getPairs())), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var p = _c.value;
                        var state_1 = _loop_1(p);
                        if (state_1 === "break")
                            break;
                    }
                }
                catch (e_3_1) { e_3 = { error: e_3_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_3) throw e_3.error; }
                }
                if (allFound) {
                    // 'pairs' contains all the pairs from the row 'r'
                    rows.splice(rowsIndex, 1);
                }
            }
        }
    };
    // Returns true when one of the rows already contains all the pairs
    RSSExpandedReader.isPartialRow = function (pairs, rows) {
        var e_4, _a, e_5, _b, e_6, _c;
        try {
            for (var rows_1 = __values(rows), rows_1_1 = rows_1.next(); !rows_1_1.done; rows_1_1 = rows_1.next()) {
                var r = rows_1_1.value;
                var allFound = true;
                try {
                    for (var pairs_1 = (e_5 = void 0, __values(pairs)), pairs_1_1 = pairs_1.next(); !pairs_1_1.done; pairs_1_1 = pairs_1.next()) {
                        var p = pairs_1_1.value;
                        var found = false;
                        try {
                            for (var _d = (e_6 = void 0, __values(r.getPairs())), _e = _d.next(); !_e.done; _e = _d.next()) {
                                var pp = _e.value;
                                if (ExpandedPair_1.default.equals(p, pp)) {
                                    found = true;
                                    break;
                                }
                            }
                        }
                        catch (e_6_1) { e_6 = { error: e_6_1 }; }
                        finally {
                            try {
                                if (_e && !_e.done && (_c = _d.return)) _c.call(_d);
                            }
                            finally { if (e_6) throw e_6.error; }
                        }
                        if (!found) {
                            allFound = false;
                            break;
                        }
                    }
                }
                catch (e_5_1) { e_5 = { error: e_5_1 }; }
                finally {
                    try {
                        if (pairs_1_1 && !pairs_1_1.done && (_b = pairs_1.return)) _b.call(pairs_1);
                    }
                    finally { if (e_5) throw e_5.error; }
                }
                if (allFound) {
                    // the row 'r' contain all the pairs from 'pairs'
                    return true;
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (rows_1_1 && !rows_1_1.done && (_a = rows_1.return)) _a.call(rows_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        return false;
    };
    // Only used for unit testing
    RSSExpandedReader.prototype.getRows = function () {
        return this.rows;
    };
    // Not private for unit testing
    RSSExpandedReader.constructResult = function (pairs) {
        var binary = BitArrayBuilder_1.default.buildBitArray(pairs);
        var decoder = (0, AbstractExpandedDecoderComplement_1.createDecoder)(binary);
        var resultingString = decoder.parseInformation();
        var firstPoints = pairs[0].getFinderPattern().getResultPoints();
        var lastPoints = pairs[pairs.length - 1]
            .getFinderPattern()
            .getResultPoints();
        var points = [firstPoints[0], firstPoints[1], lastPoints[0], lastPoints[1]];
        return new Result_1.default(resultingString, null, null, points, BarcodeFormat_1.default.RSS_EXPANDED, null);
    };
    RSSExpandedReader.prototype.checkChecksum = function () {
        var firstPair = this.pairs[0];
        var checkCharacter = firstPair.getLeftChar();
        var firstCharacter = firstPair.getRightChar();
        if (firstCharacter === null) {
            return false;
        }
        var checksum = firstCharacter.getChecksumPortion();
        var s = 2;
        for (var i = 1; i < this.pairs.length; ++i) {
            var currentPair = this.pairs[i];
            checksum += currentPair.getLeftChar().getChecksumPortion();
            s++;
            var currentRightChar = currentPair.getRightChar();
            if (currentRightChar !== null) {
                checksum += currentRightChar.getChecksumPortion();
                s++;
            }
        }
        checksum %= 211;
        var checkCharacterValue = 211 * (s - 4) + checksum;
        return checkCharacterValue === checkCharacter.getValue();
    };
    RSSExpandedReader.getNextSecondBar = function (row, initialPos) {
        var currentPos = 0;
        if (row.get(initialPos)) {
            currentPos = row.getNextUnset(initialPos);
            currentPos = row.getNextSet(currentPos);
        }
        else {
            currentPos = row.getNextSet(initialPos);
            currentPos = row.getNextUnset(currentPos);
        }
        return currentPos;
    };
    // not private for testing
    RSSExpandedReader.prototype.retrieveNextPair = function (row, previousPairs, rowNumber) {
        var isOddPattern = previousPairs.length % 2 === 0;
        if (this.startFromEven) {
            isOddPattern = !isOddPattern;
        }
        var pattern = null;
        var leftChar = null;
        var keepFinding = true;
        var forcedOffset = -1;
        do {
            this.findNextPair(row, previousPairs, forcedOffset);
            pattern = this.parseFoundFinderPattern(row, rowNumber, isOddPattern, previousPairs);
            if (pattern === null) {
                forcedOffset = RSSExpandedReader.getNextSecondBar(row, this.startEnd[0]); // probable false positive, keep looking
            }
            else {
                try {
                    leftChar = this.decodeDataCharacter(row, pattern, isOddPattern, true);
                    keepFinding = false;
                }
                catch (ex) {
                    if (ex instanceof NotFoundException_1.default) {
                        forcedOffset = RSSExpandedReader.getNextSecondBar(row, this.startEnd[0]); // probable false positive, keep looking
                    }
                    else {
                        throw ex;
                    }
                }
            }
        } while (keepFinding);
        // When stacked symbol is split over multiple rows, there's no way to guess if this pair can be last or not.
        // boolean mayBeLast = checkPairSequence(previousPairs, pattern);
        if (previousPairs.length > 0 && previousPairs[previousPairs.length - 1].mustBeLast()) {
            throw new NotFoundException_1.default();
        }
        var rightChar = null;
        try {
            rightChar = this.decodeDataCharacter(row, pattern, isOddPattern, false);
        }
        catch (ex) {
            if (ex instanceof NotFoundException_1.default) {
                rightChar = null;
                // console.log(ex);
            }
            else {
                throw ex;
            }
        }
        return new ExpandedPair_1.default(leftChar, rightChar, pattern);
    };
    RSSExpandedReader.prototype.findNextPair = function (row, previousPairs, forcedOffset) {
        var counters = this.getDecodeFinderCounters();
        counters[0] = 0;
        counters[1] = 0;
        counters[2] = 0;
        counters[3] = 0;
        var width = row.getSize();
        var rowOffset = 0;
        if (forcedOffset >= 0) {
            rowOffset = forcedOffset;
        }
        else if (previousPairs.length === 0) {
            rowOffset = 0;
        }
        else {
            var lastPair = previousPairs[previousPairs.length - 1];
            rowOffset = lastPair.getFinderPattern().getStartEnd()[1];
        }
        var searchingEvenPair = previousPairs.length % 2 !== 0;
        if (this.startFromEven) {
            searchingEvenPair = !searchingEvenPair;
        }
        var isWhite = false;
        while (rowOffset < width) {
            isWhite = !row.get(rowOffset);
            if (!isWhite) {
                break;
            }
            rowOffset++;
        }
        var counterPosition = 0;
        var patternStart = rowOffset;
        for (var x = rowOffset; x < width; x++) {
            if (row.get(x) !== isWhite) {
                counters[counterPosition]++;
            }
            else {
                if (counterPosition === 3) {
                    if (searchingEvenPair) {
                        RSSExpandedReader.reverseCounters(counters);
                    }
                    if (RSSExpandedReader.isFinderPattern(counters)) {
                        this.startEnd[0] = patternStart;
                        this.startEnd[1] = x;
                        return;
                    }
                    if (searchingEvenPair) {
                        RSSExpandedReader.reverseCounters(counters);
                    }
                    patternStart += counters[0] + counters[1];
                    counters[0] = counters[2];
                    counters[1] = counters[3];
                    counters[2] = 0;
                    counters[3] = 0;
                    counterPosition--;
                }
                else {
                    counterPosition++;
                }
                counters[counterPosition] = 1;
                isWhite = !isWhite;
            }
        }
        throw new NotFoundException_1.default();
    };
    RSSExpandedReader.reverseCounters = function (counters) {
        var length = counters.length;
        for (var i = 0; i < Math.trunc(length / 2); ++i) {
            var tmp = counters[i];
            counters[i] = counters[length - i - 1];
            counters[length - i - 1] = tmp;
        }
    };
    RSSExpandedReader.prototype.parseFoundFinderPattern = function (row, rowNumber, oddPattern, previousPairs) {
        // Actually we found elements 2-5.
        var firstCounter = 0;
        var start = 0;
        var end = 0;
        if (oddPattern) {
            // If pattern number is odd, we need to locate element 1 *before* the current block.
            var firstElementStart = this.startEnd[0] - 1;
            // Locate element 1
            while (firstElementStart >= 0 && !row.get(firstElementStart)) {
                firstElementStart--;
            }
            firstElementStart++;
            firstCounter = this.startEnd[0] - firstElementStart;
            start = firstElementStart;
            end = this.startEnd[1];
        }
        else {
            // If pattern number is even, the pattern is reversed, so we need to locate element 1 *after* the current block.
            start = this.startEnd[0];
            end = row.getNextUnset(this.startEnd[1] + 1);
            firstCounter = end - this.startEnd[1];
        }
        // Make 'counters' hold 1-4
        var counters = this.getDecodeFinderCounters();
        System_1.default.arraycopy(counters, 0, counters, 1, counters.length - 1);
        counters[0] = firstCounter;
        var value = 0;
        try {
            value = this.parseFinderValue(counters, RSSExpandedReader.FINDER_PATTERNS);
        }
        catch (ex) {
            if (ex instanceof NotFoundException_1.default) {
                return null;
            }
            else {
                throw ex;
            }
        }
        // Check that the pattern type that we *think* we found can exist as part of a valid sequence of finder patterns.
        if (!RSSExpandedReader.mayFollow(previousPairs, value)) {
            return null;
        }
        // Check that the finder pattern that we *think* we found is not too far from where we would expect to find it,
        // given that finder patterns are 15 modules wide and the data characters between them are 17 modules wide.
        if (previousPairs.length > 0) {
            var prev = previousPairs[previousPairs.length - 1];
            var prevStart = prev.getFinderPattern().getStartEnd()[0];
            var prevEnd = prev.getFinderPattern().getStartEnd()[1];
            var prevWidth = prevEnd - prevStart;
            var charWidth /* float */ = (prevWidth / /* float */ RSSExpandedReader.FINDER_PATTERN_MODULES) * RSSExpandedReader.DATA_CHARACTER_MODULES;
            var minX = prevEnd + (2 * charWidth * (1 - RSSExpandedReader.MAX_FINDER_PATTERN_DISTANCE_VARIANCE));
            var maxX = prevEnd + (2 * charWidth * (1 + RSSExpandedReader.MAX_FINDER_PATTERN_DISTANCE_VARIANCE));
            if (start < minX || start > maxX) {
                return null;
            }
        }
        return new FinderPattern_1.default(value, [start, end], start, end, rowNumber);
    };
    RSSExpandedReader.prototype.decodeDataCharacter = function (row, pattern, isOddPattern, leftChar) {
        var counters = this.getDataCharacterCounters();
        for (var x = 0; x < counters.length; x++) {
            counters[x] = 0;
        }
        if (leftChar) {
            RSSExpandedReader.recordPatternInReverse(row, pattern.getStartEnd()[0], counters);
        }
        else {
            RSSExpandedReader.recordPattern(row, pattern.getStartEnd()[1], counters);
            // reverse it
            for (var i = 0, j = counters.length - 1; i < j; i++, j--) {
                var temp = counters[i];
                counters[i] = counters[j];
                counters[j] = temp;
            }
        } // counters[] has the pixels of the module
        var numModules = 17; // left and right data characters have all the same length
        var elementWidth /* float */ = MathUtils_1.default.sum(new Int32Array(counters)) / numModules;
        // Sanity check: element width for pattern and the character should match
        var expectedElementWidth /* float */ = (pattern.getStartEnd()[1] - pattern.getStartEnd()[0]) / 15.0;
        if (Math.abs(elementWidth - expectedElementWidth) / expectedElementWidth > 0.3) {
            throw new NotFoundException_1.default();
        }
        var oddCounts = this.getOddCounts();
        var evenCounts = this.getEvenCounts();
        var oddRoundingErrors = this.getOddRoundingErrors();
        var evenRoundingErrors = this.getEvenRoundingErrors();
        for (var i = 0; i < counters.length; i++) {
            var value_1 /* float */ = (1.0 * counters[i]) / elementWidth;
            var count = Math.trunc(value_1 + 0.5); // Round
            if (count < 1) {
                if (value_1 < 0.3) {
                    throw new NotFoundException_1.default();
                }
                count = 1;
            }
            else if (count > 8) {
                if (value_1 > 8.7) {
                    throw new NotFoundException_1.default();
                }
                count = 8;
            }
            var offset /* int */ = Math.trunc(i / 2);
            if ((i & 0x01) === 0) {
                oddCounts[offset] = count;
                oddRoundingErrors[offset] = value_1 - count;
            }
            else {
                evenCounts[offset] = count;
                evenRoundingErrors[offset] = value_1 - count;
            }
        }
        this.adjustOddEvenCounts(numModules);
        var weightRowNumber = 4 * pattern.getValue() + (isOddPattern ? 0 : 2) + (leftChar ? 0 : 1) - 1;
        var oddSum = 0;
        var oddChecksumPortion = 0;
        for (var i = oddCounts.length - 1; i >= 0; i--) {
            if (RSSExpandedReader.isNotA1left(pattern, isOddPattern, leftChar)) {
                var weight = RSSExpandedReader.WEIGHTS[weightRowNumber][2 * i];
                oddChecksumPortion += oddCounts[i] * weight;
            }
            oddSum += oddCounts[i];
        }
        var evenChecksumPortion = 0;
        for (var i = evenCounts.length - 1; i >= 0; i--) {
            if (RSSExpandedReader.isNotA1left(pattern, isOddPattern, leftChar)) {
                var weight = RSSExpandedReader.WEIGHTS[weightRowNumber][2 * i + 1];
                evenChecksumPortion += evenCounts[i] * weight;
            }
        }
        var checksumPortion = oddChecksumPortion + evenChecksumPortion;
        if ((oddSum & 0x01) !== 0 || oddSum > 13 || oddSum < 4) {
            throw new NotFoundException_1.default();
        }
        var group /* int */ = Math.trunc((13 - oddSum) / 2);
        var oddWidest = RSSExpandedReader.SYMBOL_WIDEST[group];
        var evenWidest = 9 - oddWidest;
        var vOdd = RSSUtils_1.default.getRSSvalue(oddCounts, oddWidest, true);
        var vEven = RSSUtils_1.default.getRSSvalue(evenCounts, evenWidest, false);
        var tEven = RSSExpandedReader.EVEN_TOTAL_SUBSET[group];
        var gSum = RSSExpandedReader.GSUM[group];
        var value = vOdd * tEven + vEven + gSum;
        return new DataCharacter_1.default(value, checksumPortion);
    };
    RSSExpandedReader.isNotA1left = function (pattern, isOddPattern, leftChar) {
        // A1: pattern.getValue is 0 (A), and it's an oddPattern, and it is a left char
        return !(pattern.getValue() === 0 && isOddPattern && leftChar);
    };
    RSSExpandedReader.prototype.adjustOddEvenCounts = function (numModules /* int */) {
        var oddSum = MathUtils_1.default.sum(new Int32Array(this.getOddCounts()));
        var evenSum = MathUtils_1.default.sum(new Int32Array(this.getEvenCounts()));
        var incrementOdd = false;
        var decrementOdd = false;
        if (oddSum > 13) {
            decrementOdd = true;
        }
        else if (oddSum < 4) {
            incrementOdd = true;
        }
        var incrementEven = false;
        var decrementEven = false;
        if (evenSum > 13) {
            decrementEven = true;
        }
        else if (evenSum < 4) {
            incrementEven = true;
        }
        var mismatch = oddSum + evenSum - numModules;
        var oddParityBad = (oddSum & 0x01) === 1;
        var evenParityBad = (evenSum & 0x01) === 0;
        if (mismatch === 1) {
            if (oddParityBad) {
                if (evenParityBad) {
                    throw new NotFoundException_1.default();
                }
                decrementOdd = true;
            }
            else {
                if (!evenParityBad) {
                    throw new NotFoundException_1.default();
                }
                decrementEven = true;
            }
        }
        else if (mismatch === -1) {
            if (oddParityBad) {
                if (evenParityBad) {
                    throw new NotFoundException_1.default();
                }
                incrementOdd = true;
            }
            else {
                if (!evenParityBad) {
                    throw new NotFoundException_1.default();
                }
                incrementEven = true;
            }
        }
        else if (mismatch === 0) {
            if (oddParityBad) {
                if (!evenParityBad) {
                    throw new NotFoundException_1.default();
                }
                // Both bad
                if (oddSum < evenSum) {
                    incrementOdd = true;
                    decrementEven = true;
                }
                else {
                    decrementOdd = true;
                    incrementEven = true;
                }
            }
            else {
                if (evenParityBad) {
                    throw new NotFoundException_1.default();
                }
                // Nothing to do!
            }
        }
        else {
            throw new NotFoundException_1.default();
        }
        if (incrementOdd) {
            if (decrementOdd) {
                throw new NotFoundException_1.default();
            }
            RSSExpandedReader.increment(this.getOddCounts(), this.getOddRoundingErrors());
        }
        if (decrementOdd) {
            RSSExpandedReader.decrement(this.getOddCounts(), this.getOddRoundingErrors());
        }
        if (incrementEven) {
            if (decrementEven) {
                throw new NotFoundException_1.default();
            }
            RSSExpandedReader.increment(this.getEvenCounts(), this.getOddRoundingErrors());
        }
        if (decrementEven) {
            RSSExpandedReader.decrement(this.getEvenCounts(), this.getEvenRoundingErrors());
        }
    };
    RSSExpandedReader.SYMBOL_WIDEST = [7, 5, 4, 3, 1];
    RSSExpandedReader.EVEN_TOTAL_SUBSET = [4, 20, 52, 104, 204];
    RSSExpandedReader.GSUM = [0, 348, 1388, 2948, 3988];
    RSSExpandedReader.FINDER_PATTERNS = [
        Int32Array.from([1, 8, 4, 1]), // A
        Int32Array.from([3, 6, 4, 1]), // B
        Int32Array.from([3, 4, 6, 1]), // C
        Int32Array.from([3, 2, 8, 1]), // D
        Int32Array.from([2, 6, 5, 1]), // E
        Int32Array.from([2, 2, 9, 1]), // F
    ];
    RSSExpandedReader.WEIGHTS = [
        [1, 3, 9, 27, 81, 32, 96, 77],
        [20, 60, 180, 118, 143, 7, 21, 63],
        [189, 145, 13, 39, 117, 140, 209, 205],
        [193, 157, 49, 147, 19, 57, 171, 91],
        [62, 186, 136, 197, 169, 85, 44, 132],
        [185, 133, 188, 142, 4, 12, 36, 108],
        [113, 128, 173, 97, 80, 29, 87, 50],
        [150, 28, 84, 41, 123, 158, 52, 156],
        [46, 138, 203, 187, 139, 206, 196, 166],
        [76, 17, 51, 153, 37, 111, 122, 155],
        [43, 129, 176, 106, 107, 110, 119, 146],
        [16, 48, 144, 10, 30, 90, 59, 177],
        [109, 116, 137, 200, 178, 112, 125, 164],
        [70, 210, 208, 202, 184, 130, 179, 115],
        [134, 191, 151, 31, 93, 68, 204, 190],
        [148, 22, 66, 198, 172, 94, 71, 2],
        [6, 18, 54, 162, 64, 192, 154, 40],
        [120, 149, 25, 75, 14, 42, 126, 167],
        [79, 26, 78, 23, 69, 207, 199, 175],
        [103, 98, 83, 38, 114, 131, 182, 124],
        [161, 61, 183, 127, 170, 88, 53, 159],
        [55, 165, 73, 8, 24, 72, 5, 15],
        [45, 135, 194, 160, 58, 174, 100, 89],
    ];
    RSSExpandedReader.FINDER_PAT_A = 0;
    RSSExpandedReader.FINDER_PAT_B = 1;
    RSSExpandedReader.FINDER_PAT_C = 2;
    RSSExpandedReader.FINDER_PAT_D = 3;
    RSSExpandedReader.FINDER_PAT_E = 4;
    RSSExpandedReader.FINDER_PAT_F = 5;
    RSSExpandedReader.FINDER_PATTERN_SEQUENCES = [
        [RSSExpandedReader.FINDER_PAT_A, RSSExpandedReader.FINDER_PAT_A],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_C,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_F,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_F,
            RSSExpandedReader.FINDER_PAT_F,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_D,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_E,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_F,
            RSSExpandedReader.FINDER_PAT_F,
        ],
        [
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_A,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_B,
            RSSExpandedReader.FINDER_PAT_C,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_D,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_E,
            RSSExpandedReader.FINDER_PAT_F,
            RSSExpandedReader.FINDER_PAT_F,
        ],
    ];
    RSSExpandedReader.MAX_PAIRS = 11;
    RSSExpandedReader.FINDER_PATTERN_MODULES = 15;
    RSSExpandedReader.DATA_CHARACTER_MODULES = 17;
    RSSExpandedReader.MAX_FINDER_PATTERN_DISTANCE_VARIANCE = 0.1;
    return RSSExpandedReader;
}(AbstractRSSReader_1.default));
exports.default = RSSExpandedReader;
