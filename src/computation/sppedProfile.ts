import type { Vessel } from '../domain/vessel'
import type { SpeedProfile } from '../domain/speedProfile'
import { accelerationTime, distanceForSpeedChange } from './vesselMotion'
import { feasibleTargetSpeed } from './vesselMotion'

export function buildSpeedProfile(
  distance: number,
  initialSpeed: number,
  cruiseSpeed: number,
  finalSpeed: number,
  vessel: Vessel,
): SpeedProfile {
  if (distance < 0) {
    throw new Error('Distance cannot be negative')
  }

  if (initialSpeed < 0) {
    throw new Error('Initial speed cannot be negative')
  }

  if (cruiseSpeed < 0) {
    throw new Error('Cruise speed cannot be negative')
  }

  if (finalSpeed < 0) {
    throw new Error('Final speed cannot be negative')
  }

  const feasibleCruiseSpeed =
    feasibleTargetSpeed(cruiseSpeed, vessel)

  if (
    initialSpeed > feasibleCruiseSpeed ||
    finalSpeed > feasibleCruiseSpeed
  ) {
    throw new Error(
      'Initial and final speeds must not exceed cruise speed',
    )
  }

  const accelerationDistance =
    distanceForSpeedChange(
      initialSpeed,
      feasibleCruiseSpeed,
      vessel,
    )

  const decelerationDistance =
    distanceForSpeedChange(
      feasibleCruiseSpeed,
      finalSpeed,
      vessel,
    )

  const speedChangeDistance =
    accelerationDistance +
    decelerationDistance

  if (speedChangeDistance <= distance) {  //for short route
    const accelerationTimeValue =
      accelerationTime(
        initialSpeed,
        feasibleCruiseSpeed,
        vessel,
      )

    const decelerationTimeValue =
      accelerationTime(
        feasibleCruiseSpeed,
        finalSpeed,
        vessel,
      )

    const cruiseDistance =
      distance -
      speedChangeDistance

    const cruiseTime =
      feasibleCruiseSpeed > 0
        ? cruiseDistance / feasibleCruiseSpeed
        : 0

    return {
      acceleration: {
        initialSpeed,
        finalSpeed: feasibleCruiseSpeed,
        distance: accelerationDistance,
        time: accelerationTimeValue,
      },

      cruise: {
        initialSpeed: feasibleCruiseSpeed,
        finalSpeed: feasibleCruiseSpeed,
        distance: cruiseDistance,
        time: cruiseTime,
      },

      deceleration: {
        initialSpeed: feasibleCruiseSpeed,
        finalSpeed,
        distance: decelerationDistance,
        time: decelerationTimeValue,
      },

      totalDistance: distance,

      totalTime:
        accelerationTimeValue +
        cruiseTime +
        decelerationTimeValue,
    }
  }

  const numerator =
    distance +
    initialSpeed * initialSpeed /
      (2 * vessel.acceleration) +
    finalSpeed * finalSpeed /
      (2 * vessel.deceleration)

  const denominator =
    1 / (2 * vessel.acceleration) +
    1 / (2 * vessel.deceleration)

  const peakSpeed =
    Math.sqrt(numerator / denominator)

  const accelerationTimeValue =
    accelerationTime(
      initialSpeed,
      peakSpeed,
      vessel,
    )

  const decelerationTimeValue =
    accelerationTime(
      peakSpeed,
      finalSpeed,
      vessel,
    )

  const peakAccelerationDistance =
    distanceForSpeedChange(
      initialSpeed,
      peakSpeed,
      vessel,
    )

  const peakDecelerationDistance =
    distanceForSpeedChange(
      peakSpeed,
      finalSpeed,
      vessel,
    )

  return {
    acceleration: {
      initialSpeed,
      finalSpeed: peakSpeed,
      distance: peakAccelerationDistance,
      time: accelerationTimeValue,
    },

    cruise: {
      initialSpeed: peakSpeed,
      finalSpeed: peakSpeed,
      distance: 0,
      time: 0,
    },

    deceleration: {
      initialSpeed: peakSpeed,
      finalSpeed,
      distance: peakDecelerationDistance,
      time: decelerationTimeValue,
    },

    totalDistance:
      peakAccelerationDistance +
      peakDecelerationDistance,

    totalTime:
      accelerationTimeValue +
      decelerationTimeValue,
  }
}
