"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils = (function () {
    function Utils() {
        this.trimMultiline = function (multiline) {
            return multiline
                .split('\n')
                .map(function (line) { return line.trim(); })
                .filter(function (line) { return line.length > 0; })
                .join('').trim();
        };
        this.escapeURIComponent = function (input) {
            return encodeURIComponent(input.replace(/'/g, '%27'));
        };
    }
    Utils.prototype.isOnPrem = function (url) {
        return url.indexOf('.sharepoint.com') === -1 && url.indexOf('.sharepoint.cn') === -1;
    };
    Utils.prototype.isUrlHttps = function (url) {
        return url.split('://')[0].toLowerCase() === 'https';
    };
    Utils.prototype.isUrlAbsolute = function (url) {
        return url.indexOf('http:') === 0 || url.indexOf('https:') === 0;
    };
    Utils.prototype.combineUrl = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return args.join('/').replace(/(\/)+/g, '/').replace(':/', '://');
    };
    return Utils;
}());
exports.Utils = Utils;
//# sourceMappingURL=index.js.map