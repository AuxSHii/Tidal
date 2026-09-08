import type { Vessel } from '../domain/vessel'

export function fuelMassFromEnergy(
  propulsionEnergy: number,
  vessel: Vessel,
): number {
  if (propulsionEnergy < 0) {
    throw new Error(
      'Propulsion energy cannot be negative',
    )
  }

  const efficiency =
    vessel.propulsion.efficiency

  const fuelEnergy =
    propulsionEnergy / efficiency

  return (
    fuelEnergy /
    vessel.fuel.energyDensity
  )
}
