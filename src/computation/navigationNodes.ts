import type { GeographicConstraint } from '../domain/geographicConstraint'
import type { NavigationNode } from '../domain/navigationNode'
import type { NavigationGeographyData } from './navigationGeography'
import {
  getNavigationGeographyState,
  NAVIGATION_STATE_OCEAN,
  NAVIGATION_STATE_LAND,
} from './navigationGeography'

export function filterNavigableNodes(
  nodes: NavigationNode[],
  constraint: GeographicConstraint,
  navigationGeography: NavigationGeographyData,
): NavigationNode[] {
  return nodes.filter((node) => {
    const state =
      getNavigationGeographyState(
        navigationGeography,
        node.coordinate.longitude,
        node.coordinate.latitude,
      )

    if (state === NAVIGATION_STATE_OCEAN) {
      return true
    }

    if (state === NAVIGATION_STATE_LAND) {
      return false
    }

    return constraint.isAllowed(
      node.coordinate,
    )
  })
}
