import fs from 'node:fs'

const FILE =
  'public/data/geography/natural-earth/navigation-geography.bin'

const CELL_SIZE = 0.1
const WIDTH = 3600
const HEIGHT = 1800

const OCEAN = 0
const LAND = 1
const COAST = 2

// -----------------------------------------------------------------------------
// Load the binary navigation geography dataset.
// -----------------------------------------------------------------------------

const buffer = fs.readFileSync(FILE)

const view = new DataView(
  buffer.buffer,
  buffer.byteOffset,
  buffer.byteLength,
)

// First 4 bytes contain the JSON header length.
const headerLength = view.getUint32(0, true)

const headerText = buffer
  .subarray(4, 4 + headerLength)
  .toString('utf8')

const header = JSON.parse(headerText)

// The remaining bytes are one byte per raster cell.
const states = new Uint8Array(
  buffer.buffer,
  buffer.byteOffset + 4 + headerLength,
  WIDTH * HEIGHT,
)

// -----------------------------------------------------------------------------
// Header / file structure validation
// -----------------------------------------------------------------------------

console.log('HEADER')
console.log(header)
console.log()

console.log('File bytes:', buffer.length)
console.log('Header bytes:', headerLength)
console.log('State bytes:', states.length)
console.log()

const expectedStateBytes = WIDTH * HEIGHT
const expectedFileBytes = 4 + headerLength + expectedStateBytes

if (states.length !== expectedStateBytes) {
  throw new Error(
    `Invalid state byte count. Expected ${expectedStateBytes}, got ${states.length}.`,
  )
}

if (buffer.length !== expectedFileBytes) {
  throw new Error(
    `Invalid file size. Expected ${expectedFileBytes}, got ${buffer.length}.`,
  )
}

if (header.width !== WIDTH) {
  throw new Error(
    `Header width mismatch. Expected ${WIDTH}, got ${header.width}.`,
  )
}

if (header.height !== HEIGHT) {
  throw new Error(
    `Header height mismatch. Expected ${HEIGHT}, got ${header.height}.`,
  )
}

if (header.cellSize !== CELL_SIZE) {
  throw new Error(
    `Header cellSize mismatch. Expected ${CELL_SIZE}, got ${header.cellSize}.`,
  )
}

console.log('PASS: binary file structure is valid.')
console.log()

// -----------------------------------------------------------------------------
// State helpers
// -----------------------------------------------------------------------------

function stateName(state) {
  switch (state) {
    case OCEAN:
      return 'OCEAN'

    case LAND:
      return 'LAND'

    case COAST:
      return 'COAST'

    default:
      `return UNKNOWN(${state})`
  }
}

// -----------------------------------------------------------------------------
// Coordinate -> raster-cell lookup
//
// Longitude:
//   -180 ... +180 maps onto columns 0 ... 3599
//
// Latitude:
//   -90 ... +90 maps onto rows 0 ... 1799
//
// +180 and -180 intentionally map to the same column.
// -----------------------------------------------------------------------------

function lookup(longitude, latitude) {
  const normalizedLongitude =
    ((longitude + 180) % 360 + 360) % 360

  const clampedLatitude =
    Math.max(-90, Math.min(90, latitude))

  const column = Math.min(
    WIDTH - 1,
    Math.floor(normalizedLongitude / CELL_SIZE),
  )

  const row = Math.min(
    HEIGHT - 1,
    Math.floor((clampedLatitude + 90) / CELL_SIZE),
  )

  const index = row * WIDTH + column

  return {
    longitude,
    latitude,
    column,
    row,
    index,
    state: states[index],
    stateName: stateName(states[index]),
  }
}

// -----------------------------------------------------------------------------
// Basic geographic sanity checks
// -----------------------------------------------------------------------------

const tests = [
  ['Pacific Ocean', -140, 0],
  ['Atlantic Ocean', -30, 20],
  ['Sahara', 10, 25],
  ['India', 78, 22],
  ['Australia', 133, -25],
  ['Greenland', -42, 72],
  ['Antarctica', 0, -80],
  ['Japan', 138, 36],
  ['New York', -74, 40.7],
  ['London', -0.1, 51.5],
]

console.log('COORDINATE TESTS')

for (const [name, longitude, latitude] of tests) {
  console.log(
    name,
    '→',
    lookup(longitude, latitude),
  )
}

console.log()

// -----------------------------------------------------------------------------
// Count every raster state.
//
// This verifies that the entire 3600 x 1800 raster is initialized and that
// there are no unexpected byte values.
// -----------------------------------------------------------------------------

console.log('STATE COUNTS')

const counts = {
  OCEAN: 0,
  LAND: 0,
  COAST: 0,
  UNKNOWN: 0,
}

for (const state of states) {
  if (state === OCEAN) {
    counts.OCEAN++
  } else if (state === LAND) {
    counts.LAND++
  } else if (state === COAST) {
    counts.COAST++
  } else {
    counts.UNKNOWN++
  }
}

console.log(counts)

const totalStates =
  counts.OCEAN +
  counts.LAND +
  counts.COAST

const expectedCells = header.width * header.height

console.log()
console.log('STATE-COUNT INVARIANT')
console.log('Expected:', expectedCells)
console.log('Actual:  ', totalStates)

if (totalStates !== expectedCells) {
  throw new Error(
    'State counts do not cover the entire raster.',
  )
}

if (counts.UNKNOWN !== 0) {
  throw new Error(
    `Raster contains ${counts.UNKNOWN} cells with unknown state values.`,
  )
}

console.log('PASS: every raster cell has a valid state.')
console.log()

// -----------------------------------------------------------------------------
// Edge-case geographic tests
//
// These are intentionally chosen around:
//   - the antimeridian
//   - narrow geographic regions
//   - islands
//   - coastlines
//   - enclosed seas
//   - polar regions
// -----------------------------------------------------------------------------

console.log('EDGE CASE TESTS')

const edgeTests = [
  // Antimeridian: +180 and -180 must resolve to the same raster column.
  ['Antimeridian +180', 180, 0],
  ['Antimeridian -180', -180, 0],

  // Narrow / difficult geographic regions.
  ['Bering Strait west', 169, 65],
  ['Bering Strait east', -169, 65],

  // Islands.
  ['Iceland', -19, 65],
  ['Madagascar', 47, -20],
  ['Sri Lanka', 80.7, 7.8],

  // Coastline.
  ['Japan coast', 140, 35],

  // Definite ocean.
  ['Pacific near Hawaii', -155, 20],

  // Enclosed / semi-enclosed seas.
  ['Mediterranean', 15, 38],
  ['Mediterranean west of Sicily', 12, 38],
  ['Tyrrhenian Sea', 13, 40],
  ['Ionian Sea', 18, 38],
  ['Black Sea', 35, 43],

  // Polar regions.
  ['North Pole', 0, 89.9],
  ['South Pole', 0, -89.9],
  ['Antarctic Ocean', 0, -70],
  ['Arctic Ocean', 0, 80],
]

for (const [name, longitude, latitude] of edgeTests) {
  console.log(
    name,
    '→',
    lookup(longitude, latitude),
  )
}
