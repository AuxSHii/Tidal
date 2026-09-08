//example route to check computations
import type { Route } from '../domain/route' 
import { defaultVessel } from '../domain/vessels/defaultVessel'
import { evaluateRoute } from './routeAnalysis' //fxn to check dist of route
import { routeSegments } from './routeSegments'
import { sampleGeodesic } from './geodesicSampling'
import { segmentGeometry } from './segmentGeometry'

export const exampleRoute: Route = {
  points: [
    {
      latitude: 0,
      longitude: 0,
    },
    {
      latitude: 0,
      longitude: 1,
    },
  ],
}

export const exampleRouteMetrics = evaluateRoute(
  exampleRoute,
  defaultVessel,
)
console.log('Example route metrics:' , exampleRouteMetrics)

export const exampleRouteSegments = routeSegments(exampleRoute,) [0]

export const exampleSegmentGeometry = segmentGeometry(exampleRouteSegments,)

export const exampleSamples = sampleGeodesic(
  routeSegments(exampleRoute)[0],
  25_000,
)