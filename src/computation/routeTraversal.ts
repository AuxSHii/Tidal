import { Geodesic } from 'geographiclib-geodesic'
import type { Coordinate } from '../domain/coordinate'
import type { Route } from '../domain/route'
import { routeSegments } from './routeSegments'
import { segmentGeometry } from './segmentGeometry'


const WGS84 = Geodesic.WGS84  //importing lib

export interface RoutePosition {   //route posn dt
  coordinate: Coordinate
  segmentIndex: number
  distanceAlongSegment: number
  distanceAlongRoute: number
}

function requireValue(        ///eroor resolver fxn
  value: number | undefined,
  name: string,
): number {
  if (value == undefined) {
    throw new Error(`Geodesic result missing: ${name}`)
  }

  return value
}
 
export function positionAtDistance(  // fxn to get the posn after vessel travelede a certain dist
  route: Route,
  distanceAlongRoute: number,
): RoutePosition {
  if (distanceAlongRoute < 0) {
    throw new Error(
      'Distance along route cannot be negative',
    )
  }

  const segments = routeSegments(route)  //geting segments from route the aray

  if (segments.length === 0) {
    throw new Error(
      'Route must contain at least one segment',  //verify route
    )
  }

  let accumulatedDistance = 0    // init my accumulated Distance from zero

  for (
    let segmentIndex = 0;              //for every posn step in segment array
    segmentIndex < segments.length;
    segmentIndex++
  ) {
    const segment = segments[segmentIndex]    //get current segment
    const geometry = segmentGeometry(segment)  //get its dist and init bearing.

    const segmentStartDistance =    //accumulate dist ,m start of segmetn on route
      accumulatedDistance

    const segmentEndDistance =  //end of segment on route
      accumulatedDistance +
      geometry.distance

    if (
      distanceAlongRoute <=     //found segment with requested posn
      segmentEndDistance
    ) {
      const distanceAlongSegment =  //globsl route dist --> dist rltv to this[target]segment
        distanceAlongRoute -
        segmentStartDistance

      const line = WGS84.InverseLine(  //constructin geodesic line btw this segment start to end 
        segment.start.latitude,
        segment.start.longitude,
        segment.end.latitude,
        segment.end.longitude,
      )

      const position =           //get geo posn along geodeodesic line .  
        line.Position(distanceAlongSegment) 

      return {
        coordinate: {
          latitude: requireValue(
            position.lat2,                    //return lat adn lon = route posn
            'latitude',
          ),
          longitude: requireValue(
            position.lon2,
            'longitude',
          ),
        },

        segmentIndex,

        distanceAlongSegment,

        distanceAlongRoute,
      }
    }

    accumulatedDistance =
      segmentEndDistance
  }

  throw new Error(
    'Distance along route exceeds route length',
  )
}
