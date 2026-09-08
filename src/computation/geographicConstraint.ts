import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'

export class PolygonConstraint
  implements GeographicConstraint
{
  private readonly polygon: Coordinate[]

  constructor(polygon: Coordinate[]) {
    if (polygon.length < 3) {
      throw new Error(
        'Polygon must contain at least three points',
      )
    }

    this.polygon = polygon
  }

  contains(coordinate: Coordinate): boolean {
    let inside = false

    for (
      let i = 0, j = this.polygon.length - 1;
      i < this.polygon.length;
      j = i++
    ) {
      const current = this.polygon[i]
      const previous = this.polygon[j]

      const crossesLatitude =
        current.longitude > coordinate.longitude !==
        previous.longitude > coordinate.longitude

      if (crossesLatitude) {
        const intersectionLatitude =
          (previous.latitude - current.latitude) *
            (coordinate.longitude - current.longitude) /
            (previous.longitude - current.longitude) +
          current.latitude

        if (
          coordinate.latitude <
          intersectionLatitude
        ) {
          inside = !inside
        }
      }
    }

    return inside
  }
}
