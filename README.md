NodalRequire attempts to mimic some of the environmental behaviours of the CommonJS/Node.js function require.
The term 'nodal' is used because it is only node-like and this abstraction does not recreate all of the 
normal Node.js functionality or behaviours.

######FUNCTIONALITY ------------------------------------------------------------------------------------
NodalRequire attempts to simply find the module that best matches the path.
Modules with a relative address starting with an alphanumeric are considered to be node modules.
Modules with a relative address starting with ./ are search from the origin address folder.
Modules with a relative address starting with ../ are search from the origin address parent folder.
[##### TODO: Modules with a relative address starting with / are searched from the loader folder. #####]
The loader address is the address of the page that starts the process.
The address is formed from 2 parts: 
```
	id: as found in require(id) normally; eg require("nodeModule"), require("./localModule"), 
		require("./folder/thisModule"), require("../folder/thisModule")
	originAddress: where to start searching for the module.
```
Local modules do not search the lineage and if they are not found, then an error is generated.

Functional modules are given a function programmatically and an id and originAddress that resolves to an '
address, which forms the moduleRegistry index.
This means that functional modules are able to overwrite existing modules or be formed abstractly without 
loading a local file.
If a new entry overwrites an existing registration, then it does not disconnect the current references from 
previously executed require() statements, and so this behaviour can lead to inconsistent effects.

Nodal modules are searched from the resolved paths 
	1. "originAddress/id/../node_modules/id.js"
	2. "originAddress/id/../../node_modules/id.js"
	3. keep ascending the lineage until there is no more lineage.
This is slightly more generous than Node.js, which does not usually search the immediate folder but instead 
starts with the parent folder (ie step 2).
When a match is found, all previous search paths are aliased to it to avoid having to search those paths again.
This means that a node module can have multiple registry entries that all reference the final module registration.

######INSTALLATION -----------------------------------------------------------------------------------
Install NodalRequire.js in a reachable path from your HTML document.
Include code like this in the HTML header BEFORE calling ANY scripts that rely on require(): 
```
	<script src="{pathFromHtmlDoc}/NodalRequire.js" data-main=startModuleId></script>
	eg <script src="scripts/NodalRequire.js" data-main="./modules/main"></script>
```
Here startModuleId is relative to the HTML document (the loader) and NOT NodalRequire.js.
	eg startModuleId = "./main".

######USAGE ------------------------------------------------------------------------------------------
When the script tag is processed, it will hand control over to NodalRequire.js, which will attempt to load 
startModuleId as its first module.
All code that needs require() should be launched out of this start module.
If you dynamically load in new code at later that needs require(), just use code like this to create a handover:
```
	NodalRequire.requireAsync({
		id:%some id%,
		originAddress:%some absolute address or relative to loader%,
		doAsResponse:%some callback%
	});
```
eg
```
	NodalRequire.requireAsync({
		id:"./myModule",
		originAddress:"",
		doAsResponse:cb
	});
```
This will execute the required module after all of its dependencies are loaded, and optionally callback to 
the calling script.

######PRELOADING ---------------------------------------------------------------------------------------
There is no support for programmatic preloading currently (ie NodalRequire.preLoad), which would load a 
module but not execute it.
You can achieve this effect by simply noting these modules in the start module somewhere.

######CACHING ------------------------------------------------------------------------------------------
You can influence (but not completely control) module browser caching by setting NodalRequire.cachingFrequency:
	""|"auto": This does not include a search string in the load request and leaves the behaviour to the browser.
	"never": This includes a different random search string in the load request to help avoid any browser caching.
	"minutely"|"hourly"|"daily": This changed the search string in the load request by rounding down the current 
		time to help avoid any browser caching.
Using a time factor can help to ensure that new module definitions are used more often, but that near-recurrent 
visits don't have a load impost.

######CODE STYLE ---------------------------------------------------------------------------------------
NodalRequire is written in TypeScript and transpiled into JavaScript.
The JavaScript is not minned because some people don't read TypeScript.
You should therefore apply your own min techniques because the coding style is intentionally verbose.
Some stylistic features (such as variable priming at declaration) are designed to help optimise JIT compilation.

######LICENCE ------------------------------------------------------------------------------------------
This code is freeware. You may use it in your projects and reuse it as you please,
as long as you accept that there is no liability accepted by myself or the publisher for its effects.
If you do not accept this condition, then don't use it and instead pay a programmer for their work. 
