import type { Coordinate } from '../domain/coordinate'
import type { NavigationGeographyData } from './navigationGeography'
import {
  coordinateToNavigationCell,
  navigationCellIndex,
  NAVIGATION_CELL_SIZE,
  NAVIGATION_STATE_OCEAN,
} from './navigationGeography'
import { Geodesic } from 'geographiclib-geodesic'

const WGS84 = Geodesic.WGS84

/*
 * Raster certification is an acceleration layer.
 *
 * CERTIFIED_OCEAN
 *     -> caller may skip expensive geographic validation.
 *
 * NEEDS_EXACT_VALIDATION
 *     -> caller must use the authoritative
 *        Natural Earth geometry.
 *
 * The raster must never certify an uncertain
 * edge as ocean.
 */

export type NavigationRasterEdgeResult =
  | 'CERTIFIED_OCEAN'
  | 'NEEDS_EXACT_VALIDATION'


  
/*
 * The derived mask stores whether a cell's complete
 * 3x3 neighbourhood is OCEAN.
 *
 * This is exactly the condition previously evaluated
 * by neighbourhoodIsOcean(), but precomputed once
 * instead of checking 9 raster cells for every sample.
 */
/*const certifiedOceanMasks =
  new WeakMap<
    NavigationGeographyData,
    Uint8Array
  >() */

  let rasterInverseTime = 0
let rasterInverseLineTime = 0
let rasterPositionTime = 0
let rasterNeighbourhoodTime = 0

export function getNavigationRasterTiming() {
  return {
    inverse: rasterInverseTime,
    inverseLine: rasterInverseLineTime,
    position: rasterPositionTime,
    neighbourhood: rasterNeighbourhoodTime,
  }
}




function requireValue(
  value: number | undefined,
  name: string,
): number {
  if (value == undefined) {
    throw new Error(
      `Geodesic result missing: ${name}`,
    )
  }

  return value
}

function wrappedColumn(
  column: number,
  width: number,
): number {
  return (
    ((column % width) + width) %
    width
  )
}

function cellIsOcean(
  data: NavigationGeographyData,
  column: number,
  row: number,
): boolean {
  if (
    row < 0 ||
    row >= data.height
  ) {
    /*
     * Outside the raster latitude domain
     * cannot be certified as ocean.
     */
    return false
  }

  const wrapped =
    wrappedColumn(
      column,
      data.width,
    )

  return (
    data.states[
      navigationCellIndex(
        wrapped,
        row,
      )
    ] ===
    NAVIGATION_STATE_OCEAN
  )
}


/*
 * Check the precomputed conservative
 * neighbourhood classification for one
 * geodesic position.
 */

function neighbourhoodIsOcean(
  data: NavigationGeographyData,
  coordinate: Coordinate,
): boolean {
  const {
    column,
    row,
  } =
    coordinateToNavigationCell(
      coordinate.longitude,
      coordinate.latitude,
    )

  if (
    row < 0 ||
    row >= data.height
  ) {
    return false
  }

  for (
    let rowOffset = -1;
    rowOffset <= 1;
    rowOffset++
  ) {
    for (
      let columnOffset = -1;
      columnOffset <= 1;
      columnOffset++
    ) {
      if (
        !cellIsOcean(
          data,
          column + columnOffset,
          row + rowOffset,
        )
      ) {
        return false
      }
    }
  }

  return true
}




/*
 * Return the number of samples represented
 * by the requested physical distance.
 *
 * Sampling density is intentionally unchanged.
 */
function sampleCount(
  distance: number,
): number {
  const approximateCellDistance =
    NAVIGATION_CELL_SIZE *
    111_320

  const spacing =
    approximateCellDistance / 4

  return Math.max(
    1,
    Math.ceil(
      distance / spacing,
    ),
  )
}

/**
 * Conservatively tests whether a WGS84 geodesic
 * edge can be certified as open ocean by the
 * compiled navigation raster.
 *
 * This does NOT perform authoritative
 * geographic validation.
 *
 * NEEDS_EXACT_VALIDATION means the caller must
 * continue to Natural Earth geometry.
 */
export function classifyGeodesicEdgeWithRaster(
  from: Coordinate,
  to: Coordinate,
  data: NavigationGeographyData,
): NavigationRasterEdgeResult {


const inverseStart =
  performance.now()

const inverse =
  WGS84.Inverse(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude,
  )

rasterInverseTime +=
  performance.now() -
  inverseStart

const distance =
  requireValue(
    inverse.s12,
    'distance',
  )

if (
  distance === 0
) {
  return neighbourhoodIsOcean(
    data,
    from,
  )
    ? 'CERTIFIED_OCEAN'
    : 'NEEDS_EXACT_VALIDATION'
}

const inverseLineStart =
  performance.now()

const line =
  WGS84.InverseLine(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude,
  )

rasterInverseLineTime +=
  performance.now() -
  inverseLineStart

const count =
  sampleCount(
    distance,
  )


  /*
   * Always inspect both endpoints and the
   * interior positions.
   *
   * Using i / count makes the final sample
   * exactly the destination.
   */
  for (
    let i = 0;
    i <= count;
    i++
  ) {
    const distanceAlong =
      (
        distance * i
      ) /
      count

const positionStart =
      performance.now()

    const position =
      line.Position(
        distanceAlong,
      )

    rasterPositionTime +=
      performance.now() -
      positionStart




    const coordinate: Coordinate = {
      latitude:
        requireValue(
          position.lat2,
          'latitude',
        ),
      longitude:
        requireValue(
          position.lon2,
          'longitude',
        ),
    }

const neighbourhoodStart =
      performance.now()

    const ocean =
      neighbourhoodIsOcean(
        data,
        coordinate,
      )

    rasterNeighbourhoodTime +=
      performance.now() -
      neighbourhoodStart

    if (!ocean) {

      return 'NEEDS_EXACT_VALIDATION'
    }
  }

  return 'CERTIFIED_OCEAN'
}

