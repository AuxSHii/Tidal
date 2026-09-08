import type { Route } from '../domain/route'
import type { RouteMetrics } from '../domain/routeMetric'
import type { Vessel } from '../domain/vessel'
import { routeDistance } from './route'
import { travelTime } from './travelTime'
import { energyAtSpeed } from './energyAtSpeed'
import { fuelMassFromEnergy } from './fuel'
import { feasibleTargetSpeed } from './vesselMotion'

export function evaluateRoute(
  route: Route,
  vessel: Vessel,
): RouteMetrics {
  const distance = routeDistance(route)

  const operatingSpeed =
    feasibleTargetSpeed(
      vessel.cruiseSpeed,
      vessel,
    )

  const travelTimeValue = travelTime(
    distance,
    {
      ...vessel,
      cruiseSpeed: operatingSpeed,
    },
  )

  const energy = energyAtSpeed(
    operatingSpeed,
    distance,
    vessel,
  )

  const fuelMass = fuelMassFromEnergy(
    energy,
    vessel,
  )

  return {
    distance,
    travelTime: travelTimeValue,
    energy,
    fuelMass,
  }
}
