export declare type Conf = {
    /** 当前工作目录。默认为process.cwd() */
    cwd?: string;
};
declare type PluginContext = {
    error(error: string | Error, position?: number | {
        column: number;
        line: number;
    }): never;
    warn(warning: string, position?: number | {
        column: number;
        line: number;
    }): never;
};
declare const _default: (conf: Conf) => {
    name: string;
    moduleParsed(this: PluginContext, info: {
        id: string;
    }): void;
    transform(this: PluginContext, code: string, id: string): string;
};
export default _default;
