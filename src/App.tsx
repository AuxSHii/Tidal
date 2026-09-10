import { useEffect } from 'react'
import { fetchNaturalEarthLand } from './computation/naturalEarthLoader'
import { NaturalEarthLandConstraint } from './computation/naturalEarthConstraint'
import { evaluateBaselineRoute } from './computation/baselineRouteEvaluation'
import { generateNavigableBaselineRoute } from './computation/navigableBaselineRoute'
import { validateRouteAgainstConstraint } from './computation/geographicConstraint'
import { routeDistance } from './computation/route'
import type { Polygon } from './domain/geography/polygon'

interface PolygonBounds {
  minLongitude: number
  maxLongitude: number
  minLatitude: number
  maxLatitude: number
}

function polygonBounds(
  polygon: Polygon,
): PolygonBounds {
  let minLongitude = Infinity
  let maxLongitude = -Infinity
  let minLatitude = Infinity
  let maxLatitude = -Infinity

  for (const point of polygon.outer) {
    minLongitude = Math.min(
      minLongitude,
      point.longitude,
    )

    maxLongitude = Math.max(
      maxLongitude,
      point.longitude,
    )

    minLatitude = Math.min(
      minLatitude,
      point.latitude,
    )

    maxLatitude = Math.max(
      maxLatitude,
      point.latitude,
    )
  }

  return {
    minLongitude,
    maxLongitude,
    minLatitude,
    maxLatitude,
  }
}

function findTestObstacle(
  land: Awaited<
    ReturnType<typeof fetchNaturalEarthLand>
  >,
  constraint: NaturalEarthLandConstraint,
  spacing: number,
) {
  /*
   * Look for a small land feature first.
   *
   * We deliberately avoid large continental polygons here.
   * The purpose of this diagnostic is to create a small,
   * manageable obstacle that our current grid can route around.
   */
  for (const polygon of land.polygons) {
    const bounds = polygonBounds(polygon)

    const width =
      bounds.maxLongitude -
      bounds.minLongitude

    const height =
      bounds.maxLatitude -
      bounds.minLatitude

    /*
     * Ignore extremely large features.
     * These are unsuitable for our small controlled test.
     */
    if (
      width < 1 ||
      width > 5 ||
      height > 5
    ) {
      continue
    }

    /*
     * Use the middle latitude of the land feature.
     *
     * The endpoints are placed just outside the feature's
     * longitude bounds, so the candidate route approaches
     * the feature from opposite sides.
     */
    const latitude =
      (bounds.minLatitude +
        bounds.maxLatitude) /
      2

    const margin = 0.5

    const start = {
      longitude:
        bounds.minLongitude - margin,
      latitude,
    }

    const end = {
      longitude:
        bounds.maxLongitude + margin,
      latitude,
    }

    /*
     * Reject candidates whose endpoints are themselves
     * on land.
     */
    if (!constraint.isAllowed(start)) {
      continue
    }

    if (!constraint.isAllowed(end)) {
      continue
    }

    /*
     * Now ask the existing geographic validation system
     * whether the direct geodesic actually crosses land.
     *
     * This is the important verification step.
     */
    const directResult =
      evaluateBaselineRoute(
        start,
        end,
        constraint,
        spacing,
      )

    if (!directResult.valid) {
      return {
        start,
        end,
        directResult,
        bounds,
        width,
        height,
      }
    }
  }

  return null
}

function App() {
  useEffect(() => {
    async function inspectNavigationObstacle() {
      const spacing = 10000
      const paddingCells = 30

      const land =
        await fetchNaturalEarthLand()

      const constraint =
        new NaturalEarthLandConstraint(land)

      console.log(
        'Natural Earth polygons:',
        land.polygons.length,
      )

      console.log(
        'Searching for a small real land obstacle...',
      )

      const testObstacle =
        findTestObstacle(
          land,
          constraint,
          spacing,
        )

      if (!testObstacle) {
        console.log(
          'No suitable test obstacle was found.',
        )

        return
      }
      console.log(
        'Test obstacle found.',
      )

      console.log(
        'Obstacle bounds:',
        testObstacle.bounds,
      )

      console.log(
        'Obstacle width:',
        testObstacle.width,
        'degrees',
      )

      console.log(
        'Obstacle height:',
        testObstacle.height,
        'degrees',
      )

      console.log(
        'Test start:',
        testObstacle.start,
      )

      console.log(
        'Test end:',
        testObstacle.end,
      )

      console.log(
        'Start allowed:',
        constraint.isAllowed(
          testObstacle.start,
        ),
      )

      console.log(
        'End allowed:',
        constraint.isAllowed(
          testObstacle.end,
        ),
      )

      console.log(
        'Direct geodesic valid:',
        testObstacle.directResult.valid,
      )

      if (testObstacle.directResult.violation) {
        console.log(
          'Direct geodesic blocked at:',
          testObstacle.directResult.violation.coordinate,
        )
      }

      /*
       * Now run the actual geographic navigation pipeline.
       *
       * The obstacle has already been independently verified:
       * both endpoints are ocean and the direct route crosses land.
       */
      console.log(
        'Building navigable baseline route...',
      )

      const route =
        generateNavigableBaselineRoute(
          testObstacle.start,
          testObstacle.end,
          constraint,
          spacing,
          paddingCells,
        )

      if (route === null) {
        console.log(
          'Navigable baseline route: NOT FOUND',
        )

        return
      }

      console.log(
        'Navigable baseline route: FOUND',
      )

      console.log(
        'Route points:',
        route.points.length,
      )

      /*
       * Verify that the returned route itself
       * remains geographically navigable.
       */
      const routeViolation =
        validateRouteAgainstConstraint(
          route,
          constraint,
          spacing,
        )

      console.log(
        'Navigable baseline route valid:',
        routeViolation === null,
      )

      if (routeViolation) {
        console.log(
          'Route violation at:',
          routeViolation.coordinate,
        )
      }

      console.log(
        'Navigable baseline route distance:',
        routeDistance(route),
        'm',
      )
    }

    inspectNavigationObstacle().catch(
      (error) => {
        console.error(
          'Navigation obstacle inspection failed:',
          error,
        )
      },
    )
  }, [])

  return <div>TIDAL</div>
}

export default App