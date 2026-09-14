import type { Coordinate } from '../domain/coordinate'
import type { MultiPolygon } from '../domain/geography/multiPolygon'
import { LandSpatialIndex } from './landSpatialIndex'

export type NavigationCellState =
  | 'ocean'
  | 'land'
  | 'ambiguous'

const CELL_SIZE = 0.5

const MIN_LONGITUDE = -180
const MAX_LONGITUDE = 180
const MIN_LATITUDE = -90
const MAX_LATITUDE = 90

const COLUMN_COUNT =
  (MAX_LONGITUDE - MIN_LONGITUDE) /
  CELL_SIZE

const ROW_COUNT =
  (MAX_LATITUDE - MIN_LATITUDE) /
  CELL_SIZE

function cellKey(
  column: number,
  row: number,
): string {
  return `${column}:${row}`
}

function coordinateToCell(
  coordinate: Coordinate,
) {
  const column = Math.floor(
    (coordinate.longitude + 180) /
      CELL_SIZE,
  )

  const row = Math.floor(
    (coordinate.latitude + 90) /
      CELL_SIZE,
  )

  return {
    column,
    row,
  }
}

function cellBounds(
  column: number,
  row: number,
) {
  return {
    minLongitude:
      MIN_LONGITUDE +
      column * CELL_SIZE,

    maxLongitude:
      MIN_LONGITUDE +
      (column + 1) * CELL_SIZE,

    minLatitude:
      MIN_LATITUDE +
      row * CELL_SIZE,

    maxLatitude:
      MIN_LATITUDE +
      (row + 1) * CELL_SIZE,
  }
}

export class NaturalEarthNavigationLandMask {
  private readonly states =
    new Map<string, NavigationCellState>()

  constructor(
    land: MultiPolygon,
  ) {
    const spatialIndex =
      new LandSpatialIndex(
        land.polygons,
      )

    let oceanCount = 0
    let ambiguousCount = 0

    for (
      let row = 0;
      row < ROW_COUNT;
      row++
    ) {
      for (
        let column = 0;
        column < COLUMN_COUNT;
        column++
      ) {
        const bounds =
          cellBounds(
            column,
            row,
          )

        const hasCandidate =
          spatialIndex.hasCandidateInBounds(
            bounds.minLongitude,
            bounds.minLatitude,
            bounds.maxLongitude,
            bounds.maxLatitude,
          )

        const state:
          NavigationCellState =
          hasCandidate
            ? 'ambiguous'
            : 'ocean'

        if (state === 'ocean') {
          oceanCount++
        } else {
          ambiguousCount++
        }

        this.states.set(
          cellKey(
            column,
            row,
          ),
          state,
        )
      }
    }

    console.log(
      'Navigation land mask:',
      this.states.size,
      'cells precomputed',
    )

    console.log(
      'Navigation land mask classification:',
      {
        ocean: oceanCount,
        ambiguous: ambiguousCount,
      },
    )
  }

  getState(
    coordinate: Coordinate,
  ): NavigationCellState {
    const { column, row } =
      coordinateToCell(
        coordinate,
      )

    return (
      this.states.get(
        cellKey(
          column,
          row,
        ),
      ) ?? 'ambiguous'
    )
  }
}
