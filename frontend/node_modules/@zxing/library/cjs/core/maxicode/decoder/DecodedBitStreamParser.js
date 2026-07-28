"use strict";
/*
 * Copyright 2011 ZXing authors
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
var DecoderResult_1 = __importDefault(require("../../common/DecoderResult"));
var FormatException_1 = __importDefault(require("../../FormatException"));
/**
 * <p>MaxiCodes can encode text or structured information as bits in one of several modes,
 * with multiple character sets in one code. This class decodes the bits back into text.</p>
 *
 * @author mike32767
 * @author Manuel Kasten
 */
var DecodedBitStreamParser = /** @class */ (function () {
    /* tslint:enable:max-line-length */
    function DecodedBitStreamParser() {
    }
    DecodedBitStreamParser.decode = function (bytes, mode) {
        var result = [];
        switch (mode) {
            case 2:
            case 3: {
                var postcode = void 0;
                if (mode === 2) {
                    var pc = DecodedBitStreamParser.getPostCode2(bytes);
                    var ps2Length = DecodedBitStreamParser.getPostCode2Length(bytes);
                    if (ps2Length > 10) {
                        throw FormatException_1.default.getFormatInstance();
                    }
                    postcode = String(pc).padStart(ps2Length, '0');
                }
                else {
                    postcode = DecodedBitStreamParser.getPostCode3(bytes);
                }
                var country = String(DecodedBitStreamParser.getCountry(bytes)).padStart(3, '0');
                var service = String(DecodedBitStreamParser.getServiceClass(bytes)).padStart(3, '0');
                var message = DecodedBitStreamParser.getMessage(bytes, 10, 84);
                result.push(message);
                if (result.join('').startsWith('[)>' + DecodedBitStreamParser.RS + '01' + DecodedBitStreamParser.GS)) {
                    result.splice(0, result.length);
                    result.push(message.substring(0, 9));
                    result.push(postcode + DecodedBitStreamParser.GS + country + DecodedBitStreamParser.GS + service + DecodedBitStreamParser.GS);
                    result.push(message.substring(9));
                }
                else {
                    result.splice(0, result.length);
                    result.push(postcode + DecodedBitStreamParser.GS + country + DecodedBitStreamParser.GS + service + DecodedBitStreamParser.GS);
                    result.push(message);
                }
                break;
            }
            case 4:
                result.push(DecodedBitStreamParser.getMessage(bytes, 1, 93));
                break;
            case 5:
                result.push(DecodedBitStreamParser.getMessage(bytes, 1, 77));
                break;
        }
        return new DecoderResult_1.default(bytes, result.join(''), null, String(mode));
    };
    DecodedBitStreamParser.getBit = function (bit, bytes) {
        bit--;
        return (bytes[Math.floor(bit / 6)] & (1 << (5 - (bit % 6)))) === 0 ? 0 : 1;
    };
    DecodedBitStreamParser.getInt = function (bytes, x) {
        var val = 0;
        for (var i = 0; i < x.length; i++) {
            val += DecodedBitStreamParser.getBit(x[i], bytes) << (x.length - i - 1);
        }
        return val;
    };
    DecodedBitStreamParser.getCountry = function (bytes) {
        return DecodedBitStreamParser.getInt(bytes, DecodedBitStreamParser.COUNTRY_BYTES);
    };
    DecodedBitStreamParser.getServiceClass = function (bytes) {
        return DecodedBitStreamParser.getInt(bytes, DecodedBitStreamParser.SERVICE_CLASS_BYTES);
    };
    DecodedBitStreamParser.getPostCode2Length = function (bytes) {
        return DecodedBitStreamParser.getInt(bytes, DecodedBitStreamParser.POSTCODE_2_LENGTH_BYTES);
    };
    DecodedBitStreamParser.getPostCode2 = function (bytes) {
        return DecodedBitStreamParser.getInt(bytes, DecodedBitStreamParser.POSTCODE_2_BYTES);
    };
    DecodedBitStreamParser.getPostCode3 = function (bytes) {
        var e_1, _a;
        var sb = [];
        try {
            for (var _b = __values(DecodedBitStreamParser.POSTCODE_3_BYTES), _c = _b.next(); !_c.done; _c = _b.next()) {
                var p3bytes = _c.value;
                sb.push(DecodedBitStreamParser.SETS[0].charAt(DecodedBitStreamParser.getInt(bytes, p3bytes)));
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return sb.join('');
    };
    DecodedBitStreamParser.getMessage = function (bytes, start, len) {
        var sb = [];
        var shift = -1;
        var set = 0;
        var lastset = 0;
        for (var i = start; i < start + len; i++) {
            var c = DecodedBitStreamParser.SETS[set].charAt(bytes[i]);
            switch (c) {
                case DecodedBitStreamParser.LATCHA:
                    set = 0;
                    shift = -1;
                    break;
                case DecodedBitStreamParser.LATCHB:
                    set = 1;
                    shift = -1;
                    break;
                case DecodedBitStreamParser.SHIFTA:
                case DecodedBitStreamParser.SHIFTB:
                case DecodedBitStreamParser.SHIFTC:
                case DecodedBitStreamParser.SHIFTD:
                case DecodedBitStreamParser.SHIFTE:
                    lastset = set;
                    set = c.charCodeAt(0) - DecodedBitStreamParser.SHIFTA.charCodeAt(0);
                    shift = 1;
                    break;
                case DecodedBitStreamParser.TWOSHIFTA:
                    lastset = set;
                    set = 0;
                    shift = 2;
                    break;
                case DecodedBitStreamParser.THREESHIFTA:
                    lastset = set;
                    set = 0;
                    shift = 3;
                    break;
                case DecodedBitStreamParser.NS: {
                    var nsval = (bytes[++i] << 24) + (bytes[++i] << 18) + (bytes[++i] << 12) + (bytes[++i] << 6) + bytes[++i];
                    sb.push(String(nsval).padStart(9, '0'));
                    break;
                }
                case DecodedBitStreamParser.LOCK:
                    shift = -1;
                    break;
                default:
                    sb.push(c);
            }
            if (shift-- === 0) {
                set = lastset;
            }
        }
        // Strip trailing PAD characters
        while (sb.length > 0 && sb[sb.length - 1] === DecodedBitStreamParser.PAD) {
            sb.pop();
        }
        return sb.join('');
    };
    DecodedBitStreamParser.SHIFTA = '\uFFF0';
    DecodedBitStreamParser.SHIFTB = '\uFFF1';
    DecodedBitStreamParser.SHIFTC = '\uFFF2';
    DecodedBitStreamParser.SHIFTD = '\uFFF3';
    DecodedBitStreamParser.SHIFTE = '\uFFF4';
    DecodedBitStreamParser.TWOSHIFTA = '\uFFF5';
    DecodedBitStreamParser.THREESHIFTA = '\uFFF6';
    DecodedBitStreamParser.LATCHA = '\uFFF7';
    DecodedBitStreamParser.LATCHB = '\uFFF8';
    DecodedBitStreamParser.LOCK = '\uFFF9';
    DecodedBitStreamParser.ECI = '\uFFFA';
    DecodedBitStreamParser.NS = '\uFFFB';
    DecodedBitStreamParser.PAD = '\uFFFC';
    DecodedBitStreamParser.FS = '\u001C';
    DecodedBitStreamParser.GS = '\u001D';
    DecodedBitStreamParser.RS = '\u001E';
    DecodedBitStreamParser.COUNTRY_BYTES = [53, 54, 43, 44, 45, 46, 47, 48, 37, 38];
    DecodedBitStreamParser.SERVICE_CLASS_BYTES = [55, 56, 57, 58, 59, 60, 49, 50, 51, 52];
    DecodedBitStreamParser.POSTCODE_2_LENGTH_BYTES = [39, 40, 41, 42, 31, 32];
    DecodedBitStreamParser.POSTCODE_2_BYTES = [33, 34, 35, 36, 25, 26, 27, 28, 29, 30, 19,
        20, 21, 22, 23, 24, 13, 14, 15, 16, 17, 18, 7, 8, 9, 10, 11, 12, 1, 2];
    DecodedBitStreamParser.POSTCODE_3_BYTES = [
        [39, 40, 41, 42, 31, 32],
        [33, 34, 35, 36, 25, 26],
        [27, 28, 29, 30, 19, 20],
        [21, 22, 23, 24, 13, 14],
        [15, 16, 17, 18, 7, 8],
        [9, 10, 11, 12, 1, 2],
    ];
    /* tslint:disable:max-line-length */
    DecodedBitStreamParser.SETS = [
        '\rABCDEFGHIJKLMNOPQRSTUVWXYZ' + DecodedBitStreamParser.ECI + DecodedBitStreamParser.FS + DecodedBitStreamParser.GS + DecodedBitStreamParser.RS + DecodedBitStreamParser.NS + ' ' + DecodedBitStreamParser.PAD +
            '"#$%&\'()*+,-./0123456789:' + DecodedBitStreamParser.SHIFTB + DecodedBitStreamParser.SHIFTC + DecodedBitStreamParser.SHIFTD + DecodedBitStreamParser.SHIFTE + DecodedBitStreamParser.LATCHB,
        '`abcdefghijklmnopqrstuvwxyz' + DecodedBitStreamParser.ECI + DecodedBitStreamParser.FS + DecodedBitStreamParser.GS + DecodedBitStreamParser.RS + DecodedBitStreamParser.NS + '{' + DecodedBitStreamParser.PAD +
            '}~\u007F;<=>?[\\]^_ ,./:@!|' + DecodedBitStreamParser.PAD + DecodedBitStreamParser.TWOSHIFTA + DecodedBitStreamParser.THREESHIFTA + DecodedBitStreamParser.PAD +
            DecodedBitStreamParser.SHIFTA + DecodedBitStreamParser.SHIFTC + DecodedBitStreamParser.SHIFTD + DecodedBitStreamParser.SHIFTE + DecodedBitStreamParser.LATCHA,
        '\u00C0\u00C1\u00C2\u00C3\u00C4\u00C5\u00C6\u00C7\u00C8\u00C9\u00CA\u00CB\u00CC\u00CD\u00CE\u00CF\u00D0\u00D1\u00D2\u00D3\u00D4\u00D5\u00D6\u00D7\u00D8\u00D9\u00DA' +
            DecodedBitStreamParser.ECI + DecodedBitStreamParser.FS + DecodedBitStreamParser.GS + DecodedBitStreamParser.RS + DecodedBitStreamParser.NS +
            '\u00DB\u00DC\u00DD\u00DE\u00DF\u00AA\u00AC\u00B1\u00B2\u00B3\u00B5\u00B9\u00BA\u00BC\u00BD\u00BE\u0080\u0081\u0082\u0083\u0084\u0085\u0086\u0087\u0088\u0089' +
            DecodedBitStreamParser.LATCHA + ' ' + DecodedBitStreamParser.LOCK + DecodedBitStreamParser.SHIFTD + DecodedBitStreamParser.SHIFTE + DecodedBitStreamParser.LATCHB,
        '\u00E0\u00E1\u00E2\u00E3\u00E4\u00E5\u00E6\u00E7\u00E8\u00E9\u00EA\u00EB\u00EC\u00ED\u00EE\u00EF\u00F0\u00F1\u00F2\u00F3\u00F4\u00F5\u00F6\u00F7\u00F8\u00F9\u00FA' +
            DecodedBitStreamParser.ECI + DecodedBitStreamParser.FS + DecodedBitStreamParser.GS + DecodedBitStreamParser.RS + DecodedBitStreamParser.NS +
            '\u00FB\u00FC\u00FD\u00FE\u00FF\u00A1\u00A8\u00AB\u00AF\u00B0\u00B4\u00B7\u00B8\u00BB\u00BF\u008A\u008B\u008C\u008D\u008E\u008F\u0090\u0091\u0092\u0093\u0094' +
            DecodedBitStreamParser.LATCHA + ' ' + DecodedBitStreamParser.SHIFTC + DecodedBitStreamParser.LOCK + DecodedBitStreamParser.SHIFTE + DecodedBitStreamParser.LATCHB,
        '\u0000\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008\u0009\n\u000B\u000C\r\u000E\u000F\u0010\u0011\u0012\u0013\u0014\u0015\u0016\u0017\u0018\u0019\u001A' +
            DecodedBitStreamParser.ECI + DecodedBitStreamParser.PAD + DecodedBitStreamParser.PAD + '\u001B' + DecodedBitStreamParser.NS + DecodedBitStreamParser.FS + DecodedBitStreamParser.GS + DecodedBitStreamParser.RS +
            '\u001F\u009F\u00A0\u00A2\u00A3\u00A4\u00A5\u00A6\u00A7\u00A9\u00AD\u00AE\u00B6\u0095\u0096\u0097\u0098\u0099\u009A\u009B\u009C\u009D\u009E' +
            DecodedBitStreamParser.LATCHA + ' ' + DecodedBitStreamParser.SHIFTC + DecodedBitStreamParser.SHIFTD + DecodedBitStreamParser.LOCK + DecodedBitStreamParser.LATCHB,
    ];
    return DecodedBitStreamParser;
}());
exports.default = DecodedBitStreamParser;
