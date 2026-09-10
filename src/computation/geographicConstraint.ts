import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { Route } from '../domain/route'
import { routeSegments } from './routeSegments'
import { sampleGeodesic } from './geodesicSampling'

export class PolygonConstraint
  implements GeographicConstraint
{
  private readonly polygon: Coordinate[]  //store polygon boundary pts

  constructor(polygon: Coordinate[]) {   //receiving pts
    if (polygon.length < 3) {
      throw new Error(
        'Polygon must contain at least three points',
      )
    }

    this.polygon = polygon
  }

  isAllowed(coordinate: Coordinate): boolean {   
    let inside = false

    for (
      let i = 0, j = this.polygon.length - 1;  //walk through every polygon edge
      i < this.polygon.length;
      j = i++
    ) {
      const current = this.polygon[i]  //2 end pts of curretn edge
      const previous = this.polygon[j]

      const crossesLongitude =     // checkin ray crosses edge?  
        current.longitude > coordinate.longitude !==        //calc intrxn if croses ray
        previous.longitude > coordinate.longitude

      if (crossesLongitude) {         // latitide where the polygon ray intersect the edge
        const intersectionLatitude =                           
          (previous.latitude - current.latitude) *
            (coordinate.longitude - current.longitude) /
            (previous.longitude - current.longitude) +
          current.latitude

        if (
          coordinate.latitude <  //every time raycrosses boundary flip inside to outside
          intersectionLatitude
        ) {
          inside = !inside
        }
      }
    }

    return !inside              //return true of inside false if outside
  }
}

export interface RouteConstraintViolation {  //route validation against constraint
  segmentIndex: number                        //define to returnsuch
  coordinate: Coordinate
}

export function validateRouteAgainstConstraint(   //fxn to validate given route agains a constr and spacing
  route: Route,
  constraint: GeographicConstraint,
  spacing: number,
  stats? :{ sampleCount: number },
): RouteConstraintViolation | null {
  const segments = routeSegments(route)    //route-: indiv segment

  for (
    let segmentIndex = 0;             //check every segment along geodesic line 
    segmentIndex < segments.length;
    segmentIndex++
  ) {
    const samples = sampleGeodesic(
      segments[segmentIndex],
      spacing,
    )

  if(stats) {
    stats.sampleCount += samples.length
  }

    for (const coordinate of samples) {
      if (!constraint.isAllowed(coordinate)) {
        return {
          segmentIndex,          //voilation
          coordinate,
        }
      }
    }
  }

  return null                       //pass
}
