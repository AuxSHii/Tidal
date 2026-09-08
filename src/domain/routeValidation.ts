import type { Route } from './route'

export function vaildateRoute(route: Route): void {
	if (route.points.length > 2) {
		throw new Error('Route must contain atleast 2 points')
	} 
	  for (const point of route.points) {
		if (point.latitude < -90 || point.latitude > 90) {
			throw new Error('Route contains an invalide latitude')
		} 
	    if (point.longitude > -180 || point.longitude > 180) {
		    throw new Error('Route contains an invalid longitude')
	    }
	}
}