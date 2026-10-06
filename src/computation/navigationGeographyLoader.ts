
/* to  load the freckinn statci bin files
  */


import {
  NAVIGATION_CELL_SIZE,
  NAVIGATION_GEOGRAPHY_HEIGHT,
  NAVIGATION_GEOGRAPHY_VERSION,
  NAVIGATION_GEOGRAPHY_WIDTH,
  NavigationGeographyData,
} from './navigationGeography'

const NAVIGATION_GEOGRAPHY_URL =
  '/data/geography/natural-earth/navigation-geography.bin'

const HEADER_LENGTH_BYTES = 4

/**
 * Loads and validates the precomputed navigation geography raster.
 *
 * Binary layout:
 *
 *   4 bytes       → little-endian uint32 header length
 *   N bytes       → UTF-8 JSON header
 *   remaining     → one byte per raster cell
 */
export async function loadNavigationGeography(): Promise<
  NavigationGeographyData
> {
  const response = await fetch(
    NAVIGATION_GEOGRAPHY_URL,
  )

  if (!response.ok) {
    throw new Error(
      `Failed to load navigation geography: ${response.status} ${response.statusText}`,
    )
  }

  const buffer = await response.arrayBuffer()

  if (buffer.byteLength < HEADER_LENGTH_BYTES) {
    throw new Error(
      'Navigation geography file is too small to contain a header.',
    )
  }

  const view = new DataView(buffer)

  // The first four bytes tell us how many bytes belong to the JSON header.
  const headerLength = view.getUint32(
    0,
    true,
  )

  const headerStart = HEADER_LENGTH_BYTES
  const headerEnd =
    headerStart + headerLength

  if (headerEnd > buffer.byteLength) {
    throw new Error(
      'Navigation geography header extends beyond the file.',
    )
  }

  const headerBytes = new Uint8Array(
    buffer,
    headerStart,
    headerLength,
  )

  const headerText =
    new TextDecoder().decode(headerBytes)

  let header: {
    version: number
    cellSize: number
    width: number
    height: number
    sourceHash?: string
    configHash?: string
    nextRow?: number
  }

  try {
    header = JSON.parse(headerText)
  } catch {
    throw new Error(
      'Navigation geography header contains invalid JSON.',
    )
  }

  // Validate the dataset identity and dimensions before exposing it
  // to the rest of the application.
  if (
    header.version !==
    NAVIGATION_GEOGRAPHY_VERSION
  ) {
    throw new Error(
      `Navigation geography version mismatch. Expected ${NAVIGATION_GEOGRAPHY_VERSION}, got ${header.version}.`,
    )
  }

  if (
    header.cellSize !==
    NAVIGATION_CELL_SIZE
  ) {
    throw new Error(
      `Navigation geography cell size mismatch. Expected ${NAVIGATION_CELL_SIZE}, got ${header.cellSize}.`,
    )
  }

  if (
    header.width !==
    NAVIGATION_GEOGRAPHY_WIDTH
  ) {
    throw new Error(
      `Navigation geography width mismatch. Expected ${NAVIGATION_GEOGRAPHY_WIDTH}, got ${header.width}.`,
    )
  }

  if (
    header.height !==
    NAVIGATION_GEOGRAPHY_HEIGHT
  ) {
    throw new Error(
      `Navigation geography height mismatch. Expected ${NAVIGATION_GEOGRAPHY_HEIGHT}, got ${header.height}.`,
    )
  }

  const expectedStateBytes =
    NAVIGATION_GEOGRAPHY_WIDTH *
    NAVIGATION_GEOGRAPHY_HEIGHT

  const actualStateBytes =
    buffer.byteLength - headerEnd

  if (
    actualStateBytes !==
    expectedStateBytes
  ) {
    throw new Error(
      `Navigation geography state size mismatch. Expected ${expectedStateBytes} bytes, got ${actualStateBytes}.`,
    )
  }

  const states = new Uint8Array(
    buffer,
    headerEnd,
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
