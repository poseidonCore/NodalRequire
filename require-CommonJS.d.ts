declare namespace Require {
    type Module = {
        __dirname: string;
        __filename: string;
        address: string;
        definition: string;
        error?: Error;
        exports: any;
        factory: Factory;
        isInitialised: boolean;
        type: "node" | "local" | "function";
    };
    type Factory = (require: (id: string) => any, exports: any, module: Module, __filename: string, __dirname: string) => any;
    function requireFromFactory(parameters: {
        id: string;
        factory: Factory;
        originAddress?: string;
    }): void;
    function resolveAddress(parameters: {
        id: string;
        originAddress: string;
    }): string;
    function requireAsync(parameters: {
        doAsResponse?: (parameters: {
            module?: Module;
            id: string;
        }) => void;
        factory?: Factory;
        id: string;
        originAddress?: string;
    }): any;
}
