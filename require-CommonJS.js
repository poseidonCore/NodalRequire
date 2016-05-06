var Require;
(function (Require) {
    // Define variables:
    var baseElement = void 0;
    var baseScriptTag = void 0; // this variable is reused for a number of things to reduce the repetition of strings. In the end is becomes "exports"
    var doAsResponse = void 0;
    var globalEval = void 0;
    var hostAddress = "";
    var loaderAddress = "";
    var mainScriptAddress = "";
    var moduleAddress = "";
    var moduleId = "";
    var moduleOriginAddress = "";
    var moduleRegistry = void 0;
    var queue = void 0;
    var relativeElement = void 0;
    // Initialise variables:
    queue = [];
    moduleRegistry = {};
    globalEval = eval; // This ensures that the evaludation of the module definition is in the global context.
    loaderAddress = window.location.protocol + "//" + window.location.host + window.location.pathname.slice(0, window.location.pathname.lastIndexOf("/"));
    hostAddress = window.location.protocol + "//" + window.location.host;
    // Create HTML elements to use in finding absolute addresses:
    baseElement = document.createElement("base");
    relativeElement = document.createElement("a");
    document.head.appendChild(baseElement);
    // Get mainScriptAddress:
    baseScriptTag = document.querySelector("script[data-main]"); // TODO: This accidentally select same property from another script tag. //
    if (baseScriptTag) {
        mainScriptAddress = baseScriptTag.dataset["main"];
        requireAsync({ id: mainScriptAddress, originAddress: loaderAddress });
    }
    // ---------- ---------- ----------
    function requireFromAddress(parameters) {
        // Declare variables:
        var address = "";
        var id = "";
        var module = void 0;
        var originAddress = "";
        var request = void 0;
        // Initilise variables:
        id = parameters.id;
        originAddress = parameters.originAddress || "";
        // If there is no valid id, then abort:
        if (typeof id != "string" || id == null) {
            // Check the queue:
            checkQueue();
            // Abort:
            return;
        }
        // Resolve the address:
        address = resolveAddress({ id: id, originAddress: originAddress });
        // If the module is already inloadQueue, then abort:
        if (queue.indexOf(address) >= 0) {
            // Check the queue:
            checkQueue();
            // Abort:
            return;
        }
        // Add the module to the queue and register it:
        queue.push(address);
        module = parameters.aliasRegistration || {};
        module.exports = {};
        module.address = address;
        module.__filename = address;
        module.__dirname = address.slice(0, module.address.lastIndexOf("/"));
        module.type = id[0] == "." || id.slice(0, 7) == "http://" || id.slice(0, 8) == "https://"
            ? "local"
            : "node";
        moduleRegistry[address] = module;
        // Create the module loader:
        request = new XMLHttpRequest();
        request.responseType = "text";
        request.onload = processDefinition;
        request.onerror = processError;
        // Send the request:
        try {
            request.open("GET", address, true); // POST helps to avoid caching issues, but may be slightly slower than GET adn have incompatibilities.
            request.send();
        }
        catch (e) {
            window.alert(e.message);
        }
        // Return a reference to this module:
        return module;
        // ---------- ---------- ----------
        function processDefinition(event) {
            // Declare variables:
            var definition = "";
            var queueIndex = 0;
            // If there was a response or there is a already module definition:
            if (request.status == 200) {
                // If there was no definition, then use an empty definition:
                if (request.responseText != null)
                    definition = request.responseText;
                module.definition = definition;
                // Queue any requirements:
                queueRequirements({
                    definition: definition,
                    originAddress: address.slice(0, address.lastIndexOf("/"))
                });
                // Remove this module from the queue:
                queueIndex = queue.indexOf(module.address);
                queue.splice(queueIndex, 1);
                // Check the load queue:
                checkQueue();
            }
            else {
                processError(event);
            }
        }
        function processError(event) {
            // Declare variables:
            var newAddress = "";
            var queueIndex = 0;
            // Remove this module from the queue:
            queueIndex = queue.indexOf(module.address);
            queue.splice(queueIndex, 1);
            // Form the parent address:
            newAddress = resolveAddress({ id: id, originAddress: originAddress + "/.." });
            // If this is not a node module, then alert and abort:
            if (module.type != "node"
                || newAddress == address) {
                module.error = new Error("processError: (" + request.status + ") Can't find " + module.address);
                window.alert(module.error.message);
                return;
            }
            // Use the current module registration as the new registration:
            requireFromAddress({
                id: id,
                originAddress: originAddress + "/..",
                aliasRegistration: module
            });
        }
    }
    // ---------- ---------- ----------
    function requireFromRegistry(parameters) {
        /*
            This assumes that the modules have all been registered for a relevant module.
            Modules may be called at different points but resolve to the same registration if they are found in the lineage of node_modules.
            This assumes that originAddress is fully resolved (eg http://domain:port/folder/folder).
            This is a fully synchronous function that assumes that the module is already loaded.
        */
        // Declare variables:
        var address = "";
        var id = "";
        var module = void 0;
        var originAddress = "";
        // Initilise variables:
        id = parameters.id;
        originAddress = parameters.originAddress || "";
        // If there is no id, then return null:
        if (typeof id != "string" || id == null)
            return null;
        // Form the address:
        address = resolveAddress({ originAddress: originAddress, id: id });
        // Get the module:
        module = moduleRegistry[address];
        if (module == null) {
            window.alert("Can't resolve module " + address);
            return null;
        }
        // Initialised the module:
        initialiseModule({ module: module });
        // Return the exports for this module:
        return module.exports;
    }
    // ---------- ---------- ----------
    function initialiseModule(parameters) {
        // Declare variables:
        var module = void 0;
        // Initialise variables:
        module = parameters.module;
        // Initialise the module only if necessary:
        if (!module.isInitialised) {
            // Form the factory:
            module.factory = globalEval("(function(require, exports, module, __filename, __dirname){"
                + module.definition
                + "\n}) // source: " + module.address);
            // Execute the module:
            module.factory.apply(module.exports, [
                require,
                module.exports,
                module,
                module.__filename,
                module.__dirname
            ]);
            module.isInitialised = true;
        }
        // ---------- ---------- ----------
        function require(id) {
            return requireFromRegistry({ originAddress: module.__dirname, id: id });
        }
    }
    // ---------- ---------- ----------
    function requireFromFactory(parameters) {
        /*
            This currently assumes that the factory is fully resolved and already has required any requirements.
            Therefore, it will return synchronously and not add to the queue.
        */
        // Declare variables:
        var address = "";
        var module = void 0;
        // Initialise variables:
        address = resolveAddress({ id: parameters.id, originAddress: parameters.originAddress });
        module = {};
        // Create the module:
        module.address = address;
        module.__filename = address;
        module.__dirname = address.slice(0, module.address.lastIndexOf("/"));
        module.type = "function";
        module.exports = {};
        module.factory = parameters.factory;
        // Register this module:
        moduleRegistry[address] = module;
        // Execute the responseFunction:
        if (typeof doAsResponse == "function" && doAsResponse != null)
            setTimeout(doAsResponse, 10, [{ module: module, id: moduleId }]);
        // Clear the current module details:
        moduleId = "";
        moduleAddress = "";
        doAsResponse = null;
        // Initialised the module:
        initialiseModule({ module: module });
    }
    Require.requireFromFactory = requireFromFactory;
    // ---------- ---------- ----------
    function checkQueue() {
        // Declare variables:
        var module = void 0;
        if (queue.length == 0) {
            // Initialise variables:
            module = moduleRegistry[moduleAddress];
            // Execute the responseFunction:
            if (typeof doAsResponse == "function" && doAsResponse != null)
                setTimeout(doAsResponse, 10, [{ module: module, id: moduleId }]);
            // Clear the current module details:
            moduleId = "";
            moduleAddress = "";
            doAsResponse = null;
            // Initialised the module:
            initialiseModule({ module: module });
        }
    }
    // ---------- ---------- ----------
    function queueRequirements(parameters) {
        // Declare variables:
        var definition = "";
        var originAddress = "";
        var requirements = [];
        // Regulate variables:
        if (parameters == null || typeof parameters != "object")
            return;
        if (parameters.originAddress == null || typeof parameters.originAddress != "string" || parameters.originAddress == "")
            return;
        if (parameters.definition == null || typeof parameters.definition != "string" || parameters.definition == "")
            return;
        // initialise variables:
        definition = parameters.definition;
        originAddress = parameters.originAddress;
        // Get all of the requirements:		
        definition.replace(/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function (substring, id) {
            requirements.push(id);
            return id;
        });
        // If there are no matches, then abort:
        if (requirements.length == 0)
            return;
        // Queue all of the requirements:
        requirements.forEach(function (value, index, array) {
            requireFromAddress({
                id: value,
                originAddress: originAddress
            });
        });
    }
    // ---------- ---------- ----------
    function resolveAddress(parameters) {
        /*
            It attempts to simply find the module that best matches the path.
            Modules with a relative address starting with an alphanumeric are considered to be global.
            Modules with a relative address starting with ./ are in the base address folder.
            Modules with a relative address starting with ../ are in the base address parent folder.
            ##### TODO: Modules with a relative address starting with / are in the loader folder. #####
            The loader address is the address of the page that starts the process.
        */
        // Declare variables:
        var address = "";
        var baseAddress = "";
        var id = "";
        var originAddress = "";
        // Initilise variables:
        id = parameters.id;
        originAddress = parameters.originAddress || "";
        baseAddress = baseElement.href;
        // If there is no id, then return null:
        if (typeof id != "string" || id == null)
            return null;
        // If id is fully resolved, then return it as the address:
        if (id.slice(0, 7) == "http://" || id.slice(0, 8) == "https://") {
            // Return the address:
            return id.toLocaleLowerCase();
        }
        // If id is in originAddress, then reform it:
        if (id.slice(0, 2) == "./") {
            id = id.slice(2);
        }
        else if (id.slice(0, 3) != "../") {
            id = "node_modules/" + id;
        }
        // Use id relative to the origin address:
        baseAddress = baseElement.href;
        baseElement.href = originAddress;
        relativeElement.href = originAddress + "/" + id + ".js";
        address = relativeElement.href;
        baseElement.href = baseAddress;
        // Return the address:
        return address.toLocaleLowerCase();
    }
    Require.resolveAddress = resolveAddress;
    // ---------- ---------- ----------
    function requireAsync(parameters) {
        // Declare variables:
        var address = "";
        var id = "";
        var originAddress = "";
        // Initilise variables:
        id = parameters.id;
        originAddress = parameters.originAddress || "";
        // Localise the response function:
        doAsResponse = parameters.doAsResponse;
        moduleId = id;
        moduleOriginAddress = originAddress;
        moduleAddress = resolveAddress({ originAddress: originAddress, id: id });
        // Initialise variables:
        if (typeof parameters.factory == "function" && parameters.factory != null) {
            // Get the exports from the supplied factory:
            requireFromFactory({
                id: id,
                originAddress: originAddress,
                factory: parameters.factory
            });
        }
        else {
            requireFromAddress({
                id: id,
                originAddress: originAddress
            });
        }
    }
    Require.requireAsync = requireAsync;
})(Require || (Require = {}));
//# sourceMappingURL=require-CommonJS.js.map