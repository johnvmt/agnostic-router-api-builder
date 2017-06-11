var AgnosticRouter = require('agnostic-router');
var Utils = require('./Utils');
module.exports = {
	_sanitizeArgumentConfig: function(argumentConfigDirty) {
		var argumentConfigDefault = {level: 0};
		var argumentConfigSanitized = Utils.objectMerge(argumentConfigDefault, argumentConfigDirty);
		if(typeof argumentConfigSanitized.source == 'undefined')
			argumentConfigSanitized.source = [];
		else if(!Array.isArray(argumentConfigSanitized.source))
			argumentConfigSanitized.source = [argumentConfigSanitized.source];
		return argumentConfigSanitized;
	},
	// Generate an object with functions
	toObject: function(apiConfig, callback) {
		var self = this;
		var object = {};

		// Get UrlPattern
		var router = AgnosticRouter();
		var UrlPattern = router.UrlPattern;

		Utils.objectForEach(apiConfig, function(functionConfig, functionName) {
			if(typeof functionConfig.pattern != 'string')
				throw new Error('pattern_undefined');

			var urlPattern = new UrlPattern(functionConfig.pattern);
			var argumentsConfig = Array.isArray(functionConfig.arguments) ? functionConfig.arguments : [];

			object[functionName] = function() {
				// Get callback (last argument)
				var argumentsArray = Array.prototype.slice.call(arguments);
				if(argumentsArray.length > 0 && typeof argumentsArray[argumentsArray.length - 1] == 'function')
					var functionCallback = argumentsArray.pop();

				var parsedFunctionArguments = Utils.parseArgs(argumentsArray, argumentsConfig);
				var requestArguments = {};

				argumentsConfig.forEach(function(argumentConfig) {
					var argumentConfigSanitized = self._sanitizeArgumentConfig(argumentConfig);
					Utils.objectSet(requestArguments, argumentConfigSanitized.source.concat([argumentConfigSanitized.name]), parsedFunctionArguments[argumentConfigSanitized.name]);
				});

				var urlPath = urlPattern.stringify(requestArguments.params);
				callback(functionName, urlPath, requestArguments, functionCallback);
			};
		});

		return object;
	},
	toRouter: function(apiConfig, targetObject, router) {
		var self = this;
		if(typeof router != 'object')
			router = AgnosticRouter();

		Utils.objectForEach(apiConfig, function(functionConfig, functionName) {
			if(typeof functionConfig.pattern != 'string')
				throw new Error('pattern_undefined');

			router.use(functionConfig.pattern, function(request, respond, next) {

				var parsedArgs = [];
				if(Array.isArray(functionConfig.arguments)) {
					functionConfig.arguments.forEach(function(argumentConfig) { // Loop over arguments of function
						var argumentConfigSanitized = self._sanitizeArgumentConfig(argumentConfig);
						var argumentRequestPath = argumentConfigSanitized.source.concat(argumentConfigSanitized.name);
						if(argumentConfigSanitized.level == 0 || Utils.objectIsset(request, argumentRequestPath)) // argument is required or exists
							parsedArgs.push(Utils.objectGet(request, argumentRequestPath)); // add the argument to the array to pass
					});
				}

				targetObject[functionName].apply(targetObject, parsedArgs.concat([respond])); // Add the callback at the end
			});
		});

		return router;
	}
};