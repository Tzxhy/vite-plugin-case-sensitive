import fs from 'fs';
import debounce from 'lodash.debounce';
import path from 'path';

export type Conf = {
    /** 当前工作目录。默认为process.cwd() */
    cwd?: string;
}

type DirCacheObj = {
    originPath: string;
    files: string[];
}

type PluginContext = {
    error(error: string | Error, position?: number | {column: number; line: number}): never;
    warn(warning: string, position?: number | {column: number; line: number}): never;
}
export default (conf: Conf) => {
    const cwd = conf.cwd ?? process.cwd();

    const cache = new Map<string, DirCacheObj>();

    function clearCache() {
        cache.clear();
    }

    /** 从某一级开始进行缓存 */
    function cacheFromDir(dirs: string[]) {
        dirs.forEach((dir) => {
            if (/node_modules/.test(dir)) return;
            const dirStat = fs.statSync(dir);
            if (dirStat.isDirectory()) { // 目录
                const dirents = fs.readdirSync(dir, {
                    withFileTypes: true,
                });
                const conf: DirCacheObj = {
                    files: [],
                    originPath: dir,
                };
                const dirList: string[] = [];
                dirents.forEach((i) => {
                    if (i.isFile()) {
                        conf.files.push(i.name);
                    } else { // 目录，
                        dirList.push(path.join(dir, i.name));
                    }
                });
                cache.set(dir, conf);
                if (dirList.length) {
                    cacheFromDir(dirList);
                }
            }
        });
    }

    const cb = debounce((e: 'rename' | 'change', _f: string) => {
        if (e === 'rename') {
            clearCache();
            cacheFromDir([cwd]);
        }
    }, 0);
    fs.watch(cwd, {
        recursive: true,
    }, cb);

    cacheFromDir([cwd]);

    function normalizePath(p: string) {
        if (p.includes('?')) return p.slice(0, p.indexOf('?'));
        return p;
    }
    enum FindRet {
        NO_KEY,
        HAS,
        HASNOT,
    }
    /** 大小写敏感，查找是否存在 */
    function findPathCaseSensitive(filePath: string): FindRet {
        filePath = normalizePath(filePath);
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath);
        if (!cache.has(dir)) { // 无记录
            return FindRet.NO_KEY;
        }
        // 有记录，看是否
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const conf = cache.get(dir)!;
        return conf.files.includes(basename) ? FindRet.HAS : FindRet.HASNOT;
    }

    return {
        name: 'case-sensitive',
        moduleParsed(this: PluginContext, info: {id: string}): void {
            const { id } = info;
            if (id.includes(cwd)) {
                if (findPathCaseSensitive(id) !== FindRet.HAS) {
                    this.error(`发现大小写不一致或文件不存在：\t${id}`);
                }
            }
        },
        transform(this: PluginContext, code: string, id: string) {
            if (id.includes(cwd)) {
                if (findPathCaseSensitive(id) !== FindRet.HAS) {
                    this.error(`发现大小写不一致或文件不存在：\t${id}`);
                }
            }
            return code;
        },
    };
};
