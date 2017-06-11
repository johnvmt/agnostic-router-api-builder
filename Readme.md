# API Builder for Agnostic Router #
Generate a router for a given class, using a config

Or generate an object that will then pass arguments to its functions to a router (e.g.: Create an object of functions in the browser, to match the object available on the server)

## TODOs ##

- Generate config automatically from JSDoc

## Methods ##

### toObject ###
function(apiConfig, callback)

callback(functionName, urlPath, requestArguments, functionCallback);

### toRouter ###
function(apiConfig, targetObject, [router])

## Usage ##

	// Shared config, on the server and client
	var apiConfig = {
		"lookup": {
			"pattern": "/lookup",
			"arguments": [
				{"name": "title", "level": 0, "source": "query"},
				{"name": "author", "level": 1, "source": "query"}
			]
		}
	};

	// On the server
	var apiObject = {
		lookup: function() {
			if(arguments.length == 3) { // title, author, callback
				if(arguments[0] == 'War and Peace' && arguments[1] == 'Leo Tolstoy')
					arguments[2](null, '0140447938');
				else
					arguments[2]('not_found', null);
			}
		}
	};

	// Generate a router
	var router = ApiRouter.toRouter(apiConfig, apiObject);

	// Call from the client, through a public-facing interface (e.g.: HTTP server)
	router.route('request', '/lookup', {query: {title: 'War and Peace', author: 'Leo Tolstoy'}}, function(error, isbn) {
		if(error)
			throw new Error('Function returned error');
		if(isbn != '0140447938')
			throw new Error('Function returned wrong result');
		console.log('Found the right book');
	});
	
	// On the client
	function routeCallback(functionName, apiPath, request, callback) {
		// Make a conenction to the public interface here
		// Call callback when done
	}

	var apiObject = ApiRouter.toObject(apiConfig, routeCallback);

	apiObject.lookup('War and Peace', 'Leo Tolstoy', function(error, isbn) {
		if(error)
			throw new Error(error);
		console.log("The requested book has ISBN", isbn);
	});