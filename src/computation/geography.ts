import { Geodesic } from 'geographiclib-geodesic'
import type { Coordinate } from '../domain/coordinate'

const WGS84 = Geodesic.WGS84

//function for typescript  - result as number issue
function requireValue(
    value: number | undefined,
    name: string,
      ): number {
    if (value == undefined) {
    throw new Error(`Geodesic result missing: ${name}`)

      //throwing error when result is undefined
    }
  return value
}



export function distanceBetween(   // fxn for distance Between
  a: Coordinate,
  b: Coordinate,
): number {
  const result = WGS84.Inverse(
    a.latitude,
    a.longitude,
    b.latitude,
    b.longitude,
  )

  return requireValue(result.s12 , 'distance')
}

export function initialBearing(  //fxn for bearing
  a: Coordinate,
  b: Coordinate,
): number {
  const result = WGS84.Inverse(
    a.latitude,
    a.longitude,
    b.latitude,
    b.longitude,
  )

  const azimuth = requireValue(result.azi1, 'initialBearing')

return (azimuth + 360) % 360

}

export function destinationPoint(  //fxn for destinationPoint
  origin: Coordinate,
  distance: number,
  bearing: number,
): Coordinate {
  const result = WGS84.Direct(
    origin.latitude,
    origin.longitude,
    bearing,
    distance,
  )

return {
  latitude: requireValue(result.lat2, 'latitude'),
  longitude: requireValue(result.lon2, 'longitude'),
}
                            
}
