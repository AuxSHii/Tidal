import fs from 'node:fs'

const FILE =
  'public/data/geography/natural-earth/navigation-geography.bin'

const NAVIGATION_GEOGRAPHY_VERSION = 5
const NAVIGATION_CELL_SIZE = 0.1
const NAVIGATION_GEOGRAPHY_WIDTH = 3600
const NAVIGATION_GEOGRAPHY_HEIGHT = 1800

const HEADER_LENGTH_BYTES = 4

const OCEAN = 0
const LAND = 1
const COAST = 2

/**
 * Load the precomputed navigation-geography binary.
 *
 * This is the Node/test equivalent of the browser loader.
 * It deliberately uses fs instead of fetch so we can validate the
 * binary/data contract without touching the application UI.
 */
export function loadNavigationGeographyNode() {
  const buffer = fs.readFileSync(FILE)

  if (buffer.length < HEADER_LENGTH_BYTES) {
    throw new Error(
      'Navigation geography file is too small to contain a header.',
    )
  }

  const view = new DataView(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength,
  )

  // First four bytes contain the JSON header length.
  const headerLength = view.getUint32(
    0,
    true,
  )

  const headerStart = HEADER_LENGTH_BYTES
  const headerEnd =
    headerStart + headerLength

  if (headerEnd > buffer.length) {
    throw new Error(
      'Navigation geography header extends beyond the file.',
    )
  }

  const headerText = buffer
    .subarray(headerStart, headerEnd)
    .toString('utf8')

  let header

  try {
    header = JSON.parse(headerText)
  } catch {
    throw new Error(
      'Navigation geography header contains invalid JSON.',
    )
  }

  // Validate the dataset against the application's expected raster definition.
  if (
    header.version !==
    NAVIGATION_GEOGRAPHY_VERSION
  ) {
    throw new Error(
      `Version mismatch. Expected ${NAVIGATION_GEOGRAPHY_VERSION}, got ${header.version}.`,
    )
  }

  if (
    header.cellSize !==
    NAVIGATION_CELL_SIZE
  ) {
    throw new Error(
      `Cell size mismatch. Expected ${NAVIGATION_CELL_SIZE}, got ${header.cellSize}.`,
    )
  }

  if (
    header.width !==
    NAVIGATION_GEOGRAPHY_WIDTH
  ) {
    throw new Error(
      `Width mismatch. Expected ${NAVIGATION_GEOGRAPHY_WIDTH}, got ${header.width}.`,
    )
  }

  if (
    header.height !==
    NAVIGATION_GEOGRAPHY_HEIGHT
  ) {
    throw new Error(
      `Height mismatch. Expected ${NAVIGATION_GEOGRAPHY_HEIGHT}, got ${header.height}.`,
    )
  }

  const expectedStateBytes =
    NAVIGATION_GEOGRAPHY_WIDTH *
    NAVIGATION_GEOGRAPHY_HEIGHT

  const actualStateBytes =
    buffer.length - headerEnd

  if (
    actualStateBytes !==
    expectedStateBytes
  ) {
    throw new Error(
      `State size mismatch. Expected ${expectedStateBytes}, got ${actualStateBytes}.`,
    )
  }

  const states = new Uint8Array(
    buffer.buffer,
    buffer.byteOffset + headerEnd,
    expectedStateBytes,
  )

  return {
    version: header.version,
    cellSize: header.cellSize,
    width: header.width,
    height: header.height,
    states,
  }
}

export {
  OCEAN,
  LAND,
  COAST,
}
