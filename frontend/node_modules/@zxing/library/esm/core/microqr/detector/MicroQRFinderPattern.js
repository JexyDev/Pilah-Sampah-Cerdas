/*
 * Copyright 2007 ZXing authors
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
import ResultPoint from '../../ResultPoint';
/**
 * Encapsulates a Micro QR Code finder pattern candidate.
 */
var MicroQRFinderPattern = /** @class */ (function (_super) {
    __extends(MicroQRFinderPattern, _super);
    function MicroQRFinderPattern(posX, posY, estimatedModuleSize, count) {
        if (count === void 0) { count = 1; }
        var _this = _super.call(this, posX, posY) || this;
        _this.estimatedModuleSize = estimatedModuleSize;
        _this.count = count;
        return _this;
    }
    MicroQRFinderPattern.prototype.getEstimatedModuleSize = function () {
        return this.estimatedModuleSize;
    };
    MicroQRFinderPattern.prototype.getCount = function () {
        return this.count;
    };
    /**
     * Returns true if this pattern is approximately at position (i, j)
     * with the given module size.
     */
    MicroQRFinderPattern.prototype.aboutEquals = function (moduleSize, i, j) {
        if (Math.abs(i - this.getY()) <= moduleSize && Math.abs(j - this.getX()) <= moduleSize) {
            var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
            return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
        }
        return false;
    };
    /**
     * Return a new pattern that is a weighted average of this pattern and a new estimate.
     */
    MicroQRFinderPattern.prototype.combineEstimate = function (i, j, newModuleSize) {
        var combinedCount = this.count + 1;
        var combinedX = (this.count * this.getX() + j) / combinedCount;
        var combinedY = (this.count * this.getY() + i) / combinedCount;
        var combinedModuleSize = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
        return new MicroQRFinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
    };
    return MicroQRFinderPattern;
}(ResultPoint));
export default MicroQRFinderPattern;
