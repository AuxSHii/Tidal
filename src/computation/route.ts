//computations for routes

import type { Route } from '../domain/route'
import  { routeSegments } from './routeSegments'
import { segmentGeometry } from './segmentGeometry'

 
export function routeDistance(route: Route): number {  //take route and calc total  geodesicdist inbtw
	const segments = routeSegments(route)  //give the route segment for following route

	let totalDistance = 0     //accumulator initfrom zero

	for (const segment of segments) {
		totalDistance += segmentGeometry(segment).distance //find out distance for every segment point in total segments
//of a route found above!!
}


    return totalDistance 
}