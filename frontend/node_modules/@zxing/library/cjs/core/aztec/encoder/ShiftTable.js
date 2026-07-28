"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.SHIFT_TABLE = void 0;
exports.static_SHIFT_TABLE = static_SHIFT_TABLE;
var Arrays_1 = __importDefault(require("../../util/Arrays"));
var C = __importStar(require("./EncoderConstants"));
function static_SHIFT_TABLE(SHIFT_TABLE) {
    var e_1, _a;
    try {
        for (var SHIFT_TABLE_1 = __values(SHIFT_TABLE), SHIFT_TABLE_1_1 = SHIFT_TABLE_1.next(); !SHIFT_TABLE_1_1.done; SHIFT_TABLE_1_1 = SHIFT_TABLE_1.next()) {
            var table = SHIFT_TABLE_1_1.value /*Int32Array*/;
            Arrays_1.default.fill(table, -1);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (SHIFT_TABLE_1_1 && !SHIFT_TABLE_1_1.done && (_a = SHIFT_TABLE_1.return)) _a.call(SHIFT_TABLE_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    SHIFT_TABLE[C.MODE_UPPER][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_LOWER][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_LOWER][C.MODE_UPPER] = 28;
    SHIFT_TABLE[C.MODE_MIXED][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_DIGIT][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_DIGIT][C.MODE_UPPER] = 15;
    return SHIFT_TABLE;
}
exports.SHIFT_TABLE = static_SHIFT_TABLE(Arrays_1.default.createInt32Array(6, 6)); // mode shift codes, per table
