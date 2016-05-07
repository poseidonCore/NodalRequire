<style type="text/css">
 p	{
	margin-bottom:.0001pt;
	font-size:10.0pt;
	font-family:monospace;
	margin-left:0cm;
	margin-right:0cm;
	margin-top:0cm;
}
</style>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NodalRequire attempts to mimic some of the environmental behaviours of the CommonJS/Node.js function require.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; The term 'nodal' is used because it is only node-like and this abstraction does not recreate all of the normal Node.js functionality or behaviours.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; FUNCTIONALITY ------------------------------------------------------------------------------------<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NodalRequire attempts to simply find the module that best matches the path.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Modules with a relative address starting with an alphanumeric are considered to be node modules.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Modules with a relative address starting with ./ are search from the origin address folder.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Modules with a relative address starting with ../ are search from the origin address parent folder.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ##### TODO: Modules with a relative address starting with / are searched from the loader folder. #####<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; The loader address is the address of the page that starts the process.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; The address is formed from 2 parts: <o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; id: as found in require(id) normally; eg require("nodeModule"), require("./localModule"), require("./folder/thisModule"), require("../folder/thisModule")<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; originAddress: where to start searching for the module.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Local modules do not search the lineage and if they are not found, then an error is generated.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Functional modules are given a function programmatically and an id and originAddress that resolves to an address, which forms the moduleRegistry index.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; This means that functional modules are able to overwrite existing modules or be formed abstractly without loading a local file.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; If a new entry overwrites an existing registration, then it does not disconnect the current references from previously executed require() statements,<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; and so this behaviour can lead to inconsistent effects.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Nodal modules are searched from the resolved paths <o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 1. "originAddress/id/../node_modules/id.js"<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 2. "originAddress/id/../../node_modules/id.js"<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 3. keep ascending the lineage until there is no more lineage.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; This is slightly more generous than Node.js, which does not usually search the immediate folder but instead starts with the parent folder (ie step 2).<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; When a match is found, all previous search paths are aliased to it to avoid having to search those paths again.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; This means that a node module can have multiple registry entries that all reference the final module registration.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; INSTALLATION -----------------------------------------------------------------------------------<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Install NodalRequire.js in a reachable path from your HTML document.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Include code like this in the HTML header BEFORE calling ANY scripts that rely on require(): <o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &lt;script src="{pathFromHtmlDoc}/NodalRequire.js" data-main=startModuleId&gt;&lt;/script&gt;<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; eg &lt;script src="scripts/NodalRequire.js" data-main="./modules/main"&gt;&lt;/script&gt;<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Here startModuleId is relative to the HTML document (the loader) and NOT NodalRequire.js.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; eg startModuleId = "./main".<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; USAGE ------------------------------------------------------------------------------------------<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; When the script tag is processed, it will hand control over to NodalRequire.js, which will attempt to load startModuleId as its first module.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; All code that needs require() should be launched out of this start module.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; If you dynamically load in new code at later that needs require(), just use code like this to create a handover:<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NodalRequire.requireAsync({<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; id:%some id%,<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; originAddress:%some absolute address or relative to loader%,<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; doAsResponse:%some callback%<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; });<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; eg<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NodalRequire.requireAsync({<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; id:"./myModule",<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; originAddress:"",<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; doAsResponse:cb<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; });<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; This will execute the required module after all of its dependencies are loaded, and optionally callback to the calling script.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; PRELOADING ---------------------------------------------------------------------------------------<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; There is no support for programmatic preloading currently (ie NodalRequire.preLoad), which would load a module but not execute it.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; You can achieve this effect by simply noting these modules in the start module somewhere.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CACHING ------------------------------------------------------------------------------------------<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; You can influence (but not completely control) module browser caching by setting NodalRequire.cachingFrequency:<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ""|"auto": This does not include a search string in the load request and leaves the behaviour to the browser.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "never": This includes a different random search string in the load request to help avoid any browser caching.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; "minutely"|"hourly"|"daily": This changed the search string in the load request by rounding down the current time to help avoid any browser caching.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Using a time factor can help to ensure that new module definitions are used more often, but that near-recurrent visits don't have a load impost.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CODE STYLE ---------------------------------------------------------------------------------------<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NodalRequire is written in TypeScript and transpiled into JavaScript.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; The JavaScript is not minned because some people don't read TypeScript.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; You should therefore apply your own min techniques because the coding style is intentionally verbose.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Some stylistic features (such as variable priming at declaration) are designed to help optimise JIT compilation.<o:p></o:p></span></p>
<p><span><o:p>&nbsp;</o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; LICENCE ------------------------------------------------------------------------------------------<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; This code is freeware. You may use it in your projects and reuse it as you please,<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; as long as you accept that there is no liability accepted by myself or the publisher for its effects.<o:p></o:p></span></p>
<p><span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; If you do not accept this condition, then don't use it and instead pay a programmer for their work.</span><o:p></o:p></p>

