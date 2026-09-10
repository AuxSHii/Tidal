import type { Coordinate } from '../domain/coordinate'
import type { Route } from '../domain/route'
import type { RouteSegment } from '../domain/routeSegment'
import { sampleGeodesic } from './geodesicSampling'

export function generateBaselineRoute(
  start: Coordinate,
  end: Coordinate,
  spacing: number = 10000,
): Route {
  const segment: RouteSegment = {  //create a straight geodesic segment of route
    start,
    end,
  }

  const points = sampleGeodesic(segment, spacing) //array of co-ord from that straight geodesic segment

  return {
    points,
  }
}
