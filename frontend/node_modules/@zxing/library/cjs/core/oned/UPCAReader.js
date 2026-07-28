"use strict";
/*
 * Copyright 2008 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.oned {*/
var BarcodeFormat_1 = __importDefault(require("../BarcodeFormat"));
var Result_1 = __importDefault(require("../Result"));
var NotFoundException_1 = __importDefault(require("../NotFoundException"));
var EAN13Reader_1 = __importDefault(require("./EAN13Reader"));
var UPCEANReader_1 = __importDefault(require("./UPCEANReader"));
/**
 * Encapsulates functionality and implementation that is common to all families
 * of one-dimensional barcodes.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 * @author Sean Owen
 * @author sam2332 (Sam Rudloff)
 *
 * @source https://github.com/zxing/zxing/blob/3c96923276dd5785d58eb970b6ba3f80d36a9505/core/src/main/java/com/google/zxing/oned/UPCAReader.java
 *
 * @experimental
 */
var UPCAReader = /** @class */ (function (_super) {
    __extends(UPCAReader, _super);
    function UPCAReader() {
        var _this = _super.apply(this, __spreadArray([], __read(arguments), false)) || this;
        _this.ean13Reader = new EAN13Reader_1.default();
        return _this;
    }
    // @Override
    UPCAReader.prototype.getBarcodeFormat = function () {
        return BarcodeFormat_1.default.UPC_A;
    };
    // Note that we don't try rotation without the try harder flag, even if rotation was supported.
    // @Override
    UPCAReader.prototype.decode = function (image, hints) {
        return this.maybeReturnResult(this.ean13Reader.decode(image));
    };
    // @Override
    UPCAReader.prototype.decodeRow = function (rowNumber, row, hints) {
        return this.maybeReturnResult(this.ean13Reader.decodeRow(rowNumber, row, hints));
    };
    // @Override
    UPCAReader.prototype.decodeMiddle = function (row, startRange, resultString) {
        return this.ean13Reader.decodeMiddle(row, startRange, resultString);
    };
    UPCAReader.prototype.maybeReturnResult = function (result) {
        var text = result.getText();
        if (text.charAt(0) === '0') {
            var upcaResult = new Result_1.default(text.substring(1), null, null, result.getResultPoints(), BarcodeFormat_1.default.UPC_A);
            if (result.getResultMetadata() != null) {
                upcaResult.putAllMetadata(result.getResultMetadata());
            }
            return upcaResult;
        }
        else {
            throw new NotFoundException_1.default();
        }
    };
    UPCAReader.prototype.reset = function () {
        this.ean13Reader.reset();
    };
    return UPCAReader;
}(UPCEANReader_1.default));
exports.default = UPCAReader;
