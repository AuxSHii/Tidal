import type { Vessel } from '../domain/vessel'
import { maximumPropulsionSpeed } from './propulsion'

export function clampVesselSpeed( requestedSpeed: number , vessel: Vessel,): number {
	if(requestedSpeed < 0) {
		return 0
	}

	if(requestedSpeed > vessel.maxSpeed){
		return vessel.maxSpeed
	}

	return requestedSpeed

}


//fxn for max feasible speed
export function maximumFeasibleSpeed(vessel: Vessel,): number  {
	const propulsionSpeed = maximumPropulsionSpeed(vessel)

	return Math.min(vessel.maxSpeed , propulsionSpeed,)
}

//fuxn for accelaration time[time vessel takes to accelate from ONE speed to ANOTHER]
export function accelerationTime(initialSpeed: number, targetSpeed: number, vessel: Vessel): number {
	if(initialSpeed < 0) {
		throw new Error('Initial speed cannot be negetive')
	}

	if(targetSpeed < 0) {
		throw new Error('target Speed cannot be negetive')
	}

  if(vessel.acceleration <= 0) {
    throw new Error('vessel accelaration must be greater than zero',)  
  }

  if (vessel.deceleration <= 0) {
     throw new Error('vessel deceleration must be greater then zeros',)
     
    }

  
  const speedChange = Math.abs(targetSpeed - initialSpeed,)

  if (initialSpeed <= targetSpeed) {
    return speedChange / vessel.acceleration
  }

return speedChange / vessel.deceleration

}

//fxn gives speed at a perticaualr time

export function speedAtTime(
  initialSpeed: number,
  targetSpeed: number,
  time: number,
  vessel: Vessel,
): number {
  if (initialSpeed < 0) {
    throw new Error('Initial speed cannot be negative')
  }

  if (targetSpeed < 0) {
    throw new Error('Target speed cannot be negative')
  }

  if (time < 0) {
    throw new Error('Time cannot be negative')
  }

  if (vessel.acceleration <= 0) {
    throw new Error(
      'Vessel acceleration must be greater than zero',
    )
  }

  const feasibleTarget =
    feasibleTargetSpeed(targetSpeed, vessel)

  const acceleration =
  initialSpeed <= feasibleTarget
    ? vessel.acceleration
    : vessel.deceleration

  const speedChange =
    acceleration * time


  const speed =
    initialSpeed + speedChange

  if (initialSpeed <= feasibleTarget) {
    return Math.min(speed, feasibleTarget)
  }

  return Math.max(
    initialSpeed - speedChange,
    feasibleTarget,
  )
}


//feasible target speed fxn

export function feasibleTargetSpeed(
  requestedSpeed: number,
  vessel: Vessel,
): number {
  if (requestedSpeed < 0) {
    throw new Error('Requested speed cannot be negative')
  }

  const maximumSpeed =
    maximumFeasibleSpeed(vessel)

  return Math.min(
    requestedSpeed,
    maximumSpeed,
  )
}

//fxn to get dist after moving with a speed and time - d=v0.t + 1/2.at^2 
export function distanceAtTime(
  initialSpeed: number,
  targetSpeed: number,
  time: number,
  vessel: Vessel,
): number {
  if (initialSpeed < 0) {
    throw new Error('Initial speed cannot be negative')
  }

  if (targetSpeed < 0) {
    throw new Error('Target speed cannot be negative')
  }

  if (time < 0) {
    throw new Error('Time cannot be negative')
  }

  if (vessel.acceleration <= 0) {
    throw new Error(
      'Vessel acceleration must be greater than zero',
    )
  }
  
  if (vessel.deceleration <= 0) {
    throw new Error('Vessel deceleration must be greater than zero',)
  
  }

  
  const feasibleTarget =
    feasibleTargetSpeed(targetSpeed, vessel)

  const accelerationTimeValue =
    accelerationTime(
      initialSpeed,
      feasibleTarget,
      vessel,
    )

  const effectiveTime = Math.min(
    time,
    accelerationTimeValue,
  )

  if (initialSpeed <= feasibleTarget) {
    return (
      initialSpeed * effectiveTime +
      0.5 *
        vessel.acceleration *
        effectiveTime *
        effectiveTime
    )
  }

  return (
    initialSpeed * effectiveTime -
    0.5 *
      vessel.deceleration *
      effectiveTime *
      effectiveTime
  )
}

//fxn for acceleration time adn speed  profile
export function distanceForSpeedChange(
  initialSpeed: number,
  targetSpeed: number,
  vessel: Vessel,
): number {
  if (initialSpeed < 0) {
    throw new Error('Initial speed cannot be negative')
  }

  if (targetSpeed < 0) {
    throw new Error('Target speed cannot be negative')
  }

  if (vessel.acceleration <= 0) {
    throw new Error(
      'Vessel acceleration must be greater than zero',
    )
  }

  if (vessel.deceleration <= 0) {
    throw new Error(
      'Vessel deceleration must be greater than zero',
    )
  }

  if (initialSpeed === targetSpeed) {
    return 0
  }

  if (initialSpeed < targetSpeed) {
    return (
      (targetSpeed * targetSpeed -
        initialSpeed * initialSpeed) /
      (2 * vessel.acceleration)
    )
  }

  return (
    (initialSpeed * initialSpeed -
      targetSpeed * targetSpeed) /
    (2 * vessel.deceleration)
  )
}


export function maximumReachableSpeed(
  initialSpeed: number,
  targetSpeed: number,
  distance: number,
  vessel: Vessel,
): number {
  if (initialSpeed < 0) {
    throw new Error('Initial speed cannot be negative')
  }

  if (targetSpeed < 0) {
    throw new Error('Target speed cannot be negative')
  }

  if (distance < 0) {
    throw new Error('Distance cannot be negative')
  }

  if (vessel.acceleration <= 0) {
    throw new Error(
      'Vessel acceleration must be greater than zero',
    )
  }

  const feasibleTarget =
    feasibleTargetSpeed(targetSpeed, vessel)

  if (initialSpeed >= feasibleTarget) {
    return feasibleTarget
  }

  const reachableSpeed = Math.sqrt(
    initialSpeed * initialSpeed +
      2 *
        vessel.acceleration *
        distance,
  )

  return Math.min(
    reachableSpeed,
    feasibleTarget,
  )
}

