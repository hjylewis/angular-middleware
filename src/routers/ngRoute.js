angular.module('ngRoute.middleware', []).provider('$middleware', $middleware)

.config(['$provide', function configureRouteProvider($provide) {
	// Init resolve:{} to all routes
	$provide.decorator('$route', ['$delegate', function decorateRoute($delegate) {
		// Go through each route & make sure resolve is set on all children
		angular.forEach($delegate.routes, function addResolveObject(route) {
			route.resolve = route.resolve || {};
		});

		// Return the delegate
		return $delegate;
	}]);
}])

.run(['$rootScope', '$route', '$location', '$middleware',
function handleMiddleware($rootScope, $route, $location, $middleware) {
	/**
	 * Handle middleware
	 */
	$rootScope.$on('$routeChangeStart', function routeChangeStarted(event, next, current) {
		next.resolve.middleware = function resolveNextMiddleware() {
			return $middleware(next, next.params);
		};
	});

	/**
	 * Handle redirects from middleware
	 */
	$rootScope.$on('$routeChangeError', function handleMiddlewareRedirects(event, current, previous, rejection) {
		var pattern = /redirectTo\:([^\(]*)(\((\{.*\})\))?/;
		var match;

		// Only proceed if there is a match to the pattern
		if ((match = pattern.exec(rejection)) !== null) {
			// Prevent the route change from working normally
			event.preventDefault();

			// If the redirect route is the same, then just reload
			if ( current.regexp.test(match[1]) ) {
				return $route.reload();
			}

			// The path is new, so go there!
			$location.path(match[1]);
			if (match[3]) {
				var params = JSON.parse(match[3]);
				$location.search(params);
			}
		}
	});
}]);
