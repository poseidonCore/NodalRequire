/*
	NodalRequire attempts to mimic some of the environmental behaviours of the CommonJS/Node.js function require.
	The term 'nodal' is used because it is only node-like and this abstraction does not recreate all of the normal Node.js functionality or behaviours.

	FUNCTIONALITY ------------------------------------------------------------------------------------
	NodalRequire attempts to simply find the module that best matches the path.
	Modules with a relative address starting with an alphanumeric are considered to be node modules.
	Modules with a relative address starting with ./ are search from the origin address folder.
	Modules with a relative address starting with ../ are search from the origin address parent folder.
	##### TODO: Modules with a relative address starting with / are searched from the loader folder. #####
	The loader address is the address of the page that starts the process.

	The address is formed from 2 parts: 
		id: as found in require(id) normally; eg require("nodeModule"), require("./localModule"), require("./folder/thisModule"), require("../folder/thisModule")
		originAddress: where to start searching for the module.

	Local modules do not search the lineage and if they are not found, then an error is generated.

	Functional modules are given a function programmatically and an id and originAddress that resolves to an address, which forms the moduleRegistry index.
	This means that functional modules are able to overwrite existing modules or be formed abstractly without loading a local file.
	If a new entry overwrites an existing registration, then it does not disconnect the current references from previously executed require() statements,
	and so this behaviour can lead to inconsistent effects.

	Nodal modules are searched from the resolved paths 
		1. "originAddress/id/../node_modules/id.js"
		2. "originAddress/id/../../node_modules/id.js"
		3. keep ascending the lineage until there is no more lineage.
	This is slightly more generous than Node.js, which does not usually search the immediate folder but instead starts with the parent folder (ie step 2).
	When a match is found, all previous search paths are aliased to it to avoid having to search those paths again.
	This means that a node module can have multiple registry entries that all reference the final module registration.

	INSTALLATION -----------------------------------------------------------------------------------
	Install NodalRequire.js in a reachable path from your HTML document.
	Include code like this in the HTML header BEFORE calling ANY scripts that rely on require(): 
		<script src="{pathFromHtmlDoc}/NodalRequire.js" data-main=startModuleId></script>
		eg <script src="scripts/NodalRequire.js" data-main="./modules/main"></script>
	Here startModuleId is relative to the HTML document (the loader) and NOT NodalRequire.js.
		eg startModuleId = "./main".

	USAGE ------------------------------------------------------------------------------------------
	When the script tag is processed, it will hand control over to NodalRequire.js, which will attempt to load startModuleId as its first module.
	All code that needs require() should be launched out of this start module.
	If you dynamically load in new code at later that needs require(), just use code like this to create a handover:
		NodalRequire.requireAsync({
			id:%some id%,
			originAddress:%some absolute address or relative to loader%,
			doAsResponse:%some callback%
		});
	eg
		NodalRequire.requireAsync({
			id:"./myModule",
			originAddress:"",
			doAsResponse:cb
		});

	This will execute the required module after all of its dependencies are loaded, and optionally callback to the calling script.

	PRELOADING ---------------------------------------------------------------------------------------
	There is no support for programmatic preloading currently (ie NodalRequire.preLoad), which would load a module but not execute it.
	You can achieve this effect by simply noting these modules in the start module somewhere.

	CACHING ------------------------------------------------------------------------------------------
	You can influence (but not completely control) module browser caching by setting NodalRequire.cachingFrequency:
		""|"auto": This does not include a search string in the load request and leaves the behaviour to the browser.
		"never": This includes a different random search string in the load request to help avoid any browser caching.
		"minutely"|"hourly"|"daily": This changed the search string in the load request by rounding down the current time to help avoid any browser caching.
	Using a time factor can help to ensure that new module definitions are used more often, but that near-recurrent visits don't have a load impost.

	CODE STYLE ---------------------------------------------------------------------------------------
	NodalRequire is written in TypeScript and transpiled into JavaScript.
	The JavaScript is not minned because some people don't read TypeScript.
	You should therefore apply your own min techniques because the coding style is intentionally verbose.
	Some stylistic features (such as variable priming at declaration) are designed to help optimise JIT compilation.

	LICENCE ------------------------------------------------------------------------------------------
	This code is freeware. You may use it in your projects and reuse it as you please,
	as long as you accept that there is no liability accepted by myself or the publisher for its effects.
	If you do not accept this condition, then don't use it and pay a programmer for their work. 
*/

namespace NodalRequire {
	// Define types:
		export type Module = {
			__dirname:string; // The registered address of the folder containing the module's (lower case).
			__filename:string; // Alias for address.
			address:string; // The registered address of this module (lower case).
			definition:string; // The text of the module's definition.
			error?:Error; // Any error loading the module.
			exports:any; // The exports of the module. This is used for 'this' in binding.
			factory:Factory; // A function used to form the module closure = factory.toString() = definition.
			isInitialised:boolean; // When the all of module's requirements are loaded, it can be initialised upon first call.
			type:"nodal"|"local"|"functional"; // "nodal": sourced from a node_module folder along the caller's lineage; "local": sourced via a file path ('./'. '../', 'http://', etc); "functional": defined dynamically.
		};

		export type Factory = (
			require:(id:string)=>any, 
			exports:any, 
			module:Module, 
			__filename:string, 
			__dirname:string
		)=>any;

	// Define types:
		type ModuleRegistry = {
			[index:string]:Module;
		};

	// Define variables:
		export var cachingFrequency:""|"auto"|"never"|"minutely"|"hourly"|"daily" = ""; // How the caching string is formed. "auto"|"" imply no caching intervention.
		var baseElement:HTMLBaseElement = void 0; // This is used for address resolution.
		var baseScriptTag:HTMLElement = void 0; // This is used for address resolution.
		var doAsResponse:Function = void 0; // This is set by requireAsync and is executed after all requirements are loaded, then cleared.
		var globalEval:(script:string)=>any = void 0; // This ensures that the evaludation of the module definition is in the global context.
		var hostAddress:string = ""; // The address of the host of the HTML page that called requireAsync.
		var loaderAddress:string = ""; // The address of the HTML page that called requireAsync.
		var mainScriptAddress:string = ""; // This is set in the HTML page: eg <script src="scripts/require-CommonJS.js" data-main="./modules/main"></script>
		var moduleAddress:string = ""; // This is set by requireAsync and is executed after all requirements are loaded, then cleared.
		var moduleId:string = ""; // This is set by requireAsync and is executed after all requirements are loaded.
		var moduleOriginAddress:string = ""; // This is set by requireAsync and is executed after all requirements are loaded.
		var moduleRegistry:ModuleRegistry = void 0; // The registry is indexed by canonical address (absolute address, lower case, no backsteps).
		var queue:string[] = void 0; // The queue is dynamically expanded as new requirements are discovered, and when empty then any moduleId is executed.
		var relativeElement:HTMLAnchorElement = void 0; // This is used for address resolution.

	// Set configuration:
		cachingFrequency = "never";

	// Initialise variables:
		queue = [];
		moduleRegistry = <ModuleRegistry>{};
		globalEval = eval; 
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
			requireAsync({id:mainScriptAddress, originAddress:loaderAddress});
		}

	// ---------- ---------- ----------

	export function requireAsync (parameters:{
		doAsResponse?:(parameters:{module?:Module, id:string})=>void;
		factory?:Factory;
		id:string;
		originAddress?:string;
	}):any {
		// Declare variables:
			var address:string = "";
			var id:string = "";
			var originAddress:string = "";

		// Regulate parameters:
			if (parameters == null || typeof parameters != "object") {
				// Alert and abort:
					window.alert("NodalRequire.requireAsync: No parameters supplied.");
					return;
			}
			if (parameters.id == null || typeof parameters.id != "string") {
				// Alert and abort:
					window.alert("NodalRequire.requireAsync: No id supplied.");
					return;
			}

		// Initilise variables:
			id = parameters.id;
			originAddress = parameters.originAddress || "";

		// Localise the response function:
			doAsResponse = parameters.doAsResponse;
			moduleId = id;
			moduleOriginAddress = originAddress;
			moduleAddress = resolveAddress({originAddress:originAddress, id:id});

		// Initialise variables:
			if (typeof parameters.factory == "functional" && parameters.factory != null) {
				// Get the exports from the supplied factory:
					requireFromFactory({
						id:id,
						originAddress:originAddress,
						factory:parameters.factory
					});
			} else {
					requireFromAddress({
						id:id,
						originAddress:originAddress
					});
			}
	}
		
	// ---------- ---------- ----------

	function requireFromAddress (parameters:{
		aliasRegistration?:Module; // This allows modules at different addresses to be linked (eg node modules).
		id:string;
		originAddress:string; 
	}):Module {
		// Declare variables:
			var address:string = "";
			var cachingDate:Date = void 0;
			var cachingString:string = "";
			var id:string = "";
			var module:Module = void 0;
			var originAddress:string = "";
			var request:XMLHttpRequest = void 0;

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
			address = resolveAddress({id:id, originAddress:originAddress});

		// If the module is already inloadQueue, then abort:
			if (queue.indexOf(address) >= 0) {
				// Check the queue:
					checkQueue();
					
				// Abort:
					return;
			}

		// Add the module to the queue and register it:
			queue.push(address);
			module = parameters.aliasRegistration || <Module>{}; 
			module.exports = {};
			module.address = address;
			module.__filename = address;
			module.__dirname = address.slice(0, module.address.lastIndexOf("/"));
			module.type = id[0] == "." || id.slice(0, 7) == "http://" || id.slice(0, 8) == "https://"
				? "local"
				: "nodal"
			moduleRegistry[address] = module;

		// Create the module loader:
			request = new XMLHttpRequest();
			request.responseType = "text";
			request.onload = processDefinition;
			request.onerror = processError;

		// Form the cache string:
			if (cachingFrequency == "never") {
				cachingString = Math.random().toString();
			} else if (cachingFrequency == "minutely") {
				cachingDate = new Date();
				cachingDate.setMinutes(0, 0, 0);
				cachingString = cachingDate.valueOf().toString();
			} else if (cachingFrequency == "hourly") {
				cachingDate = new Date();
				cachingDate.setHours(0, 0, 0, 0);
				cachingString = cachingDate.valueOf().toString();
			} else if (cachingFrequency == "daily") {
				cachingDate = new Date();
				cachingDate.setDate(0);
				cachingDate.setHours(0, 0, 0, 0);
				cachingString = cachingDate.valueOf().toString();
			}
			if (cachingString != "") cachingString = "?cache=" + cachingString;

		// Catch comm issues (eg security, synchronicity):
			try {
				// Send the request asynchronously:
				// Using POST helps to avoid caching issues, but may be slightly slower than GET and have incompatibilities.
				// Adding a search string may aleviate caching issues. The caching string is not stored.
					request.open("GET", address + cachingString, true);
					request.send();
			} catch (error) {
				// Alert and store the error:
					window.alert("NodalRequire.requireFromAddress: Can't load module: \n" + address + "\n" + error.toString());
					module.error = error;
			}

		// Return a reference to this module:
			return module;

		// ---------- ---------- ----------

		function processDefinition (event:Event):void {
			// Declare variables:
				var definition:string = "";
				var queueIndex:number = 0;

			// If there was a response or there is a already module definition:
				if (request.status == 200) {
					// If there was no definition, then use an empty definition:
						if (request.responseText != null) definition = request.responseText;
						module.definition = definition;

					// Queue any requirements:
						queueRequirements({
							definition:definition,
							originAddress:address.slice(0, address.lastIndexOf("/"))
						});

					// Remove this module from the queue:
						queueIndex = queue.indexOf(module.address);
						queue.splice(queueIndex, 1);

					// Check the load queue:
						checkQueue();
				} 
			// Otherwise alert and abort:
				else {
					processError(event);
				}
		}

		function processError (event:Event):void {
			// Declare variables:
				var newAddress:string = "";
				var queueIndex:number = 0;

			// Remove this module from the queue:
				queueIndex = queue.indexOf(module.address);
				queue.splice(queueIndex, 1);

			// Form the parent address:
				newAddress = resolveAddress({id:id, originAddress:originAddress + "/.."});

			// If this is not a node module, then alert and abort:
				if (
					module.type != "nodal" // Local modules do not search lineage.
					|| newAddress == address // We have run out of lineage.
				) {
					// Store the error, alert, and abort:
						module.error = new Error("NodalRequire.requireFromAddress.processError: (HTTP status " + request.status + ") Can't find module:\n" + module.address);
						window.alert(module.error.message);
						return;
				}

			// Use the current module registration as the new registration:
				requireFromAddress({
					id:id,
					originAddress:originAddress + "/..",
					aliasRegistration:module
				});
		}
	}

	// ---------- ---------- ----------

	function requireFromRegistry (parameters:{
		id:string;
		originAddress:string;
	}):any {
		/*
			This assumes that the modules have all been registered for a relevant module.
			Modules may be called at different points but resolve to the same registration if they are found in the lineage of node_modules.
			This assumes that originAddress is fully resolved (eg http://domain:port/folder/folder).
			This is a fully synchronous function that assumes that the module is already loaded.
		*/

		// Declare variables:
			var address:string = "";
			var id:string = "";
			var module:Module = void 0;
			var originAddress:string = "";
			
		// Initilise variables:
			id = parameters.id;
			originAddress = parameters.originAddress || "";

		// If there is no id, then return null:
			if (typeof id != "string" || id == null) {
				// Alert and abort:
					window.alert("NodalRequire.requireFromRegistry: Calling unidentified module:\n" + originAddress + "/" + id);
					return;
			}

		// Form the address:
			address = resolveAddress({originAddress:originAddress, id:id});

		// Get the module:
			module = moduleRegistry[address];
			if (module == null) {
				// Alert and abort:
					window.alert("NodalRequire.requireFromRegistry: Calling unregistered module:\n" + address);
					return;
			}

		// Initialised the module:
			initialiseModule({module:module});

		// Return the exports for this module:
			return module.exports;
	}

	// ---------- ---------- ----------

	function initialiseModule (parameters:{
		module:Module;
	}):void {
		// Declare variables:
			var module:Module = void 0;

		// Initialise variables:
			module = parameters.module;

		// Initialise the module only if necessary:
			if (!module.isInitialised) {
				// Enclosing in brackets to ensure that a function is returned.
				// Catch syntax errors: eg function(...){do(); } doAgain();}:
					try {
						// Form the factory globally (if eval were used, then initialiseModule would be used as the evaluation context):
							module.factory = globalEval(
								"(function (require, exports, module, __filename, __dirname) {" 
								+ module.definition 
								+ "\n}) // source: " + module.address
							);

						// Catch evaluation errors (eg 1 = 2; Globa.somthing.othr = 5):
							try {
								// Execute the module:
									module.factory.apply(
										module.exports,
										[
											require,
											module.exports,
											module,
											module.__filename,
											module.__dirname
										]
									);
							} catch (error) {
								// Alert and store error:
									window.alert("NodalRequire.initialiseModule:\n" + module.address + "\n" + error.toString());
									module.error = error;
							}
					} catch (error) {
						// Alert and store error:
							window.alert("NodalRequire.initialiseModule:\n" + module.address + "\n" + error.toString());
							module.error = error;
					}

				// Mark the module as initialised regardless of errors:
					module.isInitialised = true;
			}

		// ---------- ---------- ----------

		function require (id:string):any {
			return requireFromRegistry({originAddress:module.__dirname, id:id});
		}
	}

	// ---------- ---------- ----------

	export function requireFromFactory (parameters:{
		id:string;
		factory:Factory;
		originAddress?:string;
	}):void {
		/*
			This currently assumes that the factory is fully resolved and already has required any requirements.
			Therefore, it will return synchronously and not add to the queue.
		*/

		// Declare variables:
			var address:string = "";
			var module:Module = void 0;

		// Initialise variables:
			address = resolveAddress({id:parameters.id, originAddress:parameters.originAddress});
			module = <Module>{};

		// Create the module:
			module.address = address;
			module.__filename = address;
			module.__dirname = address.slice(0, module.address.lastIndexOf("/"));
			module.type = "functional";
			module.exports = {};
			module.factory = parameters.factory;

		// Register this module:
			moduleRegistry[address] = module;

		// Execute the responseFunction:
			if (typeof doAsResponse == "functional" && doAsResponse != null) setTimeout(doAsResponse, 10, [{module:module, id:moduleId}]);

		// Clear the current module details:
			moduleId = "";
			moduleAddress = "";
			doAsResponse = null;

		// Initialised the module:
			initialiseModule({module:module});
	}

	// ---------- ---------- ----------

	function checkQueue ():void {
		// Declare variables:
			var module:Module = void 0;

		if (queue.length == 0) {
		// Initialise variables:
			module = moduleRegistry[moduleAddress];
				
		// Execute the responseFunction:
			if (typeof doAsResponse == "functional" && doAsResponse != null) setTimeout(doAsResponse, 10, [{module:module, id:moduleId}]);

		// Clear the current module details:
			moduleId = "";
			moduleAddress = "";
			doAsResponse = null;

		// Initialised the module:
			initialiseModule({module:module});
		}
	}

	// ---------- ---------- ----------

	function queueRequirements (parameters:{
		definition:string;
		originAddress:string;
	}) {
		// Declare variables:
			var definition:string = "";
			var originAddress:string = "";
			var requirements:string[] = [];
			
		// Regulate variables:
			if (parameters.originAddress == null || typeof parameters.originAddress != "string" || parameters.originAddress == "") return;
			if (parameters.definition == null || typeof parameters.definition != "string" || parameters.definition == "") return;

		// initialise variables:
			definition = parameters.definition;
			originAddress = parameters.originAddress;

		// Get all of the requirements:		
			definition.replace(
				/(?:^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, 
				function (substring:string, id:string) {
					requirements.push(id);
					return id;
				}
			);

		// If there are no matches, then abort:
			if (requirements.length == 0) return;

		// Queue all of the requirements:
			requirements.forEach(
				function (value:string, index:number, array:string[]) {
					requireFromAddress({
						id:value,
						originAddress:originAddress
					});
				}
			);

	}

	// ---------- ---------- ----------

	export function resolveAddress (parameters:{
		id:string; 
		originAddress:string;
	}):string {
		// Declare variables:
			var address:string = "";
			var baseAddress:string = "";
			var id:string = "";
			var originAddress:string = "";
			
		// Initilise variables:
			id = parameters.id;
			originAddress = parameters.originAddress || "";
			baseAddress = baseElement.href;

		// If there is no id, then return null:
			if (typeof id != "string" || id == null) return null;
			
		// If id is fully resolved, then return it as the address:
			if (id.slice(0, 7) == "http://" || id.slice(0, 8) == "https://") {
				// Return the address:
					return id.toLocaleLowerCase();
			} 

		// If id is in originAddress, then reform it:
			if (id.slice(0, 2) == "./") {
				id = id.slice(2);
			} 
		// If id is a node module, then look for it in node_modules:
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
}
