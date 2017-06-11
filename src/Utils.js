// Utils module 1.0.11 MINI
var Utils = {};

Utils.objectMerge = function() {
	var merged = {};
	this.objectForEach(arguments, function(argument) {
		for (var attrname in argument) {
			if(argument.hasOwnProperty(attrname))
				merged[attrname] = argument[attrname];
		}
	});
	return merged;
};


Utils.objectFilter = function(object, filter) {
	// filter object properties (children) using filter function
	// similar to array filter function
	var result = {};
	this.objectForEach(object, function(child, property, parent) {
		if(filter(child, property, parent))
			result[property] = child;
	});
	return result;
};

Utils.objectForEach = function(object, callback) {
	// run function on each property (child) of object
	var property;
	for(property in object) { // pull keys before looping through?
		if (object.hasOwnProperty(property))
			callback(object[property], property, object);
	}
};

Utils.objectGet = function(object, keys) {
	var self = this;
	if(keys.length == 0)
		return object;
	else if(typeof object === "object") {
		if((typeof keys[0] === "string" || typeof keys[0] === "number") && object !== null && object.hasOwnProperty(keys[0]))
			return this.objectGet(object[keys[0]], keys.slice(1));
		else if(keys[0] === null) { // get all
			if(Array.isArray(object)) {
				var results = [];
				object.forEach(function(child, key) {
					results[key] = self.objectGet(child, keys.slice(1));
				});
			}
			else {
				var results = {};
				this.objectForEach(object, function(child, key) {
					results[key] = self.objectGet(child, keys.slice(1));
				});
			}
			return results;
		}
		else if(keys[0] instanceof RegExp) { // match keys to regexp
			var results = {};
			this.objectForEach(object, function(child, key) {
				if(key.match(keys[0]))
					results[key] = self.objectGet(child, keys.slice(1));
			});
			return results;
		}
		else if(typeof keys[0] === "function") { // apply a filtering function
			if(object instanceof Array) {
				var results = [];
				object.forEach(function(value, index, parent) {
					if(keys[0](value, index, parent)) // filter function
						results[index] = self.objectGet(value, keys.slice(1));
				});
			}
			else {
				var results = {};
				this.objectForEach(self.objectFilter(object, keys[0]), function(result, key) {
					results[key] = self.objectGet(result, keys.slice(1));
				});
			}
			return results;
		}
		else if(keys[0] instanceof Array) { // all members with keys in array
			if(object instanceof Array) {
				var results = [];
				keys[0].forEach(function(value, index) {
					results[index] = object[index];
				});
			}
			else {
				var results = {};
				this.objectForEach(self.objectFilterProperties(object, keys[0]), function(child, key) {
					results[key] = self.objectGet(child, keys.slice(1));
				});
			}
			return results;
		}
	}
	else
		return;
};

Utils.objectSet = function(object, keys, value) {
	if(keys.length == 1) {
		object[keys[0]] = value;
		return true;
	}
	else {
		if(typeof(object[keys[0]]) === "undefined")
			object[keys[0]] = {}; // set empty object so we can descend into it
		return this.objectSet(object[keys[0]], keys.slice(1), value);
	}
};

Utils.objectIsset = function(object, keys) {
	if(keys.length == 1)
		return (typeof(object[keys[0]]) !== "undefined");
	else if(typeof(object[keys[0]]) === "undefined") // current level doesn't exist
		return false;
	else
		return this.objectIsset(object[keys[0]], keys.slice(1));
};

Utils.parseArgs = function(argsPassed, argsConfig) {
	var matched = {};

	function toLevels(argsConfig, level) {
		if(typeof level !== 'number')
			level = 0;

		var levelsArr = [];

		argsConfig.forEach(function(argConfig) {
			if(Array.isArray(argConfig))
				levelsArr = levelsArr.concat(toLevels(argConfig, level + 1));
			else {
				argConfig.level = level;
				levelsArr.push(argConfig);
			}
		});

		return levelsArr;
	}

	function validArg(argConfig, arg) {
		return typeof argConfig.validate != 'function' || argConfig.validate(arg)
	}

	function requiredLeftEnough(argsConfig, minIndex) {
		for(var index = minIndex; index < argsConfig.length; index++) {
			if(typeof(argsConfig[index]) === 'undefined' || !argsConfig[index].required)
				return true;
		}
		return false;
	}

	var argConfigMin = 0;

	if(!Array.isArray(argsPassed))
		argsPassed = Array.prototype.slice.call(argsPassed);

	argsPassed.forEach(function(arg, index) {
		for(var ctr = argConfigMin; ctr < argsConfig.length; ctr++) {
			if(argsConfig[ctr].required) {
				if(validArg(argsConfig[ctr], arg)) {
					argsConfig[ctr].matched = true;
					matched[argsConfig[ctr].name] = arg;
					argConfigMin++;
					break;
				}
				else
					throw "missing_required";
			}
			else if((!argsConfig[ctr].required && (requiredLeftEnough(argsConfig, ctr) || (argsConfig[ctr].level > argsConfig[ctr - 1].level && argsConfig[ctr - 1].matched))) && validArg(argsConfig[ctr], arg)) {
				argsConfig[ctr].matched = true;
				matched[argsConfig[ctr].name] = arg;
				argConfigMin++;
				break;
			}
			else {
				argsConfig[ctr].matched = false;
				argConfigMin++;
			}
		}
	});

	// Add default options, if set
	argsConfig.forEach(function(argConfig) {
		if(typeof matched[argConfig.name] == 'undefined' && typeof argConfig.default != 'undefined')
			matched[argConfig.name] = argConfig.default;
	});

	return matched;
};

module.exports = Utils;