import type { RouteSegment } from '../domain/routeSegment'
import { distanceBetween , initialBearing } from './geography'  //geometry for segment
//segment has bearing and distance btw for now
export interface SegmentGeometry {
	distance: number
    initialBearing: number
}

export function segmentGeometry(segment: RouteSegment,): SegmentGeometry {
	return{
		distance: distanceBetween(segment.start , segment.end,),
		initialBearing: initialBearing(segment.start , segment.end,),
	}
}