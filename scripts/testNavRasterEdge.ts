import {
  classifyGeodesicEdgeWithRaster,
} from '../src/computation/navigationRasterEdge'

import {
  NAVIGATION_STATE_COAST,
  NAVIGATION_STATE_LAND,
  NAVIGATION_STATE_OCEAN,
  coordinateToNavigationCell,
  navigationCellIndex,
  type NavigationGeographyData,
} from '../src/computation/navigationGeography'

import {
  loadNavigationGeography,
} from '../src/computation/navigationGeographyLoader'

import type { Coordinate } from '../src/domain/coordinate'

function coordinate(
  latitude: number,
  longitude: number,
): Coordinate {
  return {
    latitude,
    longitude,
  }
}

function assertEqual<T>(
  actual: T,
  expected: T,
  name: string,
): void {
  if (actual !== expected) {
    throw new Error(
      `${name}: expected ${String(expected)}, got ${String(actual)}`,
    )
  }
}

function assertRasterState(
  data: NavigationGeographyData,
  point: Coordinate,
  expected: number,
  name: string,
): void {
  const {
    column,
    row,
  } = coordinateToNavigationCell(
    point.longitude,
    point.latitude,
  )

  const actual =
    data.states[
      navigationCellIndex(
        column,
        row,
      )
    ]

  assertEqual(
    actual,
    expected,
    name,
  )
}

function testEdge(
  data: NavigationGeographyData,
  from: Coordinate,
  to: Coordinate,
  expected: string,
  name: string,
): void {
  const actual =
    classifyGeodesicEdgeWithRaster(
      from,
      to,
      data,
    )

  assertEqual(
    actual,
    expected,
    name,
  )
}

async function main(): Promise<void> {
  const data =
    await loadNavigationGeography()

  console.log(
    'Navigation raster loaded:',
    data.width,
    '×',
    data.height,
  )

  /*
   * First verify the cells used by the edge
   * tests have the expected compiled states.
   */

  assertRasterState(
    data,
    coordinate(14.5, 120.0),
    NAVIGATION_STATE_OCEAN,
    'Philippine Sea',
  )

  assertRasterState(
    data,
    coordinate(23.1, 113.4),
    NAVIGATION_STATE_LAND,
    'Guangzhou land',
  )

  assertRasterState(
    data,
    coordinate(25.0, 121.5),
    NAVIGATION_STATE_COAST,
    'Taiwan coast',
  )

  /*
   * 1. Clearly open ocean.
   */
  testEdge(
    data,
    coordinate(14.5, 120.0),
    coordinate(14.5, 121.0),
    'CERTIFIED_OCEAN',
    'Open ocean edge',
  )

  /*
   * 2. Edge begins and ends on land.
   */
  testEdge(
    data,
    coordinate(23.1, 113.4),
    coordinate(23.2, 113.5),
    'NEEDS_EXACT_VALIDATION',
    'Land edge',
  )

  /*
   * 3. Edge crossing Taiwan.
   *
   * The endpoints are placed on opposite sides
   * of the island. The raster must refuse to
   * certify the edge as open ocean.
   */
  testEdge(
    data,
    coordinate(24.5, 120.0),
    coordinate(24.5, 122.5),
    'NEEDS_EXACT_VALIDATION',
    'Taiwan crossing edge',
  )

  /*
   * 4. Edge close to coastline.
   */
  testEdge(
    data,
    coordinate(25.0, 121.0),
    coordinate(25.0, 121.2),
    'NEEDS_EXACT_VALIDATION',
    'Taiwan coastal edge',
  )

  /*
   * 5. Antimeridian ocean.
   */
  testEdge(
    data,
    coordinate(10.0, 179.5),
    coordinate(10.0, -179.5),
    'CERTIFIED_OCEAN',
    'Antimeridian ocean edge',
  )

  /*
   * 6. Arctic ocean.
   */
  testEdge(
    data,
    coordinate(80.0, -20.0),
    coordinate(80.0, 20.0),
    'CERTIFIED_OCEAN',
    'Arctic ocean edge',
  )

  /*
   * 7. Antarctic coastline should not be
   * certified as open ocean.
   */
  testEdge(
    data,
    coordinate(-75.0, 0.0),
    coordinate(-90.0, 0.0),
    'NEEDS_EXACT_VALIDATION',
    'Antarctic edge',
  )

  console.log(
    'Navigation raster edge tests: PASS',
  )
}

main().catch((error) => {
  console.error(
    'Navigation raster edge tests: FAIL',
  )

  console.error(error)

  process.exitCode = 1
})
