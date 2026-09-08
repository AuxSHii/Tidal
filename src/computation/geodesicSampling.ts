import { Geodesic } from 'geographiclib-geodesic'
import type { Coordinate } from '../domain/coordinate'
import type { RouteSegment } from '../domain/routeSegment'
import { distanceBetween } from './geography'

const WGS84 = Geodesic.WGS84   //omported lib

function requireValue(      //eroor resolving fxn if lib return undefined values
  value: number | undefined,
  name: string,
): number {
  if (value == undefined) {
    throw new Error(`Geodesic result missing: ${name}`)
  }

  return value
}

export function sampleGeodesic(  // fxn takes route segment and spacing and give the coordinate array of posn[lat , long] of every stop at a constant spacing froma to b in a path!
  segment: RouteSegment,
  spacing: number,
): Coordinate[] {
  if (spacing <= 0) {     //verify spacing
    throw new Error('Sampling spacing must be greater than zero')
  }

  const distance = distanceBetween(  //calc total distance from a to b in a path
    segment.start,
    segment.end,
  )

  const line = WGS84.InverseLine( //construct a geodesic line from the segment = path we have
    segment.start.latitude,                       //start(lat1,long1) to end(lat1,lon1)
    segment.start.longitude,
    segment.end.latitude,
    segment.end.longitude,
  )

  const samples: Coordinate[] = []  //defining our co=ord array

  for (
    let distanceAlong = 0;
    distanceAlong < distance;     // walk through the line in discrete spacing which will give a pt. and find each coordinate=posn of that point 
    distanceAlong += spacing       // then push those posn(lat , lon) of every spaced pt into out co-ord[] array per iteration..
  ) {
    const position = line.Position(distanceAlong)  //geting co-ord ie posn(lat , lon) for each pt.

    samples.push({
      latitude: requireValue(position.lat2, 'latitude'),  //push cord=posn(lat,lon) into co-rd array=samples  
      longitude: requireValue(position.lon2, 'longitude'),
    })
  }

  const finalPosition = line.Position(distance)   //calc posn of final point at total dist

  samples.push({
    latitude: requireValue(finalPosition.lat2, 'latitude'), //pushing final pt posn(lat,lon) into co-ord = posn array =samples
    longitude: requireValue(finalPosition.lon2, 'longitude'),
  })

  return samples  //return the co-ord array of the line=route(with stops atconst spacing) !
}
