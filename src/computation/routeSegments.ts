import type { Route } from '../domain/route'
import type { RouteSegment } from '../domain/routeSegment'

export function routeSegments(route: Route): RouteSegment[] {//return a root segmnt array
    const segments: RouteSegment[] = []

    for (let i = 0 ; i < route.points.length - 1 ; i++) {
    	segments.push({
    		start: route.points[i],
    		end: route.points[i + 1],
    	})
    }
    return segments

}
