export const NAVIGATION_GEOGRAPHY_VERSION = 3

export const NAVIGATION_CELL_SIZE = 0.1

export const NAVIGATION_GEOGRAPHY_WIDTH =
  3600

export const NAVIGATION_GEOGRAPHY_HEIGHT =
  1800

export const NAVIGATION_STATE_OCEAN = 0
export const NAVIGATION_STATE_LAND = 1
export const NAVIGATION_STATE_COAST = 2

export type NavigationGeographyState =
  | typeof NAVIGATION_STATE_OCEAN
  | typeof NAVIGATION_STATE_LAND
  | typeof NAVIGATION_STATE_COAST

export interface NavigationGeographyData {
  version: number
  cellSize: number
  width: number
  height: number
  states: Uint8Array
}

export function coordinateToNavigationCell(
  longitude: number,
  latitude: number,
): {
  column: number
  row: number
} {
  const normalizedLongitude =
    ((longitude + 180) % 360 + 360) % 360

  const clampedLatitude =
    Math.max(
      -90,
      Math.min(90, latitude),
    )

  const column = Math.min(
    NAVIGATION_GEOGRAPHY_WIDTH - 1,
    Math.floor(
      normalizedLongitude /
        NAVIGATION_CELL_SIZE,
    ),
  )

  const row = Math.min(
    NAVIGATION_GEOGRAPHY_HEIGHT - 1,
    Math.floor(
      (clampedLatitude + 90) /
        NAVIGATION_CELL_SIZE,
    ),
  )

  return {
    column,
    row,
  }
}

export function navigationCellIndex(
  column: number,
  row: number,
): number {
  return (
    row *
      NAVIGATION_GEOGRAPHY_WIDTH +
    column
  )
}

export function getNavigationGeographyState(
  data: NavigationGeographyData,
  longitude: number,
  latitude: number,
): NavigationGeographyState {
  const {
    column,
    row,
  } = coordinateToNavigationCell(
    longitude,
    latitude,
  )

  return data.states[
    navigationCellIndex(
      column,
      row,
    )
  ] as NavigationGeographyState
}
