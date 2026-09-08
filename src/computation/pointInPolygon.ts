import type { Coordinate } from '../domain/coordinate'
import type { Polygon } from '../domain/geography/polygon'
import { pointInRing } from './pointInRing'

export function pointInPolygon(
  coordinate: Coordinate,
  polygon: Polygon,
): boolean {
  if (
    !pointInRing(
      coordinate,
      polygon.outer,
    )
  ) {
    return false
  }

  for (const hole of polygon.holes) {
    if (pointInRing(coordinate, hole)) {
      return false
    }
  }

  return true
}
