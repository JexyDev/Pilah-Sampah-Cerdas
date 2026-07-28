"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasNavigator = hasNavigator;
exports.canEnumerateDevices = canEnumerateDevices;
/**
 * If navigator is present.
 */
function hasNavigator() {
    return typeof navigator !== 'undefined';
}
/**
 * If mediaDevices under navigator is supported.
 */
function isMediaDevicesSupported() {
    return hasNavigator() && !!navigator.mediaDevices;
}
/**
 * If enumerateDevices under navigator is supported.
 */
function canEnumerateDevices() {
    return !!(isMediaDevicesSupported() && navigator.mediaDevices.enumerateDevices);
}
//# sourceMappingURL=navigator-utils.js.map