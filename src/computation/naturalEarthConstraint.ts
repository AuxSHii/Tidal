import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type { Feature, Polygon as TurfPolygon } from 'geojson'
import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { MultiPolygon } from '../domain/geography/multiPolygon'
import { LandSpatialIndex } from './landSpatialIndex'


export class NaturalEarthLandConstraint
  implements GeographicConstraint
{
  private readonly spatialIndex: LandSpatialIndex
  private readonly features = new WeakMap<
    import('../domain/geography/polygon').Polygon,
    Feature<TurfPolygon>
  >()

  // Remember geographic results for coordinates already checked.
  private readonly allowedCache = new Map<
    string,
    boolean
  >()

  // Total time spent searching the RBush index.
  private rbushTime = 0

  // Total time spent running Turf point-in-polygon checks.
  private turfTime = 0

  constructor(land: MultiPolygon) {
    this.spatialIndex = new LandSpatialIndex(land.polygons)

    for (const polygon of land.polygons) {
      this.features.set(polygon, {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
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
      })
    }
  }

  // Create a stable key for a geographic coordinate.
  private coordinateKey(
    coordinate: Coordinate,
  ): string {
    const longitude =
      Math.round(coordinate.longitude * 1e9) / 1e9

    const latitude =
      Math.round(coordinate.latitude * 1e9) / 1e9

    return `${longitude}:${latitude}`
  }

  isAllowed(coordinate: Coordinate): boolean {
    const key = this.coordinateKey(coordinate)

    // Reuse the previous geographic result when possible.
    const cached = this.allowedCache.get(key)

    if (cached !== undefined) {
      return cached
    }

    const point = {
      type: 'Point' as const,
      coordinates: [
        coordinate.longitude,
        coordinate.latitude,
      ],
    }

    // Measure the spatial-index lookup.
    const rbushStart = performance.now()

    const candidates = this.spatialIndex.search(
      coordinate.longitude,
      coordinate.latitude,
    )

    this.rbushTime += performance.now() - rbushStart

    for (const polygon of candidates) {
      const feature = this.features.get(polygon)

      if (!feature) {
        throw new Error(
          'Natural Earth polygon feature not prepared',
        )
      }

      // Measure the exact polygon check.
      const turfStart = performance.now()

      const inside = booleanPointInPolygon(
        point,
        feature,
      )

      this.turfTime += performance.now() - turfStart

      if (inside) {
        this.allowedCache.set(key, false)
        return false
      }
    }

    this.allowedCache.set(key, true)
    return true
  }

  // Return total RBush candidate count.
  getCandidateCount(): number {
    return this.spatialIndex.getCandidateCount()
  }

  // Return total time spent searching RBush.
  getRbushTime(): number {
    return this.rbushTime
  }

  // Return total time spent in Turf point-in-polygon.
  getTurfTime(): number {
    return this.turfTime
  }
}
