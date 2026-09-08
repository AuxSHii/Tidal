import type { Vessel } from './vessel'

export function validateVessel(vessel: Vessel): void {
  if (vessel.length <= 0) {
    throw new Error('Vessel length must be greater than zero')
  }

  if (vessel.beam <= 0) {
    throw new Error('Vessel beam must be greater than zero')
  }

  if (vessel.draft <= 0) {
    throw new Error('Vessel draft must be greater than zero')
  }

  if (vessel.cruiseSpeed <= 0) {
    throw new Error('Vessel cruise speed must be greater than zero')
  }

  if (vessel.maxSpeed < vessel.cruiseSpeed) {
    throw new Error('Vessel max speed cannot be less than cruise speed')
  }

  if (vessel.acceleration <= 0) {
    throw new Error('Vessel acceleration must be greater than zero')
  }

  if (vessel.deceleration <= 0) {
  throw new Error('Vessel deceleration must be greater than zero',)
  }
  
  if (vessel.fuel.energyDensity <= 0) {
  throw new Error('Fuel energy density must be greater than zero',)
  }
  





  if (
    vessel.propulsion.efficiency <= 0 ||
    vessel.propulsion.efficiency > 1
  ) {
    throw new Error('Propulsion efficiency must be between 0 and 1')
  }

  if (vessel.propulsion.performanceCurve.length === 0) {
    throw new Error('Propulsion performance curve cannot be empty')
  }

  for (const point of vessel.propulsion.performanceCurve) {
    if (point.speed <= 0) {
      throw new Error('Performance curve speed must be greater than zero')
    }

    if (point.power <= 0) {
      throw new Error('Performance curve power must be greater than zero')
    }
  }

  const curve = vessel.propulsion.performanceCurve

  //performanceCurve validations - make it oredered
  for (let i = 0; i < curve.length; i++) {
  const point = curve[i]

  if (point.speed <= 0) {
    throw new Error(
      'Performance curve speeds must be greater than zero',
    )
  }

  if (point.power <= 0) {
    throw new Error(
      'Performance curve powers must be greater than zero',
    )
  }

  if (i > 0) {
    const previous = curve[i - 1]

    if (point.speed <= previous.speed) {
      throw new Error(
        'Performance curve speeds must be strictly increasing',
      )
    }
  }
}


}
