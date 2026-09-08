import type { Coordinate } from '../domain/coordinate'
import type { MultiPolygon } from '../domain/geography/multiPolygon'
import { pointInPolygon } from './pointInPolygon'

export function pointInMultiPolygon(
  coordinate: Coordinate,
  multiPolygon: MultiPolygon,
): boolean {
  for (const polygon of multiPolygon.polygons) {
    if (pointInPolygon(coordinate, polygon)) {
      return true
    }
  }

  return false
}
