import type { Coordinate } from '../domain/coordinate'

function normalizeLongitude(
  longitude: number,
): number {
  return ((longitude + 180) % 360 + 360) % 360 - 180
}

export function pointInRing(
  coordinate: Coordinate,
  ring: Coordinate[],
): boolean {
  if (ring.length < 3) {
    return false
  }

  const pointLongitude =
    normalizeLongitude(coordinate.longitude)

  let inside = false

  for (
    let i = 0, j = ring.length - 1;
    i < ring.length;
    j = i++
  ) {
    const current = ring[i]
    const previous = ring[j]

    const currentLatitude =
      current.latitude

    const previousLatitude =
      previous.latitude

    if (
      (currentLatitude > coordinate.latitude) !==
      (previousLatitude > coordinate.latitude)
    ) {
      let currentLongitude =
        normalizeLongitude(
          current.longitude,
        )

      let previousLongitude =
        normalizeLongitude(
          previous.longitude,
        )

      let longitudeDifference =
        currentLongitude -
        previousLongitude

      if (longitudeDifference > 180) {
        previousLongitude += 360
      } else if (longitudeDifference < -180) {
        currentLongitude += 360
      }

      let testLongitude =
        pointLongitude

      if (
        testLongitude < -180
      ) {
        testLongitude += 360
      }

      const intersectionLongitude =
        previousLongitude +
        (
          (coordinate.latitude -
            previousLatitude) /
          (currentLatitude -
            previousLatitude)
        ) *
        (currentLongitude -
          previousLongitude)

      if (
        testLongitude <
        intersectionLongitude
      ) {
        inside = !inside
      }
    }
  }

  return inside
}
