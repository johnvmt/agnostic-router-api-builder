var assert = require('assert');
var ApiRouter = require('../');

describe('ApiRouter Functions', function() {
	describe('toObject Functions', function() {

		it('Single function, optional argument', function(done) {

			function routeCallback(functionName, apiPath, request, callback) {
				if(functionName != 'lookup')
					throw new Error('Wrong function name');
				if(apiPath != '/lookup')
					throw new Error('Wrong API path name');
				if(typeof request.query != 'object' || request.query == null)
					throw new Error("Query is null");
				if(request.query.title != "War and Peace" || request.query.author != "Leo Tolstoy")
					throw new Error("Wrong query values");
				if(callback != responseCallback)
					throw new Error("Wrong callback");
				done();
			}

			function responseCallback() {
				// Dummy function, for test only
			}

			var apiConfig = {
				"lookup": {
					"pattern": "/lookup",
					"arguments": [
						{"name": "title", "level": 0, "source": "query"},
						{"name": "author", "level": 1, "source": "query"}
					]
				}
			};

			var apiObject = ApiRouter.toObject(apiConfig, routeCallback);

			apiObject.lookup('War and Peace', 'Leo Tolstoy', responseCallback);

		});

	});

	describe('toRouter Functions', function() {
		it('Single function, optional argument', function(done) {

			var apiConfig = {
				"lookup": {
					"pattern": "/lookup",
					"arguments": [
						{"name": "title", "level": 0, "source": "query"},
						{"name": "author", "level": 1, "source": "query"}
					]
				}
			};

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

			var router = ApiRouter.toRouter(apiConfig, apiObject);

			router.route('request', '/lookup', {query: {title: 'War and Peace', author: 'Leo Tolstoy'}}, function(error, isbn) {
				if(error)
					throw new Error('Function returned error');
				if(isbn != '0140447938')
					throw new Error('Function returned wrong result');
				done();
			});

		});
	});




});