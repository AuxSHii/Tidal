import { Geodesic } from 'geographiclib-geodesic'
import type { Coordinate } from '../domain/coordinate'
import type { NavigationNode } from '../domain/navigationNode'
import { distanceBetween } from './geography'

const WGS84 = Geodesic.WGS84
/*  
x = east/west displacement
y = north/south displacement
spacing = distance between grid cells
paddingCells = extra cells around the start/end region
 */
function requireValue(
  value: number | undefined,
  name: string,
): number {
  if (value == undefined) {
    throw new Error(`Geodesic result missing: ${name}`)
  }

  return value
}

function destination(
  origin: Coordinate,
  azimuth: number,
  distance: number,
): Coordinate {
  const result = WGS84.Direct(
    origin.latitude,
    origin.longitude,
    azimuth,
    distance,
  )

  return {
    latitude: requireValue(result.lat2, 'latitude'),
    longitude: requireValue(result.lon2, 'longitude'),
  }
}

export function generateNavigationGrid(
  start: Coordinate,
  end: Coordinate,
  spacing: number,
  paddingCells: number = 5,
): NavigationNode[] {
  if (spacing <= 0) {
    throw new Error(
      'Navigation grid spacing must be greater than zero',
    )
  }

  if (paddingCells < 0) {
    throw new Error(
      'Navigation grid padding cannot be negative',
    )
  }

  const routeDistance = distanceBetween(start, end)

  const inverse = WGS84.Inverse(
    start.latitude,
    start.longitude,
    end.latitude,
    end.longitude,
  )

  const azimuth = requireValue(
    inverse.azi1,
    'initial azimuth',
  )

  const endX =
    routeDistance * Math.sin(
      (azimuth * Math.PI) / 180,
    )

  const endY =
    routeDistance * Math.cos(
      (azimuth * Math.PI) / 180,
    )

  const minX =
    Math.min(0, endX) -
    paddingCells * spacing

  const maxX =
    Math.max(0, endX) +
    paddingCells * spacing

  const minY =
    Math.min(0, endY) -
    paddingCells * spacing

  const maxY =
    Math.max(0, endY) +
    paddingCells * spacing

  const columns =
    Math.ceil((maxX - minX) / spacing) + 1

  const rows =
    Math.ceil((maxY - minY) / spacing) + 1

  console.log(
    'Navigation grid:',
    columns,
    'columns ×',
    rows,
    'rows =',
    columns * rows,
    'nodes',
  )

  const nodes: NavigationNode[] = []

  for (let row = 0; row < rows; row++) {
    const y = minY + row * spacing

    for (let column = 0; column < columns; column++) {
      const x = minX + column * spacing

      const distance = Math.sqrt(
        x * x + y * y,
      )

      const localAzimuth =
        (Math.atan2(x, y) * 180) / Math.PI

      const coordinate = destination(
        start,
        localAzimuth,
        distance,
      )

      nodes.push({
        id: `grid-${row}-${column}`,
        coordinate,
      })
    }
  }

  return nodes
}
