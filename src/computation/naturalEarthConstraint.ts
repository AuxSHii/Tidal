import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { MultiPolygon } from '../domain/geography/multiPolygon'
import { LandSpatialIndex } from './landSpatialIndex'

export class NaturalEarthLandConstraint
  implements GeographicConstraint
{

  private readonly spatialIndex: LandSpatialIndex

  constructor(land: MultiPolygon) {
 
    this.spatialIndex = new LandSpatialIndex(land.polygons)
  }

  isAllowed(coordinate: Coordinate): boolean {
    const point = {
      type: 'Point' as const,
      coordinates: [
        coordinate.longitude,
        coordinate.latitude,
      ],
    }

    const candidates = this.spatialIndex.search(
      coordinate.longitude,
      coordinate.latitude,
    )

    for (const polygon of candidates) {
      const polygonFeature = {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            polygon.outer.map((point) => [
              point.longitude,
              point.latitude,
            ]),
            ...polygon.holes.map((hole) =>
              hole.map((point) => [
                point.longitude,
                point.latitude,
              ]),
            ),
          ],
        },
      }

      if (booleanPointInPolygon(point, polygonFeature)) {
        return false
      }
    }

    return true
  }
}
