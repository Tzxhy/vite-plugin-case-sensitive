"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var fs_1 = tslib_1.__importDefault(require("fs"));
var lodash_debounce_1 = tslib_1.__importDefault(require("lodash.debounce"));
var path_1 = tslib_1.__importDefault(require("path"));
exports.default = (function (conf) {
    var _a;
    var cwd = (_a = conf.cwd) !== null && _a !== void 0 ? _a : process.cwd();
    var cache = new Map();
    function clearCache() {
        cache.clear();
    }
    /** 从某一级开始进行缓存 */
    function cacheFromDir(dirs) {
        dirs.forEach(function (dir) {
            if (/node_modules/.test(dir))
                return;
            var dirStat = fs_1.default.statSync(dir);
            if (dirStat.isDirectory()) { // 目录
                var dirents = fs_1.default.readdirSync(dir, {
                    withFileTypes: true,
                });
                var conf_1 = {
                    files: [],
                    originPath: dir,
                };
                var dirList_1 = [];
                dirents.forEach(function (i) {
                    if (i.isFile()) {
                        conf_1.files.push(i.name);
                    }
                    else { // 目录，
                        dirList_1.push(path_1.default.join(dir, i.name));
                    }
                });
                cache.set(dir, conf_1);
                if (dirList_1.length) {
                    cacheFromDir(dirList_1);
                }
            }
        });
    }
    var cb = (0, lodash_debounce_1.default)(function (e, _f) {
        if (e === 'rename') {
            clearCache();
            cacheFromDir([cwd]);
        }
    }, 0);
    fs_1.default.watch(cwd, {
        recursive: true,
    }, cb);
    cacheFromDir([cwd]);
    function normalizePath(p) {
        if (p.includes('?'))
            return p.slice(0, p.indexOf('?'));
        return p;
    }
    var FindRet;
    (function (FindRet) {
        FindRet[FindRet["NO_KEY"] = 0] = "NO_KEY";
        FindRet[FindRet["HAS"] = 1] = "HAS";
        FindRet[FindRet["HASNOT"] = 2] = "HASNOT";
    })(FindRet || (FindRet = {}));
    /** 大小写敏感，查找是否存在 */
    function findPathCaseSensitive(filePath) {
        filePath = normalizePath(filePath);
        var dir = path_1.default.dirname(filePath);
        var basename = path_1.default.basename(filePath);
        if (!cache.has(dir)) { // 无记录
            return FindRet.NO_KEY;
        }
        // 有记录，看是否
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        var conf = cache.get(dir);
        return conf.files.includes(basename) ? FindRet.HAS : FindRet.HASNOT;
    }
    return {
        name: 'case-sensitive',
        moduleParsed: function (info) {
            var id = info.id;
            if (id.includes(cwd)) {
                if (findPathCaseSensitive(id) !== FindRet.HAS) {
                    this.error("\u53D1\u73B0\u5927\u5C0F\u5199\u4E0D\u4E00\u81F4\u6216\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A\t".concat(id));
                }
            }
        },
        transform: function (code, id) {
            if (id.includes(cwd)) {
                if (findPathCaseSensitive(id) !== FindRet.HAS) {
                    this.error("\u53D1\u73B0\u5927\u5C0F\u5199\u4E0D\u4E00\u81F4\u6216\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A\t".concat(id));
                }
            }
            return code;
        },
    };
});
