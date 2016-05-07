interface NodeSelector {
    querySelector(selectors: string): HTMLElement;
    querySelectorAll(selectors: string): NodeListOf<HTMLElement>;
}
declare namespace NodalRequire {
    type Module = {
        __dirname: string;
        __filename: string;
        address: string;
        definition: string;
        error?: Error;
        exports: ModuleExports;
        constructor: ModuleConstructor;
        isInitialised: boolean;
        type: ModuleType;
    };
    type ModuleConstructor = (require: ModuleRequirer, exports: ModuleExports, module: Module, __filename: string, __dirname: string) => void;
    type ModuleRegistry = {
        [index: string]: Module;
    };
    type ModuleExports = {
        [index: string]: any;
    };
    type ModuleType = "nodal" | "local" | "functional";
    type ModuleCachingFrequency = "" | "auto" | "never" | "minutely" | "hourly" | "daily";
    type ModuleRequirer = (id: string) => any;
    var cachingFrequency: ModuleCachingFrequency;
    function requireAsync(parameters: {
        doAsResponse?: (parameters: {
            module?: Module;
            id: string;
        }) => void;
        definition?: string;
        id: string;
        originAddress?: string;
    }): any;
    function resolveAddress(parameters: {
        id: string;
        originAddress?: string;
    }): string;
}
