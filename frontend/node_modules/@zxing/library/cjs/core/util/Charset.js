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
var CharacterSetECI_1 = __importDefault(require("../common/CharacterSetECI"));
/**
 * Just to make a shortcut between Java code and TS code.
 */
var Charset = /** @class */ (function (_super) {
    __extends(Charset, _super);
    function Charset() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Charset.forName = function (name) {
        return this.getCharacterSetECIByName(name);
    };
    return Charset;
}(CharacterSetECI_1.default));
exports.default = Charset;
