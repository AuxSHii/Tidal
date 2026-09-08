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


//fxn to get the posn after vessel travelede a certain dist

export function positionAtDistance(
  route: Route,
  distanceAlongRoute: number,
): RoutePosition {
  if (distanceAlongRoute < 0) {
    throw new Error(
      'Distance along route cannot be negative',
    )
  }

  const segments = routeSegments(route)

  if (segments.length === 0) {
    throw new Error(
      'Route must contain at least one segment',
    )
  }

  let accumulatedDistance = 0

  for (
    let segmentIndex = 0;
    segmentIndex < segments.length;
    segmentIndex++
  ) {
    const segment = segments[segmentIndex]
    const geometry = segmentGeometry(segment)

    const segmentStartDistance =
      accumulatedDistance

    const segmentEndDistance =
      accumulatedDistance +
      geometry.distance

    // Exact final route endpoint.
    if (
      segmentIndex === segments.length - 1 &&
      distanceAlongRoute >= segmentEndDistance
    ) {
      return {
        coordinate: segment.end,
        segmentIndex,
        distanceAlongSegment: geometry.distance,
        distanceAlongRoute: segmentEndDistance,
      }
    }

    // Position lies within this segment.
    if (
      distanceAlongRoute >=
        segmentStartDistance &&
      distanceAlongRoute <
        segmentEndDistance
    ) {
      const distanceAlongSegment =
        distanceAlongRoute -
        segmentStartDistance

      const line = WGS84.InverseLine(
        segment.start.latitude,
        segment.start.longitude,
        segment.end.latitude,
        segment.end.longitude,
      )

      const position =
        line.Position(distanceAlongSegment)

      return {
        coordinate: {
          latitude: requireValue(
            position.lat2,
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

/* 
segment interior -> current segment
exact waypoint -> next segment
final endpoint -> final segment's end

*/



//fxn for posn at time fxn(speedprofile,route,time-t) ---> position at time-t
import type { SpeedProfile } from '../domain/speedProfile'

export function positionAtTime(
  route: Route,
  profile: SpeedProfile,
  time: number,
): RoutePosition {
  if (time < 0) {
    throw new Error('Time cannot be negative')
  }

  if (time >= profile.totalTime) {
    return positionAtDistance(
      route,
      profile.totalDistance,
    )
  }

  let distanceTravelled = 0

  const accelerationTime =
    profile.acceleration.time

  const cruiseTime =
    profile.cruise.time

  if (time <= accelerationTime) {
    const initialSpeed =
      profile.acceleration.initialSpeed

    const acceleration =
      (profile.acceleration.finalSpeed -
        initialSpeed) /
      accelerationTime

    distanceTravelled =
      initialSpeed * time +
      0.5 * acceleration * time * time
  } else if (
    time <= accelerationTime + cruiseTime
  ) {
    const cruiseElapsed =
      time - accelerationTime

    distanceTravelled =
      profile.acceleration.distance +
      profile.cruise.initialSpeed *
        cruiseElapsed
  } else {
    const decelerationElapsed =
      time -
      accelerationTime -
      cruiseTime

    const initialSpeed =
      profile.deceleration.initialSpeed

    const deceleration =
      (initialSpeed -
        profile.deceleration.finalSpeed) /
      profile.deceleration.time

    distanceTravelled =
      profile.acceleration.distance +
      profile.cruise.distance +
      initialSpeed *
        decelerationElapsed -
      0.5 *
        deceleration *
        decelerationElapsed *
        decelerationElapsed
  }

  return positionAtDistance(
    route,
    distanceTravelled,
  )
}
