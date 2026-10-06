import type { Coordinate } from '../../domain/coordinate'
import type { Vessel } from '../../domain/vessel'
import type { NavigableBaselineRouteAnalysis } from '../../computation/navigableBaselineRouteAnalysis'
import type { NavigationGeographyData } from '../../computation/navigationGeography'

import { evaluateNavigableBaselineRoute } from '../../computation/navigableBaselineRouteAnalysis'
import { fetchNaturalEarthLand } from '../../computation/naturalEarthLoader'
import { NaturalEarthLandConstraint } from '../../computation/naturalEarthConstraint'
import { loadNavigationGeography } from '../../computation/navigationGeographyLoader'
import { defaultVessel } from '../../domain/vessels/defaultVessel'

let constraintPromise:
  Promise<NaturalEarthLandConstraint> | null = null

// Static geographic data loading.

let navigationGeographyPromise:
  Promise<NavigationGeographyData> | null = null

async function getNavigationGeography(): Promise<NavigationGeographyData> {
  if (navigationGeographyPromise === null) {
    navigationGeographyPromise =
      loadNavigationGeography()
  }

  return navigationGeographyPromise
}

async function getGeographicConstraint(): Promise<NaturalEarthLandConstraint> {
  if (constraintPromise === null) {
    constraintPromise = fetchNaturalEarthLand().then(
      (land) => new NaturalEarthLandConstraint(land),
    )
  }

  return constraintPromise
}

export async function calculateVoyage(
  start: Coordinate,
  end: Coordinate,
  vessel: Vessel = defaultVessel,
): Promise<NavigableBaselineRouteAnalysis | null> {
  const constraint = await getGeographicConstraint()

  const navigationGeography =
    await getNavigationGeography()

  return evaluateNavigableBaselineRoute(
    start,
    end,
    vessel,
    constraint,
    10000,
    5,
    navigationGeography,
  )
}
