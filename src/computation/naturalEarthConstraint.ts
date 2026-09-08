import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { MultiPolygon } from '../domain/geography/multiPolygon'


export class NaturalEarthLandConstraint
  implements GeographicConstraint
{
  private readonly land: MultiPolygon

  constructor(land: MultiPolygon) {
    this.land = land
  }

  isAllowed(coordinate: Coordinate): boolean {
    const point = {
      type: 'Point' as const,
      coordinates: [
        coordinate.longitude,
        coordinate.latitude,
      ],
    }

    for (const polygon of this.land.polygons) {
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

      if (
        booleanPointInPolygon(
          point,
          polygonFeature,
        )
      ) {
        return false
      }
    }

    return true
  }
}
