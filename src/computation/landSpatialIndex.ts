import RBush from 'rbush'
import type { Polygon } from '../domain/geography/polygon'

// X = longitude
// Y = latitude
export interface IndexedLandPolygon {
  minX: number
  minY: number
  maxX: number
  maxY: number
  polygon: Polygon
}

// Size of one coarse geographic cell.
// This is only a fast prefilter; exact geometry is still handled by RBush + Turf.
const COARSE_CELL_SIZE = 2

function boundingBox(
  polygon: Polygon,
): IndexedLandPolygon {
  const points = [
    ...polygon.outer,
    ...polygon.holes.flat(),
  ]

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const point of points) {
    minX = Math.min(
      minX,
      point.longitude,
    )

    maxX = Math.max(
      maxX,
      point.longitude,
    )

    minY = Math.min(
      minY,
      point.latitude,
    )

    maxY = Math.max(
      maxY,
      point.latitude,
    )
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    polygon,
  }
}

function coarseCellKey(
  longitude: number,
  latitude: number,
): string {
  const column = Math.floor(
    (longitude + 180) /
      COARSE_CELL_SIZE,
  )

  const row = Math.floor(
    (latitude + 90) /
      COARSE_CELL_SIZE,
  )

  return `${column}:${row}`
}

function addBoundingBoxToCoarseGrid(
  coarseGrid: Set<string>,
  bounds: IndexedLandPolygon,
): void {
  const minColumn = Math.floor(
    (bounds.minX + 180) /
      COARSE_CELL_SIZE,
  )

  const maxColumn = Math.floor(
    (bounds.maxX + 180) /
      COARSE_CELL_SIZE,
  )

  const minRow = Math.floor(
    (bounds.minY + 90) /
      COARSE_CELL_SIZE,
  )

  const maxRow = Math.floor(
    (bounds.maxY + 90) /
      COARSE_CELL_SIZE,
  )

  for (
    let row = minRow;
    row <= maxRow;
    row++
  ) {
    for (
      let column = minColumn;
      column <= maxColumn;
      column++
    ) {
      coarseGrid.add(
        `${column}:${row}`,
      )
    }
  }
}

export class LandSpatialIndex {
  private readonly index =
    new RBush<IndexedLandPolygon>()

  // Fast conservative geographic prefilter.
  private readonly coarseGrid =
    new Set<string>()

  private candidateCount = 0

  constructor(
    polygons: Polygon[],
  ) {
    const items =
      polygons.map(boundingBox)

    this.index.load(items)

    // Build the coarse occupancy grid once.
    for (const item of items) {
      addBoundingBoxToCoarseGrid(
        this.coarseGrid,
        item,
      )
    }

    console.log(
      'Land coarse grid cells:',
      this.coarseGrid.size,
    )
  }

  search(
    longitude: number,
    latitude: number,
  ): Polygon[] {
    // If no land bounding box overlaps this
    // coarse cell, the point cannot be on land.
    const key = coarseCellKey(
      longitude,
      latitude,
    )

    if (!this.coarseGrid.has(key)) {
      return []
    }

    // Only potentially interesting coordinates
    // reach the existing RBush search.
    const candidates =
      this.index.search({
        minX: longitude,
        minY: latitude,
        maxX: longitude,
        maxY: latitude,
      })

    this.candidateCount +=
      candidates.length

    return candidates.map(
      (item) => item.polygon,
    )
  }
  
  searchBounds(
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): Polygon[] {
  const candidates =
    this.index.search({
      minX,
      minY,
      maxX,
      maxY,
    })

  this.candidateCount +=
    candidates.length

  return candidates.map(
    (item) => item.polygon,
  )
}


  




    hasCandidateInBounds(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): boolean {
    const candidates = this.index.search({
      minX,
      minY,
      maxX,
      maxY,
    })

    this.candidateCount += candidates.length

    return candidates.length > 0

  }

  getCandidateCount(): number {
    return this.candidateCount
  }
}
