import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type { Feature, Polygon as TurfPolygon } from 'geojson'
import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { MultiPolygon } from '../domain/geography/multiPolygon'
import { LandSpatialIndex } from './landSpatialIndex'
import { NaturalEarthNavigationLandMask } from './navigationLandMask'

// Interface for candidate broad-phase checks.
export interface GeographicCandidateConstraint {
  hasLandCandidateInBounds(
    minLongitude: number,
    minLatitude: number,
    maxLongitude: number,
    maxLatitude: number,
  ): boolean
}

export class NaturalEarthLandConstraint
  implements
    GeographicConstraint,
    GeographicCandidateConstraint
{
  private readonly spatialIndex: LandSpatialIndex

  private readonly navigationLandMask:
    NaturalEarthNavigationLandMask

  private readonly features = new WeakMap<
    import('../domain/geography/polygon').Polygon,
    Feature<TurfPolygon>
  >()

  // Remember geographic results for coordinates already checked.
  private readonly allowedCache = new Map<
    string,
    boolean
  >()

  // Cache candidate polygons for navigation-resolution cells.
  private readonly cellCandidateCache =
    new Map<
      string,
      import('../domain/geography/polygon').Polygon[]
    >()

  // Total time spent in the 0.5° navigation land mask.
  private navigationLandMaskTime = 0

  // Total time spent looking up coordinates in the result cache.
  private allowedCacheTime = 0

  // Total time spent preparing/finding cell candidates.
  private candidateLookupTime = 0

  // Total time spent iterating candidate polygons,
  // including Turf calls.
  private candidateCheckTime = 0

  // Total time spent searching the RBush index.
  private rbushTime = 0

  // Total time spent running Turf point-in-polygon checks.
  private turfTime = 0

  private allowedCacheHits = 0
  private allowedCacheMisses = 0

  private cellCandidateCacheHits = 0
  private cellCandidateCacheMisses = 0

  constructor(land: MultiPolygon) {
    this.spatialIndex =
      new LandSpatialIndex(land.polygons)

    this.navigationLandMask =
      new NaturalEarthNavigationLandMask(land)

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

  hasLandCandidateInBounds(
    minLongitude: number,
    minLatitude: number,
    maxLongitude: number,
    maxLatitude: number,
  ): boolean {
    return this.spatialIndex.hasCandidateInBounds(
      minLongitude,
      minLatitude,
      maxLongitude,
      maxLatitude,
    )
  }

  private coordinateKey(
    coordinate: Coordinate,
  ): string {
    const longitude =
      Math.round(
        coordinate.longitude * 1e9,
      ) / 1e9

    const latitude =
      Math.round(
        coordinate.latitude * 1e9,
      ) / 1e9

    return `${longitude}:${latitude}`
  }

  private cellKey(
    coordinate: Coordinate,
  ): string {
    const cellSize = 0.5

    const column = Math.floor(
      (coordinate.longitude + 180) /
        cellSize,
    )

    const row = Math.floor(
      (coordinate.latitude + 90) /
        cellSize,
    )

    return `${column}:${row}`
  }

  private cellBounds(
    coordinate: Coordinate,
  ) {
    const cellSize = 0.5

    const column = Math.floor(
      (coordinate.longitude + 180) /
        cellSize,
    )

    const row = Math.floor(
      (coordinate.latitude + 90) /
        cellSize,
    )

    return {
      minLongitude:
        -180 + column * cellSize,

      maxLongitude:
        -180 + (column + 1) * cellSize,
      minLatitude:
        -90 + row * cellSize,

      maxLatitude:
        -90 + (row + 1) * cellSize,
    }
  }

  mayIntersectLand(
    from: Coordinate,
    to: Coordinate,
    segmentDistance: number,
  ): boolean {
    const earthRadius = 6_371_000

    const angularDistance =
      segmentDistance / earthRadius

    const angularDegrees =
      (angularDistance * 180) / Math.PI

    const latitudePadding =
      angularDegrees / 2

    const minLatitude = Math.max(
      -90,
      Math.min(
        from.latitude,
        to.latitude,
      ) - latitudePadding,
    )

    const maxLatitude = Math.min(
      90,
      Math.max(
        from.latitude,
        to.latitude,
      ) + latitudePadding,
    )

    const latitudeForLongitude =
      Math.min(
        Math.abs(from.latitude),
        Math.abs(to.latitude),
      )

    const cosine =
      Math.cos(
        (latitudeForLongitude * Math.PI) / 180,
      )

    if (cosine <= 0.01) {
      return true
    }

    const longitudePadding =
      latitudePadding / cosine

    let minLongitude =
      Math.min(
        from.longitude,
        to.longitude,
      ) - longitudePadding

    let maxLongitude =
      Math.max(
        from.longitude,
        to.longitude,
      ) + longitudePadding

    if (maxLongitude - minLongitude >= 360) {
      return this.spatialIndex.hasCandidateInBounds(
        -180,
        minLatitude,
        180,
        maxLatitude,
      )
    }

    minLongitude =
      ((minLongitude + 180) % 360 + 360) % 360 - 180

    maxLongitude =
      ((maxLongitude + 180) % 360 + 360) % 360 - 180

    if (minLongitude <= maxLongitude) {
      return this.spatialIndex.hasCandidateInBounds(
        minLongitude,
        minLatitude,
        maxLongitude,
        maxLatitude,
      )
    }

    return (
      this.spatialIndex.hasCandidateInBounds(
        minLongitude,
        minLatitude,
        180,
        maxLatitude,
      ) ||
      this.spatialIndex.hasCandidateInBounds(
        -180,
        minLatitude,
        maxLongitude,
        maxLatitude,
      )
    )
  }

  isAllowed(
    coordinate: Coordinate,
  ): boolean {
    const navigationLandMaskStart =
      performance.now()

    const state =
      this.navigationLandMask.getState(
        coordinate,
      )

    this.navigationLandMaskTime +=
      performance.now() -
      navigationLandMaskStart

    if (state === 'ocean') {
      return true
    }

    const key =
      this.coordinateKey(coordinate)

    const allowedCacheStart =
      performance.now()

    const cached =
      this.allowedCache.get(key)

    this.allowedCacheTime +=
      performance.now() -
      allowedCacheStart

    if (cached !== undefined) {
      this.allowedCacheHits++

      return cached
    }

    this.allowedCacheMisses++

    const point = {
      type: 'Point' as const,
      coordinates: [
        coordinate.longitude,
        coordinate.latitude,
      ],
    }

    const candidateLookupStart =
      performance.now()

    const cellKey =
      this.cellKey(coordinate)

    let candidates =
      this.cellCandidateCache.get(
        cellKey,
      )

    if (candidates === undefined) {
      this.cellCandidateCacheMisses++

      const bounds =
        this.cellBounds(coordinate)

      const rbushStart =
        performance.now()

      candidates =
        this.spatialIndex.searchBounds(
          bounds.minLongitude,
          bounds.minLatitude,
          bounds.maxLongitude,
          bounds.maxLatitude,
        )

      this.rbushTime +=
        performance.now() -
        rbushStart

      this.cellCandidateCache.set(
        cellKey,
        candidates,
      )
    } else {
      this.cellCandidateCacheHits++
    }

    this.candidateLookupTime +=
      performance.now() -
      candidateLookupStart

    const candidateCheckStart =
      performance.now()

    for (const polygon of candidates) {
      const feature =
        this.features.get(polygon)

      if (!feature) {
        throw new Error(
          'Natural Earth polygon feature not prepared',
        )
      }
      const turfStart =
        performance.now()

      const inside =
        booleanPointInPolygon(
          point,
          feature,
        )

      this.turfTime +=
        performance.now() -
        turfStart

      if (inside) {
        this.candidateCheckTime +=
          performance.now() -
          candidateCheckStart

        this.allowedCache.set(
          key,
          false,
        )

        return false
      }
    }

    this.candidateCheckTime +=
      performance.now() -
      candidateCheckStart

    this.allowedCache.set(
      key,
      true,
    )

    return true
  }

  getCandidateCount(): number {
    return this.spatialIndex.getCandidateCount()
  }

  getRbushTime(): number {
    return this.rbushTime
  }

  getTurfTime(): number {
    return this.turfTime
  }

  getNavigationLandMaskTime(): number {
    return this.navigationLandMaskTime
  }

  getAllowedCacheTime(): number {
    return this.allowedCacheTime
  }

  getCandidateLookupTime(): number {
    return this.candidateLookupTime
  }

  getCandidateCheckTime(): number {
    return this.candidateCheckTime
  }

  getAllowedCacheHits(): number {
    return this.allowedCacheHits
  }

  getAllowedCacheMisses(): number {
    return this.allowedCacheMisses
  }

  getCellCandidateCacheHits(): number {
    return this.cellCandidateCacheHits
  }

  getCellCandidateCacheMisses(): number {
    return this.cellCandidateCacheMisses
  }
}