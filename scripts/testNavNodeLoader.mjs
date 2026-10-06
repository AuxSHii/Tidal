import {
  loadNavigationGeographyNode,
  OCEAN,
  LAND,
  COAST,
} from './navigationGeographyNodeLoader.mjs'

const geography =
  loadNavigationGeographyNode()

console.log('Navigation geography loaded.')
console.log(
  'State bytes:',
  geography.states.length,
)
console.log(
  'Dimensions:',
  `${geography.width} × ${geography.height}`,
)
console.log(
  'Cell size:',
  geography.cellSize,
)
console.log()

function stateName(state) {
  switch (state) {
    case OCEAN:
      return 'OCEAN'

    case LAND:
      return 'LAND'

    case COAST:
      return 'COAST'

    default:
      return `UNKNOWN(${state})`
  }
}

/**
 * Convert geographic coordinates into the raster's flat-array index.
 *
 * This mirrors the coordinate convention used by the production
 * navigation-geography implementation.
 */
function lookup(longitude, latitude) {
  const normalizedLongitude =
    ((longitude + 180) % 360 + 360) % 360

  const clampedLatitude =
    Math.max(-90, Math.min(90, latitude))

  const column = Math.min(
    geography.width - 1,
    Math.floor(
      normalizedLongitude /
        geography.cellSize,
    ),
  )

  const row = Math.min(
    geography.height - 1,
    Math.floor(
      (clampedLatitude + 90) /
        geography.cellSize,
    ),
  )

  const index =
    row * geography.width + column

  const state =
    geography.states[index]

  return {
    longitude,
    latitude,
    column,
    row,
    index,
    state,
    stateName: stateName(state),
  }
}

const tests = [
  {
    name: 'Pacific Ocean',
    longitude: -140,
    latitude: 0,
    expected: OCEAN,
  },
  {
    name: 'India',
    longitude: 78,
    latitude: 22,
    expected: LAND,
  },
  {
    name: 'Japan coast',
    longitude: 140,
    latitude: 35,
    expected: COAST,
  },
  {
    name: 'Black Sea',
    longitude: 35,
    latitude: 43,
    expected: OCEAN,
  },
  {
    name: 'Antimeridian +180',
    longitude: 180,
    latitude: 0,
    expected: OCEAN,
  },
  {
    name: 'Antimeridian -180',
    longitude: -180,
    latitude: 0,
    expected: OCEAN,
  },
]

console.log('LOOKUP TESTS')

let failures = 0

for (const test of tests) {
  const result = lookup(
    test.longitude,
    test.latitude,
  )

  const passed =
    result.state === test.expected

  console.log(
    `${passed ? 'PASS' : 'FAIL'} ${test.name}`,
    '→',
    result.stateName,
  )

  if (!passed) {
    console.log(
      `  Expected: ${stateName(test.expected)}`,
    )

    console.log(
      `  Actual:   ${result.stateName}`,
    )

    failures++
  }
}

console.log()

if (failures > 0) {
  throw new Error(
    `${failures} navigation geography lookup test(s) failed.`,
  )
}

console.log(
  `PASS: ${tests.length}/${tests.length} lookup tests passed.`,
)
