import type { Coordinate } from '../domain/coordinate'
import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { Route } from '../domain/route'
import { validateRouteAgainstConstraint } from './geographicConstraint'
import { generateBaselineRoute } from './baselineRoute'

export interface BaselineRouteResult {
  route: Route
  valid: boolean
  violation: ReturnType<typeof validateRouteAgainstConstraint>
}

export function evaluateBaselineRoute(
  start: Coordinate,
  end: Coordinate,
  constraint: GeographicConstraint,
  spacing: number = 10000,
): BaselineRouteResult {
  const route = generateBaselineRoute(
    start,
    end,
    spacing,
  )

  const violation = validateRouteAgainstConstraint(
    route,
    constraint,
    spacing,
  )

  return {
    route,
    valid: violation === null,
    violation,
  }
}
