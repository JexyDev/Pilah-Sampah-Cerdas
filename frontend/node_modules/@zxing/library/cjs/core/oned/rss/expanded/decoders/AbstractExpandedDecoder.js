"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var GeneralAppIdDecoder_1 = __importDefault(require("./GeneralAppIdDecoder"));
var AbstractExpandedDecoder = /** @class */ (function () {
    function AbstractExpandedDecoder(information) {
        this.information = information;
        this.generalDecoder = new GeneralAppIdDecoder_1.default(information);
    }
    AbstractExpandedDecoder.prototype.getInformation = function () {
        return this.information;
    };
    AbstractExpandedDecoder.prototype.getGeneralDecoder = function () {
        return this.generalDecoder;
    };
    return AbstractExpandedDecoder;
}());
exports.default = AbstractExpandedDecoder;
