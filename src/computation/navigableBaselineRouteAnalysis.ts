import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { RouteMetrics } from '../domain/routeMetric'
import type { Vessel } from '../domain/vessel'
import type { Route } from '../domain/route'
import { evaluateRoute } from './routeAnalysis'
import { generateNavigableBaselineRoute } from './navigableBaselineRoute'

export interface NavigableBaselineRouteAnalysis {
  route: Route
  metrics: RouteMetrics
}

export function evaluateNavigableBaselineRoute(
  start: Coordinate,
  end: Coordinate,
  vessel: Vessel,
  constraint: GeographicConstraint,
  spacing: number = 10000,
): NavigableBaselineRouteAnalysis | null {
  const route =
    generateNavigableBaselineRoute(
      start,
      end,
      constraint,
      spacing,
    )

  if (route === null) {
    return null
  }

  const metrics = evaluateRoute(
    route,
    vessel,
  )

  return {
    route,
    metrics,
  }
}
