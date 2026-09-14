import type { Coordinate } from '../../domain/coordinate'
import type { Vessel } from '../../domain/vessel'
import type { NavigableBaselineRouteAnalysis } from '../../computation/navigableBaselineRouteAnalysis'

import { evaluateNavigableBaselineRoute } from '../../computation/navigableBaselineRouteAnalysis'
import { fetchNaturalEarthLand } from '../../computation/naturalEarthLoader'
import { NaturalEarthLandConstraint } from '../../computation/naturalEarthConstraint'
import { defaultVessel } from '../../domain/vessels/defaultVessel'

let constraintPromise:
  Promise<NaturalEarthLandConstraint> | null = null

async function getGeographicConstraint(): Promise<NaturalEarthLandConstraint> {  //return a promise for constraints land
  if (constraintPromise === null) {
    constraintPromise = fetchNaturalEarthLand().then(
      (land) => new NaturalEarthLandConstraint(land),
    )
  }

  return constraintPromise
}

export async function calculateVoyage(  //use constraint land to calc calculate Voyage
  start: Coordinate,
  end: Coordinate,
  vessel: Vessel = defaultVessel,
): Promise<NavigableBaselineRouteAnalysis | null> {
  const constraint = await getGeographicConstraint()

  return evaluateNavigableBaselineRoute(
    start,
    end,
    vessel,
    constraint,
  )
}
