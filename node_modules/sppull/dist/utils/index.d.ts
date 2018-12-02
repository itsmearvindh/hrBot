export declare class Utils {
    isOnPrem(url: string): boolean;
    isUrlHttps(url: string): boolean;
    isUrlAbsolute(url: string): boolean;
    combineUrl(...args: string[]): string;
    trimMultiline: (multiline: any) => any;
    escapeURIComponent: (input: string) => string;
}
